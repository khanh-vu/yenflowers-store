"""
Order/Checkout API routes.
Handles cart checkout, order creation, and payment processing.
"""
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from datetime import datetime, date
from supabase import Client

from app.database import get_supabase_admin
from app.config import get_settings
from app.schemas.schemas import OrderCreate, OrderResponse

router = APIRouter(prefix="/orders", tags=["Orders"])
settings = get_settings()


def generate_order_number() -> str:
    """Generate unique order number: YF-YYYYMMDD-XXX"""
    today = date.today().strftime("%Y%m%d")
    import random
    suffix = str(random.randint(100, 999))
    return f"YF-{today}-{suffix}"


def calculate_delivery_fee(district: str) -> int:
    """Calculate delivery fee based on district."""
    # In real app, fetch from settings table
    district_fees = {
        "1": 25000,
        "3": 25000,
        "5": 30000,
        "7": 35000,
        "tan_binh": 35000,
        "go_vap": 40000,
    }
    district_key = district.lower().replace(" ", "_").replace("quận ", "").replace("quan ", "")
    return district_fees.get(district_key, 35000)  # Default 35k VND


@router.post("/checkout", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    db: Client = Depends(get_supabase_admin)
):
    """
    Create a new order from cart items.
    Validates stock, calculates totals, and initiates payment.
    """
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Fetch product details and validate stock
    order_items = []
    subtotal = 0
    
    for item in order_data.items:
        product = db.table("products").select("*").eq("id", str(item.product_id)).execute()
        if not product.data:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
        
        prod = product.data[0]
        
        if not prod["is_published"]:
            raise HTTPException(status_code=400, detail=f"Product '{prod['name_vi']}' is not available")
        
        # Check stock
        if prod["stock_quantity"] < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for '{prod['name_vi']}'. Available: {prod['stock_quantity']}"
            )
        
        # Get variant if specified
        variant_name = None
        price_adjustment = 0
        if item.variant_id:
            variant = db.table("product_variants").select("*").eq("id", str(item.variant_id)).execute()
            if variant.data:
                variant_name = variant.data[0]["name_vi"]
                price_adjustment = variant.data[0].get("price_adjustment", 0)
        
        unit_price = (prod.get("sale_price") or prod["price"]) + price_adjustment
        total_price = unit_price * item.quantity
        
        order_items.append({
            "product_id": str(item.product_id),
            "variant_id": str(item.variant_id) if item.variant_id else None,
            "product_name": prod["name_vi"],
            "variant_name": variant_name,
            "quantity": item.quantity,
            "unit_price": unit_price,
            "total_price": total_price
        })
        
        subtotal += total_price
    
    # Calculate delivery fee
    shipping_fee = calculate_delivery_fee(order_data.shipping_address.district)
    
    # Apply discount code if provided
    discount_amount = 0
    if order_data.discount_code:
        discount = db.table("discount_codes").select("*").eq("code", order_data.discount_code.upper()).eq("is_active", True).execute()
        if discount.data:
            d = discount.data[0]
            # Check validity
            now = datetime.utcnow()
            if d.get("starts_at") and datetime.fromisoformat(d["starts_at"].replace("Z", "+00:00")) > now:
                pass  # Not started yet
            elif d.get("expires_at") and datetime.fromisoformat(d["expires_at"].replace("Z", "+00:00")) < now:
                pass  # Expired
            elif d.get("max_uses") and d.get("used_count", 0) >= d["max_uses"]:
                pass  # Max uses reached
            elif d.get("min_order_value") and subtotal < d["min_order_value"]:
                pass  # Min order not met
            else:
                # Apply discount
                if d["discount_type"] == "percentage":
                    discount_amount = int(subtotal * d["discount_value"] / 100)
                else:
                    discount_amount = int(d["discount_value"])
                
                # Increment used count
                db.table("discount_codes").update({"used_count": d.get("used_count", 0) + 1}).eq("id", d["id"]).execute()
    
    total = subtotal + shipping_fee - discount_amount
    
    # Create order
    order_number = generate_order_number()
    order = {
        "order_number": order_number,
        "shipping_address": order_data.shipping_address.model_dump(),
        "shipping_fee": shipping_fee,
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "total": total,
        "payment_method": order_data.payment_method,
        "customer_note": order_data.customer_note,
        "delivery_date": order_data.delivery_date,
        "delivery_time_slot": order_data.delivery_time_slot,
        "order_status": "pending",
        "payment_status": "pending"
    }
    
    result = db.table("orders").insert(order).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create order")
    
    order_id = result.data[0]["id"]
    
    # Create order items
    for item in order_items:
        item["order_id"] = order_id
        db.table("order_items").insert(item).execute()
    
    # Reduce stock
    for item in order_data.items:
        prod = db.table("products").select("stock_quantity").eq("id", str(item.product_id)).execute()
        if prod.data:
            new_qty = prod.data[0]["stock_quantity"] - item.quantity
            db.table("products").update({"stock_quantity": new_qty}).eq("id", str(item.product_id)).execute()
    
    # Return order with items
    order_response = result.data[0]
    order_response["items"] = order_items
    
    return order_response


@router.get("/{order_number}", response_model=OrderResponse)
async def get_order_by_number(
    order_number: str,
    db: Client = Depends(get_supabase_admin)
):
    """Get order by order number (for order tracking)."""
    order = db.table("orders").select("*").eq("order_number", order_number).execute()
    if not order.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    items = db.table("order_items").select("*").eq("order_id", order.data[0]["id"]).execute()
    
    order_data = order.data[0]
    order_data["items"] = items.data
    return order_data


@router.post("/{order_id}/payment/stripe")
async def create_stripe_checkout(
    order_id: UUID,
    db: Client = Depends(get_supabase_admin)
):
    """Create Stripe checkout session for an order."""
    import stripe
    stripe.api_key = settings.stripe_secret_key
    
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    order = db.table("orders").select("*").eq("id", str(order_id)).execute()
    if not order.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order_data = order.data[0]
    
    # Create Stripe checkout session
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "vnd",
                    "product_data": {
                        "name": f"YenFlowers Order #{order_data['order_number']}",
                    },
                    "unit_amount": order_data["total"],
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"http://localhost:5173/order-success?order={order_data['order_number']}",
            cancel_url=f"http://localhost:5173/checkout?order={order_data['order_number']}",
            metadata={"order_id": str(order_id)}
        )
        
        # Update order with payment intent
        db.table("orders").update({"payment_intent_id": session.id}).eq("id", str(order_id)).execute()
        
        return {"checkout_url": session.url, "session_id": session.id}
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook/stripe")
async def stripe_webhook(
    # In production, validate webhook signature
    payload: dict,
    db: Client = Depends(get_supabase_admin)
):
    """Handle Stripe webhook events."""
    event_type = payload.get("type")
    
    if event_type == "checkout.session.completed":
        session = payload.get("data", {}).get("object", {})
        order_id = session.get("metadata", {}).get("order_id")
        
        if order_id:
            db.table("orders").update({
                "payment_status": "paid",
                "order_status": "confirmed",
                "paid_at": datetime.utcnow().isoformat()
            }).eq("id", order_id).execute()
    
    return {"received": True}

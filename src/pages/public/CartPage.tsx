import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";

interface CartItem {
    id: string;
    name: string;
    variant: string;
    price: number;
    quantity: number;
    image: string;
}

// Mock cart data
const initialCartItems: CartItem[] = [
    {
        id: "1",
        name: "Classic Rose Bouquet",
        variant: "Large",
        price: 1200000,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?q=80&w=200",
    },
    {
        id: "2",
        name: "Lily Arrangement",
        variant: "Standard",
        price: 950000,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=200",
    },
];

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export default function CartPage() {
    const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
    const [promoCode, setPromoCode] = useState("");

    const updateQuantity = (id: string, delta: number) => {
        setCartItems((items) =>
            items.map((item) =>
                item.id === id
                    ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                    : item
            )
        );
    };

    const removeItem = (id: string) => {
        setCartItems((items) => items.filter((item) => item.id !== id));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 500000 ? 0 : 50000;
    const total = subtotal + shipping;

    if (cartItems.length === 0) {
        return (
            <>
                <SEO title="Cart - YenFlowers" description="Your shopping cart is empty." />
                <div className="min-h-screen bg-background">
                    <div className="mx-auto max-w-4xl px-4 py-20 text-center">
                        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
                        <h1 className="mt-6 text-3xl font-bold">Your cart is empty</h1>
                        <p className="mt-2 text-muted-foreground">
                            Looks like you haven't added any flowers yet.
                        </p>
                        <Link to="/products">
                            <Button size="lg" className="mt-8 rounded-xl">
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEO title="Cart - YenFlowers" description="Review your cart and checkout." />

            <div className="min-h-screen bg-background">
                <div className="mx-auto max-w-7xl px-4 py-8 lg:py-16">
                    <h1 className="mb-8 text-3xl font-extrabold tracking-tight lg:text-4xl">
                        Shopping Cart
                    </h1>

                    <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
                        {/* Cart Items */}
                        <div className="flex-1">
                            <div className="space-y-4">
                                {cartItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-4 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-card"
                                    >
                                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col justify-between">
                                            <div>
                                                <h3 className="font-medium">{item.name}</h3>
                                                <p className="text-sm text-primary">{item.variant}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-8 text-center font-medium">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <p className="font-semibold">
                                                    {formatPrice(item.price * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeItem(item.id)}
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Link to="/products" className="mt-6 inline-block">
                                <Button variant="outline" className="rounded-lg">
                                    Continue Shopping
                                </Button>
                            </Link>
                        </div>

                        {/* Order Summary */}
                        <div className="w-full lg:w-96">
                            <div className="sticky top-24 rounded-xl border border-black/10 bg-muted/30 p-6 dark:border-white/10 lg:p-8">
                                <h2 className="mb-6 text-2xl font-bold tracking-tight">
                                    Order Summary
                                </h2>

                                {/* Promo Code */}
                                <div className="mb-6">
                                    <label className="mb-1 block text-sm font-medium">
                                        Discount Code
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter code"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                            className="bg-background"
                                        />
                                        <Button variant="secondary" className="shrink-0">
                                            Apply
                                        </Button>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="space-y-2 border-t border-black/10 pt-4 dark:border-white/10">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal</span>
                                        <span className="font-medium">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Shipping</span>
                                        <span className="font-medium">
                                            {shipping === 0 ? "Free" : formatPrice(shipping)}
                                        </span>
                                    </div>
                                    {shipping === 0 && (
                                        <p className="text-xs text-green-600">
                                            Free shipping for orders over 500,000₫
                                        </p>
                                    )}
                                    <div className="flex justify-between border-t border-black/10 pt-2 text-lg font-bold dark:border-white/10">
                                        <span>Total</span>
                                        <span>{formatPrice(total)}</span>
                                    </div>
                                </div>

                                <Link to="/checkout">
                                    <Button size="lg" className="mt-6 w-full rounded-xl text-lg">
                                        Proceed to Checkout
                                    </Button>
                                </Link>

                                <p className="mt-4 text-center text-xs text-muted-foreground">
                                    Secure checkout powered by Stripe
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

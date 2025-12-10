import { Link } from "react-router-dom";
import { Truck, Phone, Mail, Printer, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

// Mock order data
const orderData = {
    orderId: "FVN1138295",
    items: [
        {
            id: "1",
            name: "The Saigon Darling Bouquet",
            quantity: 1,
            price: 1200000,
            image: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?q=80&w=200",
        },
        {
            id: "2",
            name: "Classic White Roses",
            quantity: 1,
            price: 850000,
            image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=200",
        },
    ],
    subtotal: 2050000,
    deliveryFee: 50000,
    total: 2100000,
    deliveryDate: "Tuesday, 28 May 2024",
    shippingAddress: {
        name: "Jane Doe",
        address: "123 Le Loi Street, District 1",
        city: "Ho Chi Minh City, Vietnam",
    },
};

const recommendations = [
    {
        id: "1",
        name: "Petite Lily Joy",
        price: 650000,
        image: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=300",
    },
    {
        id: "2",
        name: "Artisan Chocolate Box",
        price: 450000,
        image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=300",
    },
    {
        id: "3",
        name: "Jasmine Scented Candle",
        price: 380000,
        image: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?q=80&w=300",
    },
];

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export default function OrderConfirmationPage() {
    return (
        <>
            <SEO
                title="Order Confirmed - YenFlowers"
                description="Thank you for your order! Your order has been confirmed."
            />

            <div className="min-h-screen bg-background">
                <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="py-10 text-center">
                        <h1 className="text-4xl font-black leading-tight tracking-[-0.033em]">
                            Thank You for Your Order!
                        </h1>
                        <p className="mt-3 text-base text-muted-foreground">
                            Your Order #{orderData.orderId} is confirmed. We've sent a confirmation to your email address.
                        </p>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {/* Order Details */}
                        <div className="md:col-span-2">
                            <div className="overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-card">
                                <div className="flex items-center justify-between border-b border-black/10 px-6 pb-3 pt-5 dark:border-white/10">
                                    <h2 className="text-xl font-bold">Your Order</h2>
                                    <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                                        <Printer className="h-5 w-5" />
                                        Print
                                    </button>
                                </div>

                                {/* Order Items */}
                                <div className="divide-y divide-black/10 dark:divide-white/10">
                                    {orderData.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between gap-4 px-6 py-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="size-14 overflow-hidden rounded-lg bg-muted">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Quantity: {item.quantity}
                                                    </p>
                                                </div>
                                            </div>
                                            <p>{formatPrice(item.price)}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="space-y-3 border-t border-black/10 p-6 dark:border-white/10">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(orderData.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Delivery Fee</span>
                                        <span>{formatPrice(orderData.deliveryFee)}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold">
                                        <span>Total</span>
                                        <span>{formatPrice(orderData.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="flex flex-col gap-8 md:col-span-1">
                            {/* Delivery Details */}
                            <div className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-card">
                                <h3 className="mb-4 text-lg font-bold">Delivery Details</h3>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <p className="font-medium text-muted-foreground">Estimated Delivery</p>
                                        <p>{orderData.deliveryDate}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">Shipping to</p>
                                        <p>{orderData.shippingAddress.name}</p>
                                        <p>{orderData.shippingAddress.address}</p>
                                        <p>{orderData.shippingAddress.city}</p>
                                    </div>
                                </div>
                                <Button className="mt-6 w-full gap-2 rounded-xl">
                                    <Truck className="h-5 w-5" />
                                    Track Order
                                </Button>
                            </div>

                            {/* Need Help */}
                            <div className="rounded-xl border border-black/10 bg-white p-6 text-center dark:border-white/10 dark:bg-card">
                                <h3 className="mb-2 text-lg font-bold">Need Help?</h3>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Contact us for any questions about your order.
                                </p>
                                <div className="flex justify-center gap-4 text-sm">
                                    <a href="tel:+84123456789" className="flex items-center gap-1.5 font-bold text-primary hover:underline">
                                        <Phone className="h-4 w-4" />
                                        Hotline
                                    </a>
                                    <a href="mailto:support@yenflowers.vn" className="flex items-center gap-1.5 font-bold text-primary hover:underline">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="mt-12">
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl font-bold">You Might Also Like</h2>
                            <p className="mt-2 text-muted-foreground">
                                Perfect additions for your next occasion.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                            {recommendations.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex flex-col items-center rounded-xl border border-black/10 bg-white p-4 text-center dark:border-white/10 dark:bg-card"
                                >
                                    <div className="mb-4 h-40 w-full overflow-hidden rounded-lg bg-muted">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <h4 className="text-base font-bold">{product.name}</h4>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {formatPrice(product.price)}
                                    </p>
                                    <Button variant="secondary" className="mt-4 w-full gap-2 rounded-xl">
                                        <ShoppingCart className="h-4 w-4" />
                                        Add to Cart
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Continue Shopping */}
                    <div className="mt-12 flex justify-center">
                        <Link to="/products">
                            <Button variant="outline" size="lg" className="rounded-xl">
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                </main>
            </div>
        </>
    );
}

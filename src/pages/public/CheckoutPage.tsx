import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, CreditCard, Truck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
const cartItems: CartItem[] = [
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

export default function CheckoutPage() {
    const [paymentMethod, setPaymentMethod] = useState("momo");
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
        district: "District 1",
        giftMessage: "",
        deliveryDate: "",
        deliveryTime: "morning",
    });

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = 50000;
    const total = subtotal + shipping;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Order submitted:", { formData, paymentMethod, cartItems });
        // TODO: Handle order submission
    };

    return (
        <>
            <SEO title="Checkout - YenFlowers" description="Complete your order." />

            <div className="min-h-screen bg-background">
                <div className="mx-auto max-w-7xl px-4 py-8 lg:py-16">
                    <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
                        {/* Order Summary - Left on large screens */}
                        <div className="order-2 w-full lg:order-1 lg:w-2/5">
                            <div className="sticky top-24 rounded-xl border border-black/10 bg-muted/30 p-6 dark:border-white/10 lg:p-8">
                                <div className="flex items-center justify-between border-b border-black/10 pb-4 dark:border-white/10">
                                    <h2 className="text-2xl font-bold tracking-tight">Order Summary</h2>
                                    <Link to="/cart" className="text-sm font-medium text-primary hover:underline">
                                        Edit Cart
                                    </Link>
                                </div>

                                {/* Cart Items */}
                                <div className="space-y-4 border-b border-black/10 py-4 dark:border-white/10">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="h-16 w-16 overflow-hidden rounded-lg bg-muted">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary/80 text-xs font-bold text-white">
                                                        {item.quantity}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium line-clamp-1">{item.name}</p>
                                                    <p className="text-sm text-primary">{item.variant}</p>
                                                </div>
                                            </div>
                                            <p className="shrink-0 font-semibold">{formatPrice(item.price)}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="space-y-2 py-4">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal</span>
                                        <span className="font-medium">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Shipping</span>
                                        <span className="font-medium">{formatPrice(shipping)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span>{formatPrice(total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Checkout Form - Right on large screens */}
                        <div className="order-1 w-full lg:order-2 lg:w-3/5">
                            <h1 className="mb-8 text-3xl font-extrabold tracking-tight lg:text-4xl">
                                Checkout
                            </h1>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Express Checkout */}
                                <div className="rounded-xl border border-black/10 bg-muted/30 p-6 dark:border-white/10">
                                    <h3 className="mb-4 text-xl font-bold">Express Checkout</h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <Button variant="outline" type="button" className="h-12 bg-black text-white hover:bg-black/90">
                                            Apple Pay
                                        </Button>
                                        <Button variant="outline" type="button" className="h-12">
                                            Google Pay
                                        </Button>
                                    </div>
                                </div>

                                <div className="relative flex items-center">
                                    <div className="flex-grow border-t border-black/10 dark:border-white/10" />
                                    <span className="mx-4 shrink-0 text-sm text-muted-foreground">OR CONTINUE WITH</span>
                                    <div className="flex-grow border-t border-black/10 dark:border-white/10" />
                                </div>

                                {/* Shipping Information */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold">1. Shipping Information</h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label htmlFor="name">Recipient's Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="e.g. Jane Doe"
                                                className="mt-1"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="+84 123 456 789"
                                                className="mt-1"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label htmlFor="address">Street Address</Label>
                                            <Input
                                                id="address"
                                                placeholder="123 Nguyen Hue Street"
                                                className="mt-1"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="district">District</Label>
                                            <select
                                                id="district"
                                                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                                                value={formData.district}
                                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                            >
                                                <option>District 1</option>
                                                <option>District 2 (Thu Duc City)</option>
                                                <option>District 3</option>
                                                <option>District 7</option>
                                                <option>Binh Thanh</option>
                                                <option>Phu Nhuan</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                value="Ho Chi Minh City"
                                                disabled
                                                className="mt-1 bg-muted/50"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label htmlFor="gift-message">Gift Message (Optional)</Label>
                                            <Textarea
                                                id="gift-message"
                                                placeholder="Write a message to the recipient..."
                                                rows={3}
                                                className="mt-1"
                                                value={formData.giftMessage}
                                                onChange={(e) => setFormData({ ...formData, giftMessage: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Delivery Details */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold">2. Delivery Details</h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label htmlFor="delivery-date">Delivery Date</Label>
                                            <Input
                                                id="delivery-date"
                                                type="date"
                                                className="mt-1"
                                                value={formData.deliveryDate}
                                                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="delivery-time">Delivery Time Slot</Label>
                                            <select
                                                id="delivery-time"
                                                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                                                value={formData.deliveryTime}
                                                onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                                            >
                                                <option value="morning">Morning (9am - 12pm)</option>
                                                <option value="afternoon">Afternoon (1pm - 5pm)</option>
                                                <option value="evening">Evening (6pm - 8pm)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold">3. Payment Method</h3>
                                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                                        <div className={`flex items-center gap-3 rounded-lg border p-4 ${paymentMethod === "momo" ? "border-primary bg-primary/5" : "border-black/10 dark:border-white/10"}`}>
                                            <RadioGroupItem value="momo" id="payment-momo" />
                                            <Label htmlFor="payment-momo" className="flex-grow cursor-pointer font-medium">
                                                MoMo E-Wallet
                                            </Label>
                                            <Wallet className="h-5 w-5 text-pink-500" />
                                        </div>
                                        <div className={`flex items-center gap-3 rounded-lg border p-4 ${paymentMethod === "card" ? "border-primary bg-primary/5" : "border-black/10 dark:border-white/10"}`}>
                                            <RadioGroupItem value="card" id="payment-card" />
                                            <Label htmlFor="payment-card" className="flex-grow cursor-pointer font-medium">
                                                Credit/Debit Card
                                            </Label>
                                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className={`flex items-center gap-3 rounded-lg border p-4 ${paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-black/10 dark:border-white/10"}`}>
                                            <RadioGroupItem value="cod" id="payment-cod" />
                                            <Label htmlFor="payment-cod" className="flex-grow cursor-pointer font-medium">
                                                Cash on Delivery (COD)
                                            </Label>
                                            <Truck className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Submit Button */}
                                <Button type="submit" size="lg" className="w-full rounded-xl py-6 text-lg">
                                    <Lock className="mr-2 h-5 w-5" />
                                    Place Order
                                </Button>

                                <p className="text-center text-xs text-muted-foreground">
                                    By placing your order, you agree to our{" "}
                                    <a href="#" className="underline">Terms of Service</a> and{" "}
                                    <a href="#" className="underline">Privacy Policy</a>.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

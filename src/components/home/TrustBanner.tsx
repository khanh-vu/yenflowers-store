import { Truck, Clock, Shield, CreditCard } from "lucide-react";

export function TrustBanner() {
    return (
        <section className="px-4 pb-10 sm:px-6 md:px-8 lg:px-10">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-card md:justify-between">
                    <div className="flex items-center gap-3">
                        <Truck className="h-6 w-6 text-primary" />
                        <div className="text-sm">
                            <p className="font-bold text-foreground">Free Shipping</p>
                            <p className="text-muted-foreground">Orders over 500k</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Clock className="h-6 w-6 text-primary" />
                        <div className="text-sm">
                            <p className="font-bold text-foreground">Same-Day Delivery</p>
                            <p className="text-muted-foreground">Order before 2pm</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Shield className="h-6 w-6 text-primary" />
                        <div className="text-sm">
                            <p className="font-bold text-foreground">Freshness Guaranteed</p>
                            <p className="text-muted-foreground">7-day guarantee</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6 text-primary" />
                        <div className="text-sm">
                            <p className="font-bold text-foreground">Secure Payment</p>
                            <p className="text-muted-foreground">Multiple options</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}


export function PaymentTrustBadges() {
    return (
        <div className="bg-muted/30 py-12">
            <div className="container">
                <div className="text-center mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                        Phương Thức Thanh Toán
                    </h3>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6">
                    {/* Payment Methods */}
                    <div className="bg-white px-6 py-3 rounded-lg shadow-sm border border-border flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">Visa / Mastercard</span>
                    </div>

                    <div className="bg-white px-6 py-3 rounded-lg shadow-sm border border-border flex items-center gap-2">
                        <span className="font-bold text-primary text-sm">MOMO</span>
                    </div>

                    <div className="bg-white px-6 py-3 rounded-lg shadow-sm border border-border flex items-center gap-2">
                        <Truck className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">COD - Tiền mặt</span>
                    </div>

                    <div className="bg-white px-6 py-3 rounded-lg shadow-sm border border-border flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-sm text-green-600">SSL Secured</span>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    Mọi giao dịch được bảo mật với công nghệ mã hóa SSL 256-bit
                </p>
            </div>
        </div>
    );
}

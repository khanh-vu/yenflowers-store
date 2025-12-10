import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flower2, Paintbrush, Leaf, Truck } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function AboutPage() {
    return (
        <>
            <SEO
                title="About Us - YenFlowers"
                description="Discover the passion and craft that goes into every floral arrangement from our Ho Chi Minh City boutique."
            />

            <div className="min-h-screen bg-background">
                {/* Hero Section */}
                <section className="px-4 py-10 sm:px-6 md:px-8 lg:px-10">
                    <div className="mx-auto max-w-4xl">
                        <div
                            className="flex min-h-[480px] flex-col items-center justify-center gap-6 rounded-xl bg-cover bg-center bg-no-repeat p-6 text-center"
                            style={{
                                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%), url("/hero-banner.jpg")`,
                            }}
                        >
                            <div className="flex max-w-2xl flex-col gap-3">
                                <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-white md:text-5xl">
                                    The Story Behind Every Bloom
                                </h1>
                                <p className="text-base font-normal leading-normal text-white/90 md:text-lg">
                                    Discover the passion and craft that goes into every floral arrangement from our Ho Chi Minh City boutique.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Story & Mission Section */}
                <section className="px-4 py-10 sm:px-6 md:px-8 lg:px-10">
                    <div className="mx-auto max-w-4xl">
                        <div className="flex flex-col gap-8 md:flex-row md:items-center">
                            <div className="md:w-1/2">
                                <h2 className="mb-4 text-3xl font-bold leading-tight tracking-[-0.015em] text-foreground">
                                    Our Story & Mission
                                </h2>
                                <p className="text-base font-normal leading-relaxed text-muted-foreground">
                                    From a lifelong passion for flowers to a dream realized in the heart of Ho Chi Minh City,
                                    our journey is rooted in bringing joy, beauty, and a touch of nature into people's lives
                                    through uniquely crafted floral arrangements. We believe every bloom has a story, and our
                                    mission is to help you tell yours, whether it's for a grand celebration or a simple moment
                                    of personal delight.
                                </p>
                            </div>
                            <div className="md:w-1/2">
                                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                                    <img
                                        src="https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800"
                                        alt="Florist arranging flowers"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Our Promise Section */}
                <section className="px-4 py-10 sm:px-6 md:px-8 lg:px-10">
                    <div className="mx-auto max-w-4xl text-center">
                        <h2 className="mb-2 text-3xl font-bold leading-tight tracking-[-0.015em] text-foreground">
                            Our Promise
                        </h2>
                        <p className="mx-auto mb-10 max-w-2xl text-muted-foreground">
                            Details that define our commitment to quality and beauty.
                        </p>
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                            <div className="flex flex-col items-center gap-4 rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-card">
                                <div className="flex size-14 items-center justify-center rounded-full bg-primary/20 text-primary">
                                    <Flower2 className="h-7 w-7" />
                                </div>
                                <h3 className="text-lg font-bold">Freshness Guaranteed</h3>
                                <p className="text-sm text-muted-foreground">
                                    We source the freshest flowers daily from local growers to ensure long-lasting beauty.
                                </p>
                            </div>
                            <div className="flex flex-col items-center gap-4 rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-card">
                                <div className="flex size-14 items-center justify-center rounded-full bg-primary/20 text-primary">
                                    <Paintbrush className="h-7 w-7" />
                                </div>
                                <h3 className="text-lg font-bold">Hand-Crafted Artistry</h3>
                                <p className="text-sm text-muted-foreground">
                                    Each bouquet is a unique piece of art, thoughtfully designed by our expert florists.
                                </p>
                            </div>
                            <div className="flex flex-col items-center gap-4 rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-card">
                                <div className="flex size-14 items-center justify-center rounded-full bg-primary/20 text-primary">
                                    <Leaf className="h-7 w-7" />
                                </div>
                                <h3 className="text-lg font-bold">Sourced Locally</h3>
                                <p className="text-sm text-muted-foreground">
                                    Supporting our community by partnering with the best floral farms in and around HCMC.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Banner */}
                <section className="px-4 py-10 sm:px-6 md:px-8 lg:px-10">
                    <div className="mx-auto max-w-4xl">
                        <div className="flex flex-col items-center gap-6 rounded-xl bg-primary/10 p-8 text-center sm:p-12">
                            <Truck className="h-12 w-12 text-primary" />
                            <h2 className="text-3xl font-bold leading-tight tracking-[-0.015em] text-foreground">
                                Bring Home a Piece of Beauty
                            </h2>
                            <p className="max-w-xl text-muted-foreground">
                                Explore our curated collections of bouquets, arrangements, and workshops.
                                Find the perfect expression of nature's art for your home or loved ones.
                            </p>
                            <Link to="/products">
                                <Button size="lg" className="rounded-xl">
                                    Shop Our Collections
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

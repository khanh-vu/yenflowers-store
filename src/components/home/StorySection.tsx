
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function StorySection() {
    return (
        <section className="px-4 py-10 sm:px-6 md:px-8 lg:px-10">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col items-center gap-10 rounded-xl border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-card md:flex-row md:gap-16 lg:p-12">
                    {/* Image Side */}
                    <div className="w-full flex-shrink-0 md:w-1/2">
                        <div className="aspect-[4/3] overflow-hidden rounded-xl">
                            <img
                                src="https://images.unsplash.com/photo-1591196144888-0f074d2091df?q=80&w=1000"
                                alt="Florist arranging premium flowers with care"
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="flex w-full flex-col gap-6 md:w-1/2">
                        <h2 className="text-3xl font-bold leading-tight tracking-[-0.015em] text-foreground lg:text-4xl">
                            Our Story
                        </h2>
                        <p className="text-base text-muted-foreground leading-relaxed">
                            Born from a passion for flowers and a commitment to excellence, YenFlowers has been
                            delivering joy across Ho Chi Minh City for over 10 years. Each bouquet is a labor
                            of love, handcrafted by our skilled florists using only the freshest blooms.
                        </p>
                        <p className="text-base text-muted-foreground leading-relaxed">
                            We believe that flowers are more than just gifts—they're expressions of love,
                            gratitude, and celebration. That's why we pour our hearts into every arrangement,
                            ensuring each one tells a unique story.
                        </p>
                        <Link to="/about">
                            <Button
                                variant="outline"
                                className="mt-4 rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                                Learn More About Us
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

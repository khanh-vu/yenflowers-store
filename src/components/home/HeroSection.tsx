
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function HeroSection() {
    return (
        <section className="px-4 py-10 sm:px-6 md:px-8 lg:px-10">
            <div className="mx-auto flex max-w-7xl flex-col">
                <div
                    className="flex min-h-[60vh] flex-col items-center justify-center gap-6 rounded-xl bg-cover bg-center bg-no-repeat p-4 text-center md:gap-8 lg:p-8"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("/hero-banner.jpg")`,
                    }}
                >
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-white md:text-6xl">
                            Artfully Crafted Flowers, Delivered Fresh in Saigon
                        </h1>
                        <h2 className="mx-auto max-w-2xl text-base font-normal leading-normal text-white/90 md:text-lg">
                            Experience the beauty of handcrafted bouquets made with the freshest daily blooms.
                        </h2>
                    </div>
                    <Link to="/products">
                        <Button
                            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary h-12 px-5 text-base font-bold leading-normal tracking-[0.015em] text-primary-foreground hover:bg-primary/90"
                        >
                            <span className="truncate">Shop Our Best Sellers</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

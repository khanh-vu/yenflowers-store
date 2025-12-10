import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/services/api";
import type { Category } from "@/types";

// Fallback occasions if API fails
const fallbackOccasions = [
    {
        name: "Birthdays",
        slug: "birthday",
        image: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?q=80&w=800"
    },
    {
        name: "Anniversaries",
        slug: "anniversary",
        image: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=800"
    },
    {
        name: "Congratulations",
        slug: "congratulations",
        image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?q=80&w=800"
    },
    {
        name: "Thank You",
        slug: "thank-you",
        image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=800"
    }
];

export function CategoryGrid() {
    const { data: categories, isLoading } = useQuery({
        queryKey: ['public-categories'],
        queryFn: () => publicApi.getCategories(),
    });

    // Use API categories or fallback
    const displayCategories = categories?.filter(cat => cat.is_active).slice(0, 4) || [];
    const occasions = displayCategories.length > 0
        ? displayCategories.map((cat: Category) => ({
            name: cat.name_vi || cat.name_en,
            slug: cat.slug,
            image: cat.image_url || fallbackOccasions[0].image
        }))
        : fallbackOccasions;

    if (isLoading) {
        return (
            <section className="px-4 pb-10 sm:px-6 md:px-8 lg:px-10">
                <div className="mx-auto flex max-w-7xl flex-col">
                    <h2 className="px-4 pb-3 pt-5 text-2xl font-bold leading-tight tracking-[-0.015em] text-foreground">
                        Shop by Occasion
                    </h2>
                    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="px-4 pb-10 sm:px-6 md:px-8 lg:px-10">
            <div className="mx-auto flex max-w-7xl flex-col">
                <h2 className="px-4 pb-3 pt-5 text-2xl font-bold leading-tight tracking-[-0.015em] text-foreground">
                    Shop by Occasion
                </h2>
                <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    {occasions.map((occasion) => (
                        <Link
                            key={occasion.slug}
                            to={`/products?category=${occasion.slug}`}
                            className="group relative flex h-64 items-end justify-start overflow-hidden rounded-xl p-6 text-white"
                        >
                            <div
                                className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-300 ease-in-out group-hover:scale-105"
                                style={{
                                    backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url("${occasion.image}")`
                                }}
                            />
                            <h3 className="relative z-10 text-xl font-bold">{occasion.name}</h3>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

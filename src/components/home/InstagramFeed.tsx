import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/services/api";

export function InstagramFeed() {
    const { data, isLoading } = useQuery({
        queryKey: ['social_feed', 'snippet'],
        queryFn: () => publicApi.getSocialFeed(1, 6)
    });

    const posts = data?.items || [];
    const instagramUrl = "https://www.instagram.com/yen_flowers/";

    if (isLoading) return null;

    return (
        <section className="px-4 py-10 sm:px-6 md:px-8 lg:px-10">
            <div className="mx-auto flex max-w-7xl flex-col">
                <div className="mb-6 flex items-center justify-between px-4">
                    <h2 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-foreground">
                        Follow Us @yen_flowers
                    </h2>
                    <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button
                            variant="outline"
                            className="rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                            <Instagram className="mr-2 h-4 w-4" />
                            View Instagram
                        </Button>
                    </a>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-6">
                    {posts.map((post) => (
                        <a
                            key={post.id}
                            href={post.permalink || instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-xl"
                        >
                            <img
                                src={post.image_url}
                                alt={post.caption || "Instagram post"}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                                <Instagram className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}

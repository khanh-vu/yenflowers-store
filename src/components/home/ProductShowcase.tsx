import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/services/api";
import type { Product } from "@/types";

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export function ProductShowcase() {
    const { data: productsResponse, isLoading, error } = useQuery({
        queryKey: ['featured-products'],
        queryFn: () => publicApi.getFeaturedProducts(8),
    });

    const products = productsResponse?.items || [];

    return (
        <section className="px-4 pb-10 sm:px-6 md:px-8 lg:px-10">
            <div className="mx-auto flex max-w-7xl flex-col">
                <h2 className="px-4 pb-3 pt-5 text-2xl font-bold leading-tight tracking-[-0.015em] text-foreground">
                    Daily Bouquets
                </h2>

                {isLoading ? (
                    <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex items-stretch gap-4 p-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex h-full w-64 flex-shrink-0 flex-col gap-4 overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-card">
                                    <div className="w-full aspect-[3/4] rounded-t-xl bg-muted animate-pulse" />
                                    <div className="flex flex-1 flex-col justify-between gap-4 p-4 pt-0">
                                        <div>
                                            <div className="h-5 bg-muted rounded w-3/4 mb-2 animate-pulse" />
                                            <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                                        </div>
                                        <div className="h-10 bg-muted rounded-xl animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : error || products.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No featured products available</p>
                    </div>
                ) : (
                    <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex items-stretch gap-4 p-4">
                            {products.map((product: Product) => (
                                <div
                                    key={product.id}
                                    className="flex h-full w-64 flex-shrink-0 flex-col gap-4 overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-card"
                                >
                                    <Link to={`/products/${product.slug}`}>
                                        <div
                                            className="w-full bg-cover bg-center bg-no-repeat aspect-[3/4] rounded-t-xl"
                                            style={{
                                                backgroundImage: `url("${product.images?.[0]?.url || 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?q=80&w=500'}")`
                                            }}
                                        />
                                    </Link>
                                    <div className="flex flex-1 flex-col justify-between gap-4 p-4 pt-0">
                                        <div>
                                            <Link to={`/products/${product.slug}`}>
                                                <p className="text-base font-medium leading-normal text-foreground hover:text-primary transition-colors">
                                                    {product.name_vi || product.name_en}
                                                </p>
                                            </Link>
                                            <p className="text-sm font-normal leading-normal text-primary">
                                                {product.sale_price && product.sale_price < product.price ? (
                                                    <>
                                                        <span className="line-through text-muted-foreground mr-2">
                                                            {formatPrice(product.price)}
                                                        </span>
                                                        {formatPrice(product.sale_price)}
                                                    </>
                                                ) : (
                                                    formatPrice(product.price)
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-black/5 text-sm font-bold leading-normal tracking-[0.015em] text-foreground dark:bg-white/5 hover:bg-primary hover:text-primary-foreground transition-colors"
                                        >
                                            <span className="truncate">Add to Cart</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link to="/products">
                        <Button
                            variant="outline"
                            className="rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8"
                        >
                            View All Products
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

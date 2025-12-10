import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/types";

interface ProductCardProps {
    product: Product;
    viewMode?: "grid" | "list";
}

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export function ProductCard({ product, viewMode = "grid" }: ProductCardProps) {
    const discount = product.sale_price && product.sale_price < product.price
        ? Math.round((1 - product.sale_price / product.price) * 100)
        : null;

    if (viewMode === "list") {
        return (
            <div className="group flex flex-col overflow-hidden rounded-xl border border-primary/10 bg-white transition-shadow hover:shadow-lg dark:bg-card sm:flex-row">
                <Link to={`/products/${product.slug}`} className="sm:w-1/3">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                        <img
                            src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?q=80&w=500'}
                            alt={product.name_vi}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {discount && (
                            <Badge className="absolute right-3 top-3 border-none bg-red-100 text-red-800">
                                -{discount}%
                            </Badge>
                        )}
                    </div>
                </Link>

                <div className="flex flex-1 flex-col justify-center p-6">
                    <Link to={`/products/${product.slug}`}>
                        <h3 className="font-serif text-xl transition-colors group-hover:text-primary">
                            {product.name_vi}
                        </h3>
                    </Link>

                    {product.short_description_vi && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {product.short_description_vi}
                        </p>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                        <p className="font-medium text-primary">
                            {product.sale_price && product.sale_price < product.price ? (
                                <>
                                    <span className="mr-2 text-sm text-muted-foreground line-through">
                                        {formatPrice(product.price)}
                                    </span>
                                    <span>{formatPrice(product.sale_price)}</span>
                                </>
                            ) : (
                                <span>{formatPrice(product.price)}</span>
                            )}
                        </p>

                        <Button size="sm" className="rounded-full">
                            <ShoppingCart className="mr-1 h-4 w-4" />
                            Add to Cart
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Grid view (default)
    return (
        <div className="group flex flex-col text-center">
            <Link to={`/products/${product.slug}`}>
                <div className="relative overflow-hidden">
                    <img
                        src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?q=80&w=500'}
                        alt={product.name_vi}
                        loading="lazy"
                        className="aspect-[4/5] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />

                    {/* Badges */}
                    {product.is_featured && (
                        <span className="absolute left-3 top-3 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                            New Arrival
                        </span>
                    )}

                    {discount && (
                        <span className="absolute right-3 top-3 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
                            -{discount}%
                        </span>
                    )}

                    {product.stock_quantity === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold">
                                Out of Stock
                            </span>
                        </div>
                    )}

                    {/* Quick Add Button - slides up on hover */}
                    <button className="absolute bottom-4 left-1/2 flex -translate-x-1/2 translate-y-2 items-center justify-center whitespace-nowrap rounded-full bg-white/90 px-6 py-2 text-sm font-semibold text-foreground opacity-0 transition-all duration-300 hover:bg-primary hover:text-white group-hover:bottom-6 group-hover:translate-y-0 group-hover:opacity-100">
                        Quick Add
                    </button>
                </div>
            </Link>

            <div className="pt-4">
                <Link to={`/products/${product.slug}`}>
                    <h3 className="font-serif text-xl transition-colors group-hover:text-primary">
                        {product.name_vi}
                    </h3>
                </Link>
                <p className="mt-1 font-medium text-primary">
                    {product.sale_price && product.sale_price < product.price ? (
                        <>
                            <span className="mr-2 text-sm text-muted-foreground line-through">
                                {formatPrice(product.price)}
                            </span>
                            <span>{formatPrice(product.sale_price)}</span>
                        </>
                    ) : (
                        <span>{formatPrice(product.price)}</span>
                    )}
                </p>
            </div>
        </div>
    );
}

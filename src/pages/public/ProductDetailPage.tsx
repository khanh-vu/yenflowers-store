import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/services/api";
import { ChevronRight, Minus, Plus, Truck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SEO } from "@/components/SEO";
import { ProductCard } from "./components/ProductCard";

function formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

const sizes = [
    { id: "standard", label: "Standard", priceAdd: 0 },
    { id: "deluxe", label: "Deluxe", priceAdd: 300000 },
    { id: "grande", label: "Grande", priceAdd: 600000 },
];

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState("standard");
    const [giftMessage, setGiftMessage] = useState("");

    // Fetch product details
    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', id],
        queryFn: () => publicApi.getProductById(id!),
        enabled: !!id,
    });

    // Fetch related products (same category)
    const { data: relatedProducts } = useQuery({
        queryKey: ['related-products', product?.category_id],
        queryFn: () => publicApi.getProducts({
            category_id: product?.category_id,
            page_size: 4,
            is_published: true,
        }),
        enabled: !!product?.category_id,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                        <div className="animate-pulse">
                            <div className="aspect-square rounded-xl bg-muted" />
                            <div className="mt-4 grid grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="aspect-square rounded-lg bg-muted" />
                                ))}
                            </div>
                        </div>
                        <div className="animate-pulse space-y-4">
                            <div className="h-10 w-3/4 rounded bg-muted" />
                            <div className="h-6 w-1/2 rounded bg-muted" />
                            <div className="h-24 rounded bg-muted" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <h2 className="mb-4 font-serif text-2xl font-bold">Product not found</h2>
                    <Link to="/products">
                        <Button className="rounded-xl">Back to Shop</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const images = product.images && product.images.length > 0
        ? product.images.map(img => img.url)
        : ['https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?q=80&w=1000'];

    const selectedSizeData = sizes.find(s => s.id === selectedSize) || sizes[0];
    const finalPrice = (product.sale_price || product.price) + selectedSizeData.priceAdd;

    return (
        <>
            <SEO
                title={product.name_vi}
                description={product.short_description_vi || `Order ${product.name_vi} at YenFlowers`}
                image={images[0]}
                type="product"
            />

            <div className="min-h-screen bg-background">
                {/* Breadcrumbs */}
                <div className="px-4 py-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Link to="/" className="transition-colors hover:text-primary">Home</Link>
                            <ChevronRight className="h-4 w-4" />
                            <Link to="/products" className="transition-colors hover:text-primary">Shop</Link>
                            <ChevronRight className="h-4 w-4" />
                            <span className="font-medium text-foreground">{product.name_vi}</span>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-4 py-5 sm:px-6 sm:py-10 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                            {/* Image Gallery */}
                            <div className="flex flex-col gap-4">
                                {/* Main Image */}
                                <div className="aspect-square w-full overflow-hidden rounded-xl bg-muted">
                                    <img
                                        src={images[selectedImageIndex]}
                                        alt={product.name_vi}
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                {/* Thumbnails */}
                                {images.length > 1 && (
                                    <div className="grid grid-cols-4 gap-4">
                                        {images.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedImageIndex(idx)}
                                                className={`aspect-square overflow-hidden rounded-lg transition-all ${selectedImageIndex === idx
                                                    ? "border-2 border-primary"
                                                    : "opacity-70 hover:opacity-100"
                                                    }`}
                                            >
                                                <img
                                                    src={img}
                                                    alt={`${product.name_vi} - ${idx + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="flex flex-col gap-6">
                                {/* Title & Subtitle */}
                                <div className="flex flex-col gap-2">
                                    <h1 className="font-serif text-4xl font-black leading-tight tracking-[-0.033em]">
                                        {product.name_vi}
                                    </h1>
                                    {product.short_description_vi && (
                                        <p className="text-lg text-muted-foreground">
                                            {product.short_description_vi}
                                        </p>
                                    )}
                                </div>

                                {/* Price & Rating */}
                                <div className="flex items-center gap-4">
                                    <p className="text-4xl font-bold text-primary">{formatPrice(finalPrice)}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center text-primary">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star key={star} className="h-5 w-5 fill-current" />
                                            ))}
                                        </div>
                                        <span className="text-sm text-muted-foreground">(12 Reviews)</span>
                                    </div>
                                </div>

                                {/* Description */}
                                {product.description_vi && (
                                    <p className="text-sm leading-relaxed text-foreground/90">
                                        {product.description_vi.replace(/<[^>]*>/g, '').substring(0, 200)}...
                                    </p>
                                )}

                                {/* Size Selection */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-sm font-bold">Size</label>
                                    <div className="flex gap-2">
                                        {sizes.map((size) => (
                                            <button
                                                key={size.id}
                                                onClick={() => setSelectedSize(size.id)}
                                                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${selectedSize === size.id
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-primary/20 bg-white text-foreground/70 hover:border-primary/50"
                                                    }`}
                                            >
                                                {size.label}
                                                {size.priceAdd > 0 && (
                                                    <span className="ml-1 text-xs">
                                                        (+{formatPrice(size.priceAdd)})
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Personalized Note */}
                                <div className="flex flex-col gap-3">
                                    <label className="text-sm font-bold">Personalized Note</label>
                                    <Textarea
                                        placeholder="Add a message (optional)"
                                        rows={3}
                                        value={giftMessage}
                                        onChange={(e) => setGiftMessage(e.target.value)}
                                        className="rounded-lg border-primary/20 focus:border-primary"
                                    />
                                </div>

                                {/* Quantity & Add to Cart */}
                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-white px-3 py-2">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="text-foreground/50 hover:text-primary"
                                        >
                                            <Minus className="h-5 w-5" />
                                        </button>
                                        <span className="px-4 font-bold">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="text-foreground/50 hover:text-primary"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <Button className="h-12 flex-1 gap-2 rounded-xl text-base font-bold">
                                        Add to Cart
                                    </Button>
                                </div>

                                {/* Delivery Info */}
                                <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-white p-4">
                                    <Truck className="mt-1 h-5 w-5 text-primary" />
                                    <div className="flex flex-col">
                                        <p className="text-sm font-bold">HCMC Delivery</p>
                                        <p className="text-sm text-foreground/80">
                                            Same-day delivery available for orders placed before 2 PM. Check rates at checkout.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Related Products */}
                        {relatedProducts && relatedProducts.items.length > 0 && (
                            <div className="mt-16 sm:mt-24">
                                <h3 className="mb-6 text-2xl font-bold">You Might Also Like</h3>
                                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
                                    {relatedProducts.items.filter(p => p.id !== product.id).slice(0, 4).map((relatedProduct) => (
                                        <ProductCard key={relatedProduct.id} product={relatedProduct} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

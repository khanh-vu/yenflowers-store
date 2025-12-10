import { Card, CardContent } from '@/components/ui/card';
import { useRecommendations, useTrackRecommendationClick } from '@/hooks/useAI';
import { Sparkles, Loader2 } from 'lucide-react';
import type { Product } from '@/types';
import { Link } from 'react-router-dom';

interface RecommendationsWidgetProps {
    context: 'homepage' | 'pdp' | 'cart';
    productId?: string;
    title?: string;
    limit?: number;
    className?: string;
}

export function RecommendationsWidget({
    context,
    productId,
    title,
    limit = 10,
    className = '',
}: RecommendationsWidgetProps) {
    const { recommendations, loading, error } = useRecommendations(context, productId, limit);
    const trackClick = useTrackRecommendationClick();

    const defaultTitles = {
        homepage: 'Đề xuất dành cho bạn',
        pdp: 'Sản phẩm liên quan',
        cart: 'Bạn có thể thích',
    };

    const displayTitle = title || defaultTitles[context];

    if (loading) {
        return (
            <div className={`flex items-center justify-center py-8 ${className}`}>
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error || !recommendations.length) {
        return null; // Silent fail - don't show anything if no recommendations
    }

    const handleProductClick = (clickedProduct: Product, position: number) => {
        const recommendedIds = recommendations.map(r => r.id);
        trackClick(recommendedIds, clickedProduct.id, context, position);
    };

    return (
        <section className={`recommendations-widget ${className}`}>
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <h2 className="text-2xl font-bold">{displayTitle}</h2>
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    AI
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {recommendations.map((product, index) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onClick={() => handleProductClick(product, index)}
                    />
                ))}
            </div>
        </section>
    );
}

interface ProductCardProps {
    product: Product;
    onClick: () => void;
}

function ProductCard({ product, onClick }: ProductCardProps) {
    const displayPrice = product.sale_price || product.price;
    const hasDiscount = !!product.sale_price;
    const mainImage = Array.isArray(product.images) && product.images.length > 0
        ? product.images[0].url
        : null;

    return (
        <Link
            to={`/products/${product.id}`}
            onClick={onClick}
            className="block group"
        >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {mainImage && (
                    <div className="aspect-square overflow-hidden bg-gray-100">
                        <img
                            src={mainImage}
                            alt={product.name_vi}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                )}
                <CardContent className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 min-h-[40px]">
                        {product.name_vi}
                    </h3>
                    <div className="mt-2">
                        {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through mr-2">
                                {product.price.toLocaleString('vi-VN')}₫
                            </span>
                        )}
                        <span className={`font-bold ${hasDiscount ? 'text-red-500' : 'text-gray-900'}`}>
                            {displayPrice.toLocaleString('vi-VN')}₫
                        </span>
                    </div>
                    {hasDiscount && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                            Giảm giá
                        </span>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}

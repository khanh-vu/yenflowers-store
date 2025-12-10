import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { aiApi } from '@/services/ai-api';
import type { Product } from '@/types';

interface VisualSearchWidgetProps {
    onResults?: (results: Product[]) => void;
    className?: string;
}

export function VisualSearchWidget({ onResults, className = '' }: VisualSearchWidgetProps) {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageSelect = useCallback((file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image too large (max 10MB)');
            return;
        }

        setSelectedImage(file);
        setError(null);

        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageSelect(file);
        }
    };

    const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageSelect(file);
        }
    };

    const handleClearImage = () => {
        setSelectedImage(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setResults([]);
        setError(null);
    };

    const handleSearch = async () => {
        if (!selectedImage) return;

        setLoading(true);
        setError(null);

        try {
            const searchResults = await aiApi.visualSearch(selectedImage, 20, 0.3);
            setResults(searchResults.results);

            if (onResults) {
                onResults(searchResults.results);
            }
        } catch (err) {
            console.error('Visual search error:', err);
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    // Paste from clipboard
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                if (file) {
                    handleImageSelect(file);
                }
                break;
            }
        }
    }, [handleImageSelect]);

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Tìm bằng hình ảnh
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                        AI
                    </span>
                </CardTitle>
                <p className="text-sm text-gray-500">
                    Tải lên hoặc chụp ảnh hoa để tìm sản phẩm tương tự
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Upload Area */}
                {!selectedImage ? (
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
                        onPaste={handlePaste}
                    >
                        <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-sm text-gray-600 mb-4">
                            Kéo thả ảnh vào đây hoặc
                        </p>

                        <div className="flex gap-3 justify-center">
                            {/* File Upload */}
                            <label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInput}
                                    className="hidden"
                                />
                                <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                                    <span>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Chọn ảnh
                                    </span>
                                </Button>
                            </label>

                            {/* Camera Capture (mobile) */}
                            <label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleCameraCapture}
                                    className="hidden"
                                />
                                <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                                    <span>
                                        <Camera className="h-4 w-4 mr-2" />
                                        Chụp ảnh
                                    </span>
                                </Button>
                            </label>
                        </div>

                        <p className="text-xs text-gray-400 mt-3">
                            JPEG, PNG, WebP • Max 10MB
                        </p>
                    </div>
                ) : (
                    /* Image Preview */
                    <div className="relative">
                        <img
                            src={previewUrl!}
                            alt="Preview"
                            className="w-full max-h-64 object-contain rounded-lg border"
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={handleClearImage}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Search Button */}
                {selectedImage && !loading && results.length === 0 && (
                    <Button
                        onClick={handleSearch}
                        className="w-full"
                        size="lg"
                    >
                        <Camera className="h-4 w-4 mr-2" />
                        Tìm sản phẩm tương tự
                    </Button>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                        <span className="ml-3 text-gray-600">Đang tìm kiếm...</span>
                    </div>
                )}

                {/* Results */}
                {results.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">
                                Tìm thấy {results.length} sản phẩm tương tự
                            </h3>
                            <Button variant="outline" size="sm" onClick={handleClearImage}>
                                Tìm ảnh khác
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {results.slice(0, 6).map((product) => (
                                <VisualSearchResultCard key={product.id} product={product} />
                            ))}
                        </div>

                        {results.length > 6 && (
                            <Button variant="link" className="w-full mt-2">
                                Xem tất cả {results.length} kết quả →
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface VisualSearchResultCardProps {
    product: Product & { similarity?: number };
}

function VisualSearchResultCard({ product }: VisualSearchResultCardProps) {
    const displayPrice = product.sale_price || product.price;
    const mainImage = Array.isArray(product.images) && product.images.length > 0
        ? product.images[0].url
        : null;

    return (
        <a
            href={`/products/${product.id}`}
            className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        >
            {mainImage && (
                <div className="aspect-square overflow-hidden bg-gray-100">
                    <img
                        src={mainImage}
                        alt={product.name_vi || 'Product'}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="p-2">
                <h4 className="text-xs font-medium line-clamp-2 mb-1">
                    {product.name_vi}
                </h4>
                <p className="text-sm font-bold text-purple-600">
                    {displayPrice.toLocaleString('vi-VN')}₫
                </p>
                {product.similarity && (
                    <p className="text-xs text-gray-500 mt-1">
                        {Math.round(product.similarity * 100)}% khớp
                    </p>
                )}
            </div>
        </a>
    );
}

// Compact button version for adding to existing pages
export function VisualSearchButton({ onResults }: { onResults?: (results: Product[]) => void }) {
    const [showWidget, setShowWidget] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setShowWidget(true)}
                className="flex items-center gap-2"
            >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Tìm bằng ảnh</span>
            </Button>

            {showWidget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <VisualSearchWidget
                            onResults={(results) => {
                                if (onResults) onResults(results);
                                setShowWidget(false);
                            }}
                        />
                        <div className="p-4 border-t">
                            <Button
                                variant="ghost"
                                onClick={() => setShowWidget(false)}
                                className="w-full"
                            >
                                Đóng
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

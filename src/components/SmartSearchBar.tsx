import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, TrendingUp } from 'lucide-react';
import { aiApi, getSessionId } from '@/services/ai-api';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

interface SmartSearchBarProps {
    onSearch?: (query: string) => void;
    className?: string;
    placeholder?: string;
    autoFocus?: boolean;
}

export function SmartSearchBar({
    onSearch,
    className = '',
    placeholder = 'Tìm kiếm... (vd: "hoa hồng đỏ giá 500k")',
    autoFocus = false
}: SmartSearchBarProps) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    // Get autocomplete suggestions
    useEffect(() => {
        if (debouncedQuery && debouncedQuery.length >= 2) {
            aiApi.getSearchSuggestions(debouncedQuery, 5)
                .then(result => {
                    setSuggestions(result.suggestions);
                    setShowSuggestions(true);
                })
                .catch(console.error);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [debouncedQuery]);

    const handleSearch = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setShowSuggestions(false);

        if (onSearch) {
            onSearch(searchQuery);
        } else {
            // Navigate to search results page
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    }, [onSearch, navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(query);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion);
        handleSearch(suggestion);
    };

    return (
        <div className={`relative ${className}`}>
            <form onSubmit={handleSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(suggestions.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={placeholder}
                    className="pl-10 pr-20"
                    autoFocus={autoFocus}
                />
                <Button
                    type="submit"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    disabled={!query.trim()}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tìm'}
                </Button>
            </form>

            {/* Autocomplete suggestions */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                            <span>{suggestion}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* AI hint */}
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">AI</span>
                <span>Hỗ trợ tìm kiếm thông minh: giá, dịp, quận huyện...</span>
            </div>
        </div>
    );
}

// Search Results Page Component
interface SearchResultsProps {
    initialQuery?: string;
}

export function SmartSearchResults({ initialQuery = '' }: SearchResultsProps) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<Product[]>([]);
    const [intent, setIntent] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const sessionId = getSessionId();

    useEffect(() => {
        if (query) {
            performSearch(query);
        }
    }, [query]);

    const performSearch = async (searchQuery: string) => {
        setLoading(true);
        try {
            const response = await aiApi.search({
                query: searchQuery,
                session_id: sessionId,
                limit: 20,
            });

            setResults(response.results);
            setIntent(response.intent);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="search-results-page">
            <div className="mb-6">
                <SmartSearchBar
                    onSearch={setQuery}
                    placeholder="Tìm kiếm sản phẩm..."
                    autoFocus
                />
            </div>

            {/* Parsed Intent Display */}
            {Object.keys(intent).length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                        🔍 AI hiểu rằng bạn đang tìm:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {intent.occasion && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                Dịp: {intent.occasion}
                            </span>
                        )}
                        {intent.price_max && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                Giá: ≤ {intent.price_max.toLocaleString()}₫
                            </span>
                        )}
                        {intent.flower_type && (
                            <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded">
                                Loại: {intent.flower_type}
                            </span>
                        )}
                        {intent.color && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                Màu: {intent.color}
                            </span>
                        )}
                        {intent.district && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                                Khu vực: {intent.district}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : results.length > 0 ? (
                <div>
                    <p className="text-sm text-gray-600 mb-4">
                        Tìm thấy {results.length} sản phẩm
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {results.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            ) : query ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Thử tìm kiếm với từ khóa khác
                    </p>
                </div>
            ) : null}
        </div>
    );
}

// Simple Product Card for search results
function ProductCard({ product }: { product: Product }) {
    const displayPrice = product.sale_price || product.price;
    const hasDiscount = !!product.sale_price;
    const mainImage = Array.isArray(product.images) && product.images.length > 0
        ? product.images[0].url
        : null;

    return (
        <a href={`/products/${product.id}`} className="block group">
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {mainImage && (
                    <div className="aspect-square overflow-hidden bg-gray-100">
                        <img
                            src={mainImage}
                            alt={product.name_vi}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                )}
                <div className="p-3">
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
                </div>
            </div>
        </a>
    );
}

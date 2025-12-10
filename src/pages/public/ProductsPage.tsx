import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/services/api";
import { ChevronRight, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./components/ProductCard";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { SEO } from "@/components/SEO";

const occasions = [
    "Love & Romance",
    "Congratulations",
    "Birthday",
    "Sympathy",
];

const flowerTypes = [
    "Roses",
    "Orchids",
    "Lilies",
    "Seasonal",
];

const collections = [
    "Signature Collection",
    "Luxury Bouquets",
    "Vase Arrangements",
];

const colors = [
    { name: "Red", class: "bg-red-400" },
    { name: "Pink", class: "bg-pink-300" },
    { name: "Yellow", class: "bg-yellow-300" },
    { name: "Purple", class: "bg-purple-400" },
    { name: "White", class: "bg-white border-gray-300" },
    { name: "Orange", class: "bg-orange-400" },
];

export default function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [openSections, setOpenSections] = useState({
        occasion: true,
        flowerType: false,
        collection: false,
    });

    // Extract filter params from URL
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");

    // Fetch products
    const { data, isLoading, error } = useQuery({
        queryKey: ['products', category, search, sort, page],
        queryFn: () => publicApi.getProducts({
            category_id: category,
            search,
            page,
            page_size: 12,
            is_published: true,
        }),
    });

    const handleFilterChange = (key: string, value: string | null) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    const handlePageChange = (newPage: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("page", String(newPage));
        setSearchParams(newParams);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const products = data?.items || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / 12);

    const SidebarFilters = () => (
        <div className="sticky top-28 space-y-8">
            {/* Occasion Filter */}
            <details open={openSections.occasion} className="group border-t border-primary/20 py-2">
                <summary
                    className="flex cursor-pointer items-center justify-between gap-6 py-2"
                    onClick={(e) => { e.preventDefault(); toggleSection("occasion"); }}
                >
                    <p className="font-bold text-foreground">Shop by Occasion</p>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openSections.occasion ? "rotate-180" : ""}`} />
                </summary>
                {openSections.occasion && (
                    <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                        {occasions.map((occasion) => (
                            <button key={occasion} className="block w-full text-left hover:text-primary transition-colors">
                                {occasion}
                            </button>
                        ))}
                    </div>
                )}
            </details>

            {/* Flower Type Filter */}
            <details className="group border-t border-primary/20 py-2">
                <summary
                    className="flex cursor-pointer items-center justify-between gap-6 py-2"
                    onClick={(e) => { e.preventDefault(); toggleSection("flowerType"); }}
                >
                    <p className="font-bold text-foreground">Shop by Flower Type</p>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openSections.flowerType ? "rotate-180" : ""}`} />
                </summary>
                {openSections.flowerType && (
                    <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                        {flowerTypes.map((type) => (
                            <button key={type} className="block w-full text-left hover:text-primary transition-colors">
                                {type}
                            </button>
                        ))}
                    </div>
                )}
            </details>

            {/* Collection Filter */}
            <details className="group border-t border-b border-primary/20 py-2">
                <summary
                    className="flex cursor-pointer items-center justify-between gap-6 py-2"
                    onClick={(e) => { e.preventDefault(); toggleSection("collection"); }}
                >
                    <p className="font-bold text-foreground">Shop by Collection</p>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${openSections.collection ? "rotate-180" : ""}`} />
                </summary>
                {openSections.collection && (
                    <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                        {collections.map((collection) => (
                            <button key={collection} className="block w-full text-left hover:text-primary transition-colors">
                                {collection}
                            </button>
                        ))}
                    </div>
                )}
            </details>

            {/* Price Range */}
            <div className="space-y-4">
                <p className="font-bold text-foreground">Price Range</p>
                <input
                    type="range"
                    min="100000"
                    max="5000000"
                    defaultValue="2500000"
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary bg-primary/20"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>100,000 VNĐ</span>
                    <span>5,000,000 VNĐ</span>
                </div>
            </div>

            {/* Color Filter */}
            <div className="space-y-4">
                <p className="font-bold text-foreground">Color</p>
                <div className="flex flex-wrap gap-3">
                    {colors.map((color) => (
                        <button
                            key={color.name}
                            className={`size-8 rounded-full border-2 border-transparent focus:border-primary ${color.class}`}
                            title={color.name}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <SEO
                title="Our Collections - YenFlowers"
                description="Discover our curated selection of fresh, artisanal flower arrangements for every occasion."
            />

            <div className="min-h-screen bg-background">
                {/* Hero Banner */}
                <div className="px-4 py-8 sm:px-6 md:px-8 lg:px-10">
                    <div className="mx-auto max-w-7xl">
                        <div
                            className="flex min-h-[320px] flex-col justify-end overflow-hidden rounded-xl bg-cover bg-center lg:min-h-[400px]"
                            style={{
                                backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 40%), url("/hero-banner.jpg")`,
                            }}
                        >
                            <div className="p-8">
                                <h1 className="max-w-2xl text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                                    Fresh from the Highlands, Delivered in HCMC
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-4 pb-16 sm:px-6 md:px-8 lg:px-10">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
                            {/* Sidebar Filters - Desktop */}
                            <aside className="hidden w-full flex-shrink-0 lg:block lg:w-1/4 xl:w-1/5">
                                <SidebarFilters />
                            </aside>

                            {/* Product Grid */}
                            <div className="w-full lg:w-3/4 xl:w-4/5">
                                {/* Breadcrumbs & Sort */}
                                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <Link to="/" className="text-muted-foreground hover:text-primary">Home</Link>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        <Link to="/products" className="text-muted-foreground hover:text-primary">Shop</Link>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium text-foreground">All Flowers</span>
                                        <span className="ml-2 text-muted-foreground">
                                            ({isLoading ? "..." : `${total} products`})
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-medium text-muted-foreground">Sort by:</label>
                                            <select
                                                className="rounded-lg border border-primary/30 bg-background px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                                                value={sort}
                                                onChange={(e) => handleFilterChange("sort", e.target.value)}
                                            >
                                                <option value="popularity">Popularity</option>
                                                <option value="newest">Newest</option>
                                                <option value="price-asc">Price: Low to High</option>
                                                <option value="price-desc">Price: High to Low</option>
                                            </select>
                                        </div>

                                        {/* Mobile Filter Button */}
                                        <Sheet>
                                            <SheetTrigger asChild>
                                                <Button variant="outline" size="sm" className="rounded-lg lg:hidden">
                                                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                                                    Filters
                                                </Button>
                                            </SheetTrigger>
                                            <SheetContent side="left" className="w-80">
                                                <h2 className="mb-6 text-lg font-bold">Filters</h2>
                                                <SidebarFilters />
                                            </SheetContent>
                                        </Sheet>
                                    </div>
                                </div>

                                {/* Products */}
                                {isLoading ? (
                                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="animate-pulse">
                                                <div className="h-80 rounded-lg bg-muted" />
                                                <div className="mt-4 h-5 w-3/4 rounded bg-muted" />
                                                <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                                            </div>
                                        ))}
                                    </div>
                                ) : error || products.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <p className="mb-2 text-lg text-muted-foreground">No products found</p>
                                        <p className="mb-6 text-sm text-muted-foreground">Try adjusting your filters</p>
                                        <Button onClick={() => setSearchParams({})}>Clear All Filters</Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                                            {products.map((product) => (
                                                <ProductCard key={product.id} product={product} />
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <nav className="mt-12 flex items-center justify-center border-t border-primary/20 pt-12">
                                                <div className="flex items-center -space-x-px">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={page === 1}
                                                        onClick={() => handlePageChange(page - 1)}
                                                        className="rounded-l-lg rounded-r-none"
                                                    >
                                                        <ChevronRight className="h-4 w-4 rotate-180" />
                                                    </Button>
                                                    {[...Array(totalPages)].map((_, i) => (
                                                        <Button
                                                            key={i + 1}
                                                            variant={page === i + 1 ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => handlePageChange(i + 1)}
                                                            className="rounded-none"
                                                        >
                                                            {i + 1}
                                                        </Button>
                                                    ))}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={page === totalPages}
                                                        onClick={() => handlePageChange(page + 1)}
                                                        className="rounded-l-none rounded-r-lg"
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </nav>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

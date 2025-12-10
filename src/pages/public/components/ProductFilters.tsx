import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import type { Category } from "@/types";

interface ProductFiltersProps {
    categories: Category[];
    selectedCategory?: string;
    onCategoryChange: (categorySlug: string | null) => void;
    onSortChange: (sort: string) => void;
    currentSort: string;
}

export function ProductFilters({
    categories,
    selectedCategory,
    onCategoryChange,
    onSortChange,
    currentSort,
}: ProductFiltersProps) {
    const [openSections, setOpenSections] = useState({
        category: true,
        price: true,
        sort: true,
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const activeCategories = categories.filter(cat => cat.is_active);

    return (
        <div className="space-y-6">
            {/* Sort */}
            <div>
                <button
                    onClick={() => toggleSection("sort")}
                    className="mb-3 flex w-full items-center justify-between text-left font-semibold text-foreground"
                >
                    Sort By
                    <span className="text-xs text-muted-foreground">{openSections.sort ? "−" : "+"}</span>
                </button>

                {openSections.sort && (
                    <RadioGroup value={currentSort} onValueChange={onSortChange}>
                        <div className="mb-2 flex items-center space-x-2">
                            <RadioGroupItem value="newest" id="sort-newest" />
                            <Label htmlFor="sort-newest" className="cursor-pointer text-sm">Newest</Label>
                        </div>
                        <div className="mb-2 flex items-center space-x-2">
                            <RadioGroupItem value="price-asc" id="sort-price-asc" />
                            <Label htmlFor="sort-price-asc" className="cursor-pointer text-sm">Price: Low to High</Label>
                        </div>
                        <div className="mb-2 flex items-center space-x-2">
                            <RadioGroupItem value="price-desc" id="sort-price-desc" />
                            <Label htmlFor="sort-price-desc" className="cursor-pointer text-sm">Price: High to Low</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="popular" id="sort-popular" />
                            <Label htmlFor="sort-popular" className="cursor-pointer text-sm">Popularity</Label>
                        </div>
                    </RadioGroup>
                )}
            </div>

            <Separator />

            {/* Categories */}
            <div>
                <button
                    onClick={() => toggleSection("category")}
                    className="mb-3 flex w-full items-center justify-between text-left font-semibold text-foreground"
                >
                    Category
                    <span className="text-xs text-muted-foreground">{openSections.category ? "−" : "+"}</span>
                </button>

                {openSections.category && (
                    <div className="space-y-1">
                        <button
                            onClick={() => onCategoryChange(null)}
                            className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${!selectedCategory
                                    ? "bg-primary/10 font-medium text-primary"
                                    : "hover:bg-muted"
                                }`}
                        >
                            All Categories
                        </button>

                        {activeCategories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => onCategoryChange(category.slug)}
                                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${selectedCategory === category.slug
                                        ? "bg-primary/10 font-medium text-primary"
                                        : "hover:bg-muted"
                                    }`}
                            >
                                {category.name_vi}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <Separator />

            {/* Price Range */}
            <div>
                <button
                    onClick={() => toggleSection("price")}
                    className="mb-3 flex w-full items-center justify-between text-left font-semibold text-foreground"
                >
                    Price Range
                    <span className="text-xs text-muted-foreground">{openSections.price ? "−" : "+"}</span>
                </button>

                {openSections.price && (
                    <div className="space-y-1">
                        <button className="block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted">
                            Under 500,000 VNĐ
                        </button>
                        <button className="block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted">
                            500,000 - 1,000,000 VNĐ
                        </button>
                        <button className="block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted">
                            1,000,000 - 2,000,000 VNĐ
                        </button>
                        <button className="block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted">
                            Over 2,000,000 VNĐ
                        </button>
                    </div>
                )}
            </div>

            {/* Clear Filters */}
            {selectedCategory && (
                <>
                    <Separator />
                    <Button
                        variant="outline"
                        className="w-full rounded-lg"
                        onClick={() => onCategoryChange(null)}
                    >
                        Clear Filters
                    </Button>
                </>
            )}
        </div>
    );
}

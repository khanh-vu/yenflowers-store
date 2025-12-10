import type { Product, Category } from '@/types';

// Helper to get localized field based on current language
export const getLocalizedField = <T extends Record<string, any>>(
    obj: T,
    field: string,
    language: string
): string => {
    const localizedKey = `${field}_${language}`;
    const fallbackKey = `${field}_vi`; // Vietnamese as fallback

    return obj[localizedKey] || obj[fallbackKey] || obj[field] || '';
};

// Specific helper for products
export const getProductName = (product: Product, language: string): string => {
    return getLocalizedField(product, 'name', language);
};

export const getProductDescription = (product: Product, language: string): string | undefined => {
    const desc = getLocalizedField(product, 'description', language);
    return desc || undefined;
};

export const getProductShortDescription = (product: Product, language: string): string | undefined => {
    const desc = getLocalizedField(product, 'short_description', language);
    return desc || undefined;
};

// Specific helper for categories
export const getCategoryName = (category: Category, language: string): string => {
    return getLocalizedField(category, 'name', language);
};

export const getCategoryDescription = (category: Category, language: string): string | undefined => {
    const desc = getLocalizedField(category, 'description', language);
    return desc || undefined;
};

// ==========================================
// AI Features API
// ==========================================

import type { Product } from '@/types';

const API_BASE = 'http://localhost:8000/api/v1';

// Helper function for JSON API requests
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const config: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    };

    const response = await fetch(url, config);
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(error.detail || `HTTP error ${response.status}`);
    }
    return response.json();
}

export interface RecommendationRequest {
    user_id?: string;
    context: 'homepage' | 'pdp' | 'cart';
    product_id?: string;
    limit?: number;
}

export interface SearchRequest {
    query: string;
    user_id?: string;
    session_id: string;
    limit?: number;
}

export interface InteractionEvent {
    session_id: string;
    event_type: 'view' | 'add_to_cart' | 'remove_from_cart' | 'purchase' | 'search';
    product_id?: string;
    category_id?: string;
    user_id?: string;
    metadata?: Record<string, any>;
}

export const aiApi = {
    // Get product recommendations
    getRecommendations: (req: RecommendationRequest) =>
        apiRequest<{ success: boolean; recommendations: Product[]; algorithm: string }>('/ai/recommendations', {
            method: 'POST',
            body: JSON.stringify(req),
        }),

    // Get trending products
    getTrending: (limit = 10) =>
        apiRequest<{ success: boolean; products: Product[]; period: string }>(`/ai/recommendations/trending?limit=${limit}`),

    // Get related products
    getRelatedProducts: (productId: string, limit = 10) =>
        apiRequest<{ success: boolean; product_id: string; related_products: Product[] }>(`/ai/recommendations/related/${productId}?limit=${limit}`),

    // Smart search with NLP
    search: (req: SearchRequest) =>
        apiRequest<{
            success: boolean;
            query: string;
            intent: Record<string, any>;
            results: Product[];
            count: number;
        }>('/ai/search', {
            method: 'POST',
            body: JSON.stringify(req),
        }),

    // Visual search by image upload
    visualSearch: async (imageFile: File, limit = 20, minSimilarity = 0.3) => {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await fetch(`${API_BASE}/ai/visual-search?limit=${limit}&min_similarity=${minSimilarity}`, {
            method: 'POST',
            body: formData, // Don't set Content-Type header, browser will set it with boundary
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Visual search failed' }));
            throw new Error(error.detail || `HTTP error ${response.status}`);
        }

        return response.json() as Promise<{
            success: boolean;
            query_type: string;
            results: (Product & { similarity: number })[];
            count: number;
        }>;
    },

    // Get search suggestions (autocomplete)
    getSearchSuggestions: (query: string, limit = 5) =>
        apiRequest<{ success: boolean; query: string; suggestions: string[] }>(`/ai/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`),

    // Track user interaction
    trackInteraction: (event: InteractionEvent) =>
        apiRequest<{ success: boolean }>('/ai/track', {
            method: 'POST',
            body: JSON.stringify(event),
        }),

    // Track recommendation click
    trackRecommendationClick: (data: {
        user_id?: string;
        session_id: string;
        recommended_products: string[];
        clicked_product_id: string;
        context: string;
        algorithm: string;
        position: number;
    }) =>
        apiRequest<{ success: boolean }>('/ai/recommendations/track-click', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// Utility function to get or create session ID
export function getSessionId(): string {
    let sessionId = sessionStorage.getItem('yenflowers_session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('yenflowers_session_id', sessionId);
    }
    return sessionId;
}

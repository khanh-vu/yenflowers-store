# 🤖 AI Features - Smart Recommendations & Search

This document provides setup and usage guidelines for the AI-powered features in YenFlowers.

## 🚀 Quick Start

### 1. Run Database Migration

Apply the AI infrastructure migration to add required tables:

```bash
# Via Supabase dashboard SQL editor
# Copy and run: supabase/migrations/004_ai_infrastructure.sql
```

### 2. API Endpoints

All AI endpoints are available at `/api/v1/ai/*`:

- **POST** `/api/v1/ai/recommendations` - Get product recommendations
- **GET** `/api/v1/ai/recommendations/trending` - Trending products
- **POST** `/api/v1/ai/search` - Smart search with NLP
- **GET** `/api/v1/ai/search/suggestions` - Autocomplete  
- **POST** `/api/v1/ai/track` - Track user interactions

See full API documentation: http://localhost:8000/docs

### 3. Frontend Components

```tsx
// Smart Recommendations Widget
import { RecommendationsWidget } from '@/components/RecommendationsWidget';

<RecommendationsWidget context="homepage" limit={10} />

// Smart Search Bar
import { SmartSearchBar } from '@/components/SmartSearchBar';

<SmartSearchBar placeholder="Search flowers..." />
```

## 📊 Features

### Smart Recommendations
- Hybrid filtering (collaborative + content-based)
- Context-aware (homepage, product page, cart)
- Automatic tracking and learning

### Smart Search
- Vietnamese NLP for natural queries
- Examples: "hoa hồng đỏ giá 500k", "hoa sinh nhật quận 1"
- Autocomplete suggestions
- Intent parsing (price, occasion, location, color)

## 📝 Implementation Files

**Backend:**
- `backend/app/routers/ai.py` - API endpoints
- `backend/app/services/recommendations.py` - Recommendation engine
- `backend/app/services/smart_search.py` - NLP search
- `supabase/migrations/004_ai_infrastructure.sql` - Database

**Frontend:**
- `src/components/RecommendationsWidget.tsx`
- `src/components/SmartSearchBar.tsx`
- `src/hooks/useAI.ts`
- `src/services/ai-api.ts`

## 🧪 Testing

```bash
# Test recommendations
curl -X POST http://localhost:8000/api/v1/ai/recommendations \
  -H "Content-Type: application/json" \
  -d '{"context": "homepage", "limit": 5}'

# Test smart search  
curl -X POST http://localhost:8000/api/v1/ai/search \
  -H "Content-Type: application/json" \
  -d '{"query": "hoa hồng đỏ giá 500k", "session_id": "test", "limit": 10}'
```

For detailed documentation, see project proposal: `implementation_plan.md`

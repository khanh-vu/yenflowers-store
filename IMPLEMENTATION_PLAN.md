# Yenflowers Store - Comprehensive Implementation Plan

## 1. Project Overview

| Item | Details |
|------|---------|
| **Business** | Yen Flowers - Flower Shop in Ho Chi Minh City, Vietnam |
| **Facebook Page** | https://www.facebook.com/Flowers.Yen |
| **Instagram** | https://www.instagram.com/yen_flowers/ |
| **Reference Site** | https://floraholic.vn/ (Premium flower e-commerce) |
| **Languages** | Vietnamese (primary), English |

---

## 2. Technical Architecture

### Stack Overview
| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript + Vite | SPA with SSR-ready architecture |
| **State** | Zustand / React Context | Cart, User, Language state |
| **Styling** | TBD (External UI/UX Design) | CSS Modules / Tailwind post-design |
| **Backend** | Python (FastAPI) | API, Business Logic, Social Sync |
| **Database** | Supabase (PostgreSQL) | Products, Orders, Users, Blog, Translations |
| **Auth** | Supabase Auth | Email/Social Login |
| **Payments** | Stripe + PayPal | Credit Card & PayPal checkout |
| **Media** | Supabase Storage + Facebook CDN | Product images, Blog assets |
| **i18n** | react-i18next | EN/VI translations |
| **SEO** | Next.js (or Vite SSR plugin) | Meta tags, structured data, sitemap |

### Folder Structure (Proposed)
```
yenflowers-store/
├── frontend/               # React + TypeScript
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-based pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Zustand state
│   │   ├── i18n/           # Translation files (en.json, vi.json)
│   │   ├── services/       # API client (Supabase, backend)
│   │   └── App.tsx
│   └── public/
├── backend/                # Python FastAPI
│   ├── app/
│   │   ├── routers/        # API routes (products, orders, sync)
│   │   ├── services/       # Business logic
│   │   │   ├── fb_sync.py  # Facebook Page API integration
│   │   │   ├── instagram_sync.py # Instagram Basic Display API
│   │   │   └── payment.py  # Stripe/PayPal handlers
│   │   ├── models/         # Pydantic models
│   │   └── main.py         # FastAPI app entry
│   └── requirements.txt
├── supabase/               # Database schema & migrations
│   └── migrations/
└── IMPLEMENTATION_PLAN.md
```

---

## 3. Core Features Breakdown

### 3.1 Product Catalog & Categories
**Goal:** Display flowers organized by occasion, type, and price.

| Feature | Details |
|---------|---------|
| Product Listing | Grid view with lazy-load images, "Add to Cart" quick action |
| Categories | Occasions (Birthday, Wedding, Sympathy), Types (Roses, Orchids, Mixed), Price Range |
| Filters/Sort | By price, popularity, newest |
| Product Detail | Gallery, Description (VI/EN), Price, Stock status, Related products |
| **Data Source** | Supabase `products` table + synced from Facebook |

**Supabase Schema (`products`):**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_vi TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  description_vi TEXT,
  description_en TEXT,
  price NUMERIC(10,2) NOT NULL,
  category_id UUID REFERENCES categories(id),
  images JSONB, -- Array of URLs
  fb_post_id TEXT, -- Link to original FB post if synced
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 3.2 Blog Posts
**Goal:** SEO-rich content about flower care, trends, occasions.

| Feature | Details |
|---------|---------|
| Blog Listing | Card grid with featured image, title, excerpt |
| Blog Detail | Full content with images, share buttons, related posts |
| Admin | Create/Edit posts with WYSIWYG editor |
| i18n | Separate `title_vi`, `title_en`, `content_vi`, `content_en` fields |

**Supabase Schema (`blog_posts`):**
```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_vi TEXT NOT NULL,
  title_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  content_vi TEXT,
  content_en TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES users(id),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 3.3 Shopping Cart & Checkout
**Goal:** Seamless add-to-cart flow with guest and member checkout.

| Feature | Details |
|---------|---------|
| Cart State | Zustand store, persisted to localStorage |
| Cart UI | Slide-out drawer or dedicated page |
| Guest Checkout | Email + Phone + Address (no account required) |
| Member Checkout | Saved addresses, order history |
| Order Summary | Subtotal, Delivery fee (configurable by district), Total |

**Supabase Schema (`orders`):**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id), -- NULL for guest
  guest_email TEXT,
  guest_phone TEXT,
  shipping_address JSONB,
  items JSONB NOT NULL, -- [{product_id, qty, price}]
  subtotal NUMERIC(10,2),
  delivery_fee NUMERIC(10,2),
  total NUMERIC(10,2),
  payment_method TEXT, -- 'stripe', 'paypal', 'cod'
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 3.4 Payment Gateway
**Goal:** Accept Credit Card (Stripe) and PayPal.

| Provider | Implementation |
|----------|----------------|
| **Stripe** | Stripe Checkout or Payment Intents API (Python backend creates session, frontend redirects) |
| **PayPal** | PayPal JS SDK (client-side) with server verification |
| **COD** | Cash on Delivery option for local HCMC orders |

**Python Backend Endpoints:**
- `POST /api/checkout/stripe` → Returns Stripe Checkout Session URL
- `POST /api/checkout/paypal/capture` → Verifies PayPal order
- `POST /api/orders` → Saves order to Supabase

---

### 3.5 Multi-Language (i18n)
**Goal:** Full EN/VI support across all pages.

| Approach | Details |
|----------|---------|
| **Library** | `react-i18next` |
| **Static Text** | JSON files: `locales/en.json`, `locales/vi.json` |
| **Dynamic Content** | Dual columns in DB (`name_vi`, `name_en`) |
| **URL Strategy** | Path prefix: `/en/products`, `/vi/san-pham` (optional) OR query param |

---

### 3.6 Admin Dashboard
**Goal:** Manage products, orders, blog, and sync settings.

| Feature | Details |
|---------|---------|
| Auth | Role-based (Admin only via Supabase RLS) |
| Products | CRUD, Bulk import from Facebook sync |
| Orders | View, Update status, Export CSV |
| Blog | WYSIWYG editor (TipTap or similar) |
| Settings | Delivery fees, Payment toggles, Sync schedule |
| **Stack** | Separate React app or integrated `/admin` route with protected layout |

---

### 3.7 Facebook & Instagram Integration
**Goal:** Auto-import posts/photos as product drafts or gallery items.

#### Facebook Page API
| Endpoint | Data Retrieved |
|----------|----------------|
| `/{page-id}/photos` | Uploaded photos with captions |
| `/{page-id}/feed` | Posts with attached images |

**Sync Flow:**
1. Python CRON job runs daily (or manual trigger from Admin).
2. Fetches new posts since last sync timestamp.
3. Parses images + captions.
4. Saves to `social_feed` table or creates draft `products`.
5. Admin reviews and publishes.

#### Instagram Basic Display API
| Endpoint | Data |
|----------|------|
| `/me/media` | User's photos with caption, timestamp |

**Note:** Instagram requires App Review for Pages. Alternative: Use Facebook's Instagram Graph API if the IG account is linked to FB Page.

**Supabase Schema (`social_feed`):**
```sql
CREATE TABLE social_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL, -- 'facebook' | 'instagram'
  post_id TEXT UNIQUE NOT NULL,
  caption TEXT,
  image_url TEXT,
  permalink TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  is_imported_as_product BOOLEAN DEFAULT false
);
```

---

### 3.8 SEO Optimization
**Goal:** Rank for "hoa tươi TPHCM", "fresh flowers Ho Chi Minh", etc.

| Technique | Implementation |
|-----------|----------------|
| **Meta Tags** | Dynamic `<title>`, `<meta description>` per page |
| **Open Graph** | OG Image, Title, Description for social sharing |
| **Structured Data** | JSON-LD for Products (`Product`), Blog (`Article`), Breadcrumbs |
| **Sitemap** | Auto-generated XML sitemap |
| **Performance** | Image optimization (WebP), lazy loading, code splitting |
| **SSR / SSG** | Consider Next.js migration for full SEO or use Vite SSR plugin |

---

## 4. Phase Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Foundation** | 1 week | Project structure, Supabase schema, basic React routing, i18n setup |
| **Phase 2: Product Catalog** | 1 week | Product listing, detail, categories, Supabase integration |
| **Phase 3: Cart & Checkout** | 1 week | Cart state, checkout flow, Stripe + PayPal integration |
| **Phase 4: Facebook Sync** | 3-4 days | Python sync service, Admin import UI |
| **Phase 5: Blog & SEO** | 4-5 days | Blog CRUD, meta tags, structured data, sitemap |
| **Phase 6: Admin Dashboard** | 1 week | Full CRUD for products/orders/blog, settings |
| **Phase 7: Polish & Deploy** | 3-4 days | Testing, performance, Vercel/Railway deploy |

**Total Estimated Time:** ~5-6 weeks

---

## 5. Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx (backend only)

# Stripe
STRIPE_SECRET_KEY=sk_xxx
VITE_STRIPE_PUBLIC_KEY=pk_xxx

# PayPal
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx

# Facebook
FACEBOOK_PAGE_ID=xxx
FACEBOOK_ACCESS_TOKEN=xxx

# Instagram (if separate)
INSTAGRAM_ACCESS_TOKEN=xxx
```

---

## 6. Next Steps (Immediate)

1. **[You]** Confirm tech stack preference (stay with Vite or migrate to Next.js for SEO?).
2. **[You]** Provide Supabase project URL/keys (or I create the schema for you to apply).
3. **[You]** Provide Facebook Page Access Token (from Meta Developer Console).
4. **[Me]** Begin Phase 1: Scaffold frontend structure, Supabase tables, Python backend skeleton.
5. **[External]** UI/UX design finalized and handed off for integration.

---

## 7. Open Questions

- [ ] Preferred hosting? (Vercel for frontend, Railway/Fly.io for Python backend?)
- [ ] Need order notifications (email/SMS)?
- [ ] Loyalty/discount codes feature?
- [ ] Delivery integration (Grab/Ahamove API)?

---

*Plan created: 2025-12-07 | Last updated: now*

# 🌸 YenFlowers Store

E-commerce platform for **Yen Flowers** - a premium flower shop in Ho Chi Minh City, Vietnam.

## 🔗 Links

- **Facebook:** [Flowers.Yen](https://www.facebook.com/Flowers.Yen)
- **Instagram:** [@yen_flowers](https://www.instagram.com/yen_flowers/)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **UI Components** | shadcn/ui + Tailwind CSS |
| **Backend** | Python + FastAPI |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Payments** | Stripe + PayPal |
| **i18n** | Vietnamese + English |

---

## 📁 Project Structure

```
yenflowers-store/
├── src/                    # React frontend
│   ├── components/ui/      # shadcn/ui components
│   ├── lib/                # Utilities
│   └── App.tsx             # Main app
├── backend/                # Python FastAPI backend
│   ├── app/
│   │   ├── routers/        # API routes (admin, public, orders)
│   │   ├── services/       # Business logic (Facebook sync)
│   │   ├── schemas/        # Pydantic models
│   │   ├── config.py       # Settings
│   │   ├── database.py     # Supabase client
│   │   └── main.py         # App entry
│   └── requirements.txt
├── supabase/
│   └── migrations/         # Database schema
└── IMPLEMENTATION_PLAN.md  # Full project roadmap
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Edit with your keys
uvicorn app.main:app --reload
```

### Database

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql`

---

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## ✨ Features

- [x] Product catalog with categories
- [x] Shopping cart & checkout
- [x] Stripe payment integration
- [x] Facebook Page sync (import posts as products)
- [x] Blog posts
- [x] Admin dashboard APIs
- [x] Multi-language (VI/EN)
- [ ] Admin frontend (coming soon)
- [ ] SEO optimization
- [ ] Email notifications

---

## 📄 License

Private project - All rights reserved.

---

Made with 💐 in Ho Chi Minh City

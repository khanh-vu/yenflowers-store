# AI Features - Step-by-Step Deployment Guide

## ✅ Phase 1: Database Setup (15 min)

### Step 1.1: Apply Migration 004 (AI Infrastructure)
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/004_ai_infrastructure.sql`
3. Paste and run
4. Expected output: "AI infrastructure tables created successfully!"

**Verify:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_interactions', 'product_relationships', 'recommendation_clicks', 'search_queries');
```

### Step 1.2: Apply Migration 005 (Occasion Memory)
1. In SQL Editor
2. Copy `supabase/migrations/005_occasion_memory.sql`
3. Paste and run
4. Expected output: "Occasion Memory tables created successfully!"

**Verify:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('customer_occasions', 'occasion_reminders');
```

---

## ✅ Phase 2: Backend Testing (30 min)

### Step 2.1: Run Unit Tests
```bash
cd backend
source venv/bin/activate

# Test each feature
pytest tests/test_recommendations.py -v
pytest tests/test_smart_search.py -v  
pytest tests/test_visual_search.py -v
pytest tests/test_occasions.py -v
```

**Expected:** All tests pass (or show which mocked functions need real DB)

### Step 2.2: Start Backend Server
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**Verify:** Visit http://localhost:8000/docs
- Should see "AI Features" section with 12+ endpoints
- Should see "Occasions" section with 7+ endpoints

### Step 2.3: Test API Endpoints Manually

**Test Recommendations:**
```bash
curl -X POST http://localhost:8000/api/v1/ai/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "context": "homepage",
    "limit": 5
  }'
```

**Test Smart Search:**
```bash
curl -X POST http://localhost:8000/api/v1/ai/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "hoa hồng đỏ giá 500k",
    "session_id": "test123",
    "limit": 10
  }'
```

**Test Visual Search:**
```bash
curl -X POST http://localhost:8000/api/v1/ai/visual-search \
  -F "image=@path/to/flower.jpg" \
  -F "limit=10"
```

---

## ✅ Phase 3: Frontend Integration (1-2 hours)

### Step 3.1: Add to Homepage
Edit `src/pages/HomePage.tsx`:

```tsx
import { RecommendationsWidget } from '@/components/RecommendationsWidget';
import { SmartSearchBar } from '@/components/SmartSearchBar';

// In hero section
<SmartSearchBar />

// Below featured products
<RecommendationsWidget context="homepage" limit={10} />
```

### Step 3.2: Add to Product Detail Page
Edit `src/pages/ProductDetailPage.tsx`:

```tsx
import { useTrackProductView } from '@/hooks/useAI';
import { RecommendationsWidget } from '@/components/RecommendationsWidget';

function ProductDetailPage() {
  const { id } = useParams();
  
  // Auto-track view
  useTrackProductView(id);
  
  return (
    <>
      {/* Product details... */}
      
      {/* Related products */}
      <RecommendationsWidget 
        context="pdp" 
        productId={id}
        title="Sản phẩm liên quan"
        limit={8}
      />
    </>
  );
}
```

### Step 3.3: Add Visual Search to Header
Edit `src/components/Header.tsx`:

```tsx
import { VisualSearchButton } from '@/components/VisualSearchWidget';

<nav>
  <SmartSearchBar />
  <VisualSearchButton />
</nav>
```

### Step 3.4: Add Occasions to Profile
Edit `src/pages/ProfilePage.tsx`:

```tsx
import { OccasionsManager } from '@/components/OccasionsManager';

<ProfilePage>
  <Tabs>
    <Tab label="Profile">...</Tab>
    <Tab label="Occasions">
      <OccasionsManager />
    </Tab>
  </Tabs>
</ProfilePage>
```

### Step 3.5: Test Frontend
```bash
npm run dev
```

Visit:
- Homepage → See recommendations
- Search bar → Try "hoa hồng giá 500k"
- Product page → See related products
- Profile → Create an occasion

---

## ✅ Phase 4: Production Setup (1 hour)

### Step 4.1: Email Service (SendGrid)
1. Sign up at sendgrid.com
2. Create API key
3. Add to `.env`:
```bash
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yenflowers.vn
```

4. Update `backend/app/workers/reminder_worker.py`:
```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

async def _send_email(self, to_email, subject, html_content):
    message = Mail(
        from_email=os.getenv('SENDGRID_FROM_EMAIL'),
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )
    
    sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
    response = sg.send(message)
    return response
```

### Step 4.2: Cron Job for Reminders
Add to server crontab:
```bash
# Run reminder worker daily at 9 AM
0 9 * * * cd /path/to/backend && source venv/bin/activate && python -m app.workers.reminder_worker >> /var/log/reminders.log 2>&1
```

Or use admin endpoint:
```bash
# Manual trigger
curl -X POST http://localhost:8000/api/v1/occasions/admin/send-reminders
```

### Step 4.3: Environment Variables
Production `.env`:
```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Email
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yenflowers.vn

# Optional: SMS
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## ✅ Phase 5: Monitoring (30 min)

### Step 5.1: Create Analytics Dashboard

Query recommendations performance:
```sql
-- Click-through rate
SELECT 
  context,
  COUNT(*) as total_shown,
  COUNT(clicked_at) as total_clicked,
  ROUND(COUNT(clicked_at)::numeric / COUNT(*) * 100, 2) as ctr
FROM recommendation_clicks
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY context;
```

Query search analytics:
```sql
-- Top searches
SELECT 
  query_text,
  COUNT(*) as search_count,
  COUNT(clicked_product_ids) FILTER (WHERE array_length(clicked_product_ids, 1) > 0) as with_clicks
FROM search_queries
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY query_text
ORDER BY search_count DESC
LIMIT 10;
```

Query occasion reminders:
```sql
-- Reminder conversion rate
SELECT 
  DATE(sent_at) as date,
  COUNT(*) as reminders_sent,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
  COUNT(*) FILTER (WHERE order_placed = TRUE) as converted
FROM occasion_reminders
WHERE sent_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

---

## ✅ Phase 6: Load Testing (1 hour)

### Step 6.1: Install Locust
```bash
pip install locust
```

### Step 6.2: Create `locustfile.py`
```python
from locust import HttpUser, task, between

class YenFlowersUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(3)
    def get_recommendations(self):
        self.client.post("/api/v1/ai/recommendations", json={
            "context": "homepage",
            "limit": 10
        })
    
    @task(2)
    def search(self):
        self.client.post("/api/v1/ai/search", json={
            "query": "hoa hồng",
            "session_id": "load_test",
            "limit": 20
        })
    
    @task(1)
    def visual_search(self):
        with open("test_flower.jpg", "rb") as f:
            self.client.post("/api/v1/ai/visual-search", 
                files={"image": f})
```

### Step 6.3: Run Load Test
```bash
locust -f locustfile.py --headless -u 100 -r 10 -t 60s --host=http://localhost:8000
```

**Targets:**
- Recommendations: <500ms @ 100 RPS
- Search: <300ms @ 50 RPS
- Visual Search: <2s @ 10 RPS

---

## 🎯 Success Criteria

### All Tests Pass ✅
- [ ] Unit tests (95+)
- [ ] Integration tests (6+)
- [ ] Load tests (< target times)

### Features Work ✅
- [ ] Recommendations show on homepage
- [ ] Smart search parses Vietnamese queries
- [ ] Visual search finds similar products
- [ ] Occasions save and send reminders

### Metrics Tracked ✅
- [ ] Recommendation CTR > 5%
- [ ] Search success rate > 80%
- [ ] Reminder conversion > 10%

---

## 🐛 Troubleshooting

**Tests fail with "No module named pytest"**
→ `source venv/bin/activate && pip install pytest pytest-asyncio`

**API returns 404**
→ Check `app/main.py` includes AI router

**Database tables not found**
→ Run migrations in Supabase SQL Editor

**Reminders not sending**
→ Check SENDGRID_API_KEY set and cron job running

**Images not processing**
→ Install Pillow: `pip install Pillow`

---

🚀 **You're ready for production!**

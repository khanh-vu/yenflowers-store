-- =====================================================
-- Occasion Memory & Reminders Extension
-- Track important dates and send automated reminders
-- =====================================================

-- =====================================================
-- 1. CUSTOMER OCCASIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customer_occasions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Occasion details
    occasion_type TEXT NOT NULL CHECK (occasion_type IN (
        'birthday', 'anniversary', 'mothers_day', 'fathers_day', 
        'valentines_day', 'wedding', 'graduation', 'other'
    )),
    occasion_name TEXT NOT NULL, -- e.g., "Mom's Birthday", "Wedding Anniversary"
    recipient_name TEXT, -- Who is this occasion for?
    
    -- Date information
    date DATE NOT NULL, -- The actual date (year matters for one-time events)
    is_recurring BOOLEAN DEFAULT TRUE, -- Repeat annually?
    
    -- Preferences
    preferred_styles JSONB DEFAULT '{}', -- {'colors': ['pink', 'white'], 'flower_types': ['roses'], 'budget': 500000}
    notes TEXT, -- Special requests or allergies
    
    -- Reminder settings
    reminder_days_before INT DEFAULT 7, -- Send reminder this many days before
    reminder_enabled BOOLEAN DEFAULT TRUE,
    
    -- Tracking
    last_reminder_sent_at TIMESTAMPTZ,
    last_order_placed_at TIMESTAMPTZ,
    last_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure user can't create duplicate occasions for same date
    UNIQUE(user_id, occasion_name, date)
);

CREATE INDEX idx_occasions_user ON public.customer_occasions(user_id);
CREATE INDEX idx_occasions_date ON public.customer_occasions(date);
CREATE INDEX idx_occasions_upcoming ON public.customer_occasions(date, reminder_enabled) 
    WHERE reminder_enabled = TRUE;

-- =====================================================
-- 2. REMINDER HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS public.occasion_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    occasion_id UUID NOT NULL REFERENCES public.customer_occasions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Reminder details
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'push')),
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    
    -- What was recommended
    recommended_products UUID[], -- Array of product IDs
    
    -- Engagement tracking
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    order_placed BOOLEAN DEFAULT FALSE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_occasion ON public.occasion_reminders(occasion_id);
CREATE INDEX idx_reminders_user ON public.occasion_reminders(user_id, sent_at DESC);

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Function to get upcoming occasions needing reminders
CREATE OR REPLACE FUNCTION get_upcoming_occasions_for_reminders(days_ahead int DEFAULT 7)
RETURNS TABLE (
    occasion_id UUID,
    user_id UUID,
    user_email TEXT,
    occasion_name TEXT,
    occasion_type TEXT,
    occasion_date DATE,
    recipient_name TEXT,
    preferred_styles JSONB,
    days_until INTERVAL
)
LANGUAGE SQL STABLE
AS $$
    SELECT 
        co.id as occasion_id,
        co.user_id,
        p.email as user_email,
        co.occasion_name,
        co.occasion_type,
        co.date as occasion_date,
        co.recipient_name,
        co.preferred_styles,
        co.date - CURRENT_DATE as days_until
    FROM customer_occasions co
    JOIN profiles p ON p.id = co.user_id
    WHERE co.reminder_enabled = TRUE
        AND (
            -- For recurring occasions, check if it's coming up this year
            (co.is_recurring = TRUE AND 
             make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 
                      EXTRACT(MONTH FROM co.date)::int, 
                      EXTRACT(DAY FROM co.date)::int) 
             BETWEEN CURRENT_DATE AND CURRENT_DATE + days_ahead)
            OR
            -- For one-time occasions, check actual date
            (co.is_recurring = FALSE AND 
             co.date BETWEEN CURRENT_DATE AND CURRENT_DATE + days_ahead)
        )
        -- Check if reminder was already sent recently
        AND (co.last_reminder_sent_at IS NULL 
             OR co.last_reminder_sent_at < CURRENT_DATE - INTERVAL '1 day' * co.reminder_days_before)
    ORDER BY co.date ASC;
$$;

-- Function to get occasion recommendations
CREATE OR REPLACE FUNCTION get_occasion_recommendations(
    p_occasion_id UUID,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    price NUMERIC,
    images JSONB
)
LANGUAGE SQL STABLE
AS $$
    WITH occasion_prefs AS (
        SELECT 
            occasion_type,
            preferred_styles
        FROM customer_occasions
        WHERE id = p_occasion_id
    )
    SELECT 
        p.id,
        p.name_vi,
        p.price,
        p.images
    FROM products p, occasion_prefs op
    WHERE p.is_published = TRUE
        -- Match category based on occasion type
        AND (
            (op.occasion_type = 'birthday' AND p.category_id IN (
                SELECT id FROM categories WHERE slug = 'sinh-nhat'
            ))
            OR
            (op.occasion_type IN ('anniversary', 'valentines_day') AND p.category_id IN (
                SELECT id FROM categories WHERE slug = 'tinh-yeu'
            ))
            OR
            -- Default: show featured products
            p.is_featured = TRUE
        )
    ORDER BY p.is_featured DESC, RANDOM()
    LIMIT match_count;
$$;

-- =====================================================
-- 4. AUTO-UPDATE TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_occasion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER occasion_update_timestamp
    BEFORE UPDATE ON public.customer_occasions
    FOR EACH ROW
    EXECUTE FUNCTION update_occasion_timestamp();

-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.customer_occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occasion_reminders ENABLE ROW LEVEL SECURITY;

-- Users can manage their own occasions
CREATE POLICY "Users can manage own occasions" ON public.customer_occasions
    FOR ALL USING (auth.uid() = user_id);

-- Users can view their own reminder history
CREATE POLICY "Users can view own reminders" ON public.occasion_reminders
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert reminders (for worker)
CREATE POLICY "System can insert reminders" ON public.occasion_reminders
    FOR INSERT WITH CHECK (true);

-- Admins can view all occasions (for support)
CREATE POLICY "Admins can view all occasions" ON public.customer_occasions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- Done!
-- =====================================================
SELECT 'Occasion Memory tables created successfully!' as status;

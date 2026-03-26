-- =============================================================
-- MOTOCLICK ONBOARDING FORM - Database Migration v2
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================================

-- 1. NEW COLUMNS: Add all new fields -------------------------
ALTER TABLE merchants
    ADD COLUMN IF NOT EXISTS logo_url         text,
    ADD COLUMN IF NOT EXISTS website_url      text,
    ADD COLUMN IF NOT EXISTS app_link         text,
    ADD COLUMN IF NOT EXISTS pos_system_other text;

-- 2. CHANGE COLUMN TYPE: operating_hours now stores JSON -----
--    (Old data was plain text — we migrate it to JSON format)
ALTER TABLE merchants
    ALTER COLUMN operating_hours TYPE jsonb
    USING CASE
        WHEN operating_hours IS NULL OR operating_hours = '' THEN NULL
        ELSE to_jsonb(operating_hours::text)
    END;

-- 3. OPTIONAL COLUMNS TO DROP (safe to keep for audit trail) -
--    Uncomment if you want to remove weekly_call and wa_group:
-- ALTER TABLE merchants DROP COLUMN IF EXISTS weekly_call;
-- ALTER TABLE merchants DROP COLUMN IF EXISTS wa_group;

-- 4. SUPABASE STORAGE BUCKET for logos -----------------------
--    Run this to create the public logos bucket:
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

--    Storage policy: allow anyone to upload a logo (public form)
CREATE POLICY "Allow public logo uploads"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'logos');

--    Storage policy: allow anyone to read logos
CREATE POLICY "Allow public logo reads"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'logos');

-- 5. VERIFY: show current table structure --------------------
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'merchants'
ORDER BY ordinal_position;

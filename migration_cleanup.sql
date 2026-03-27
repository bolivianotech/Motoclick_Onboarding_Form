-- =============================================================
-- MOTOCLICK ONBOARDING FORM - Database Cleanup Script
-- Run this in: Supabase Dashboard > SQL Editor
-- This script removes the logo upload field and its storage policies.
-- =============================================================

-- 1. DROP the logo_url column from the merchants table -------------------------
ALTER TABLE merchants
    DROP COLUMN IF EXISTS logo_url;

-- 2. SUPABASE STORAGE CLEANUP ---------------------------------
--    Remove storage policies associated with the logos bucket
DROP POLICY IF EXISTS "Allow public logo uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public logo reads" ON storage.objects;

--    (Optional) Remove the logos bucket if you want to be thorough.
--    NOTE: This will fail if there are still objects inside the bucket.
--    DELETE FROM storage.buckets WHERE id = 'logos';

-- 3. VERIFY: Show current table structure --------------------
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'merchants'
ORDER BY ordinal_position;

-- Fix correct_id column type if it's not TEXT
-- Run this in your Supabase SQL Editor if you're getting type errors

-- First, check if the column exists and what type it is
-- You can run: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'daily_quiz';

-- If correct_id is INTEGER or any other type, change it to TEXT:
ALTER TABLE daily_quiz 
ALTER COLUMN correct_id TYPE TEXT USING correct_id::TEXT;

-- Verify the change:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'daily_quiz';


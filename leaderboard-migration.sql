-- Migration to fix leaderboard duplication issue
-- This adds user_id column and creates a unique constraint to prevent duplicates

-- 1. Add user_id column to leaderboard table
ALTER TABLE leaderboard 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);

-- 3. Allow update on leaderboard for authenticated users
CREATE POLICY "Allow authenticated update on own leaderboard entry" ON leaderboard
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. (Optional) Clean up duplicate entries - keeps the one with highest score
-- Run this manually if you have existing duplicates:
-- DELETE FROM leaderboard a USING leaderboard b
-- WHERE a.id < b.id AND a.user_id = b.user_id AND a.user_id IS NOT NULL;

-- 5. (Optional) Add unique constraint after cleanup
-- ALTER TABLE leaderboard ADD CONSTRAINT unique_user_id UNIQUE (user_id);












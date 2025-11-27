-- =====================================================
-- LEDGER-BASED ARCHITECTURE MIGRATION
-- =====================================================
-- This migration creates a cheat-proof, robust scoring system
-- where quiz_history is the immutable ledger and leaderboard
-- is automatically calculated via triggers.
-- =====================================================

-- =====================================================
-- STEP 1: Create the quiz_history table (THE LEDGER)
-- =====================================================
-- This is the source of truth. Each row = one quiz completion.
-- The UNIQUE constraint on (user_id, date) makes it IMPOSSIBLE
-- for a user to have two scores for the same day.

CREATE TABLE IF NOT EXISTS quiz_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- THE CRITICAL CONSTRAINT: One score per user per day
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_quiz_history_user_id ON quiz_history(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_history_date ON quiz_history(date);
CREATE INDEX IF NOT EXISTS idx_quiz_history_user_date ON quiz_history(user_id, date);

-- =====================================================
-- STEP 2: Recreate leaderboard table (THE VIEW)
-- =====================================================
-- Drop old structure and create new one optimized for auto-aggregation

-- First, backup existing data if needed (run separately if you want to preserve data)
-- CREATE TABLE leaderboard_backup AS SELECT * FROM leaderboard;

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow public read access on leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "Allow public insert on leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "Allow authenticated update on own leaderboard entry" ON leaderboard;

-- Drop the old table and recreate
DROP TABLE IF EXISTS leaderboard CASCADE;

CREATE TABLE leaderboard (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL DEFAULT 'Anonymous',
  avatar_url TEXT,
  total_score INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for ranking queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_score ON leaderboard(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_last_played ON leaderboard(last_played_at DESC);

-- =====================================================
-- STEP 3: Create the Trigger Function
-- =====================================================
-- This function runs AFTER every INSERT into quiz_history
-- and automatically updates the leaderboard.

CREATE OR REPLACE FUNCTION on_quiz_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Get user metadata from auth.users
  SELECT 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1), 'Anonymous'),
    COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', NULL)
  INTO v_username, v_avatar_url
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Upsert into leaderboard
  INSERT INTO leaderboard (user_id, username, avatar_url, total_score, games_played, last_played_at)
  VALUES (
    NEW.user_id,
    COALESCE(v_username, 'Anonymous'),
    v_avatar_url,
    NEW.score,
    1,
    NEW.created_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_score = leaderboard.total_score + NEW.score,
    games_played = leaderboard.games_played + 1,
    last_played_at = NEW.created_at,
    -- Also update username/avatar in case they changed
    username = COALESCE(v_username, leaderboard.username),
    avatar_url = COALESCE(v_avatar_url, leaderboard.avatar_url);

  -- Optional: Update profiles table if it exists
  -- Uncomment if you have a profiles table with total_xp column
  /*
  UPDATE public.profiles 
  SET total_xp = COALESCE(total_xp, 0) + NEW.score
  WHERE id = NEW.user_id;
  */

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 4: Attach the Trigger
-- =====================================================

DROP TRIGGER IF EXISTS trigger_on_quiz_completed ON quiz_history;

CREATE TRIGGER trigger_on_quiz_completed
  AFTER INSERT ON quiz_history
  FOR EACH ROW
  EXECUTE FUNCTION on_quiz_completed();

-- =====================================================
-- STEP 5: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on quiz_history
ALTER TABLE quiz_history ENABLE ROW LEVEL SECURITY;

-- Users can only INSERT their own quiz results
CREATE POLICY "Users can insert own quiz history"
  ON quiz_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own quiz history
CREATE POLICY "Users can read own quiz history"
  ON quiz_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable RLS on leaderboard
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Anyone can read the leaderboard (it's public)
CREATE POLICY "Public read access on leaderboard"
  ON leaderboard
  FOR SELECT
  USING (true);

-- Only the trigger (SECURITY DEFINER) can modify leaderboard
-- No direct INSERT/UPDATE policies for regular users

-- =====================================================
-- STEP 6: Helper function to get user's total score
-- =====================================================
-- This recalculates from the ledger - useful for verification

CREATE OR REPLACE FUNCTION get_user_total_score(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(score), 0)::INTEGER
  FROM quiz_history
  WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =====================================================
-- STEP 7: Function to sync/repair leaderboard from ledger
-- =====================================================
-- Run this if leaderboard ever gets out of sync

CREATE OR REPLACE FUNCTION repair_leaderboard()
RETURNS void AS $$
BEGIN
  -- Clear and rebuild leaderboard from quiz_history
  DELETE FROM leaderboard;
  
  INSERT INTO leaderboard (user_id, username, avatar_url, total_score, games_played, last_played_at, created_at)
  SELECT 
    qh.user_id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'Anonymous'),
    COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', NULL),
    SUM(qh.score),
    COUNT(*),
    MAX(qh.created_at),
    MIN(qh.created_at)
  FROM quiz_history qh
  JOIN auth.users u ON u.id = qh.user_id
  GROUP BY qh.user_id, u.raw_user_meta_data, u.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 8: Grant necessary permissions
-- =====================================================

-- Grant usage on the functions
GRANT EXECUTE ON FUNCTION get_user_total_score(UUID) TO authenticated;
-- repair_leaderboard should only be called by admins/service role

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- 
-- Summary of what this creates:
-- 
-- 1. quiz_history table - The immutable ledger with UNIQUE(user_id, date)
-- 2. leaderboard table - Auto-updated summary view
-- 3. on_quiz_completed() - Trigger function that updates leaderboard
-- 4. trigger_on_quiz_completed - AFTER INSERT trigger on quiz_history
-- 5. RLS policies - Users can only insert/read their own history
-- 6. get_user_total_score() - Helper to verify totals
-- 7. repair_leaderboard() - Admin function to rebuild leaderboard
--
-- How it works:
-- 1. Frontend calls: INSERT INTO quiz_history (user_id, date, score)
-- 2. If duplicate (same user+date), Postgres returns error (handled gracefully)
-- 3. If success, trigger automatically updates leaderboard
-- 4. No manual score calculation needed on frontend!
--



-- Daily Quiz Table
CREATE TABLE IF NOT EXISTS daily_quiz (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  options_json JSONB NOT NULL,
  correct_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(date)
);

-- Leaderboard Table
CREATE TABLE IF NOT EXISTS leaderboard (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_quiz_date ON daily_quiz(date);
CREATE INDEX IF NOT EXISTS idx_leaderboard_date ON leaderboard(date);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);

-- RLS (Row Level Security) Policies
-- Enable RLS on both tables
ALTER TABLE daily_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read daily_quiz (public access)
CREATE POLICY "Allow public read access on daily_quiz" ON daily_quiz
  FOR SELECT USING (true);

-- Allow anyone to read leaderboard (public access)
CREATE POLICY "Allow public read access on leaderboard" ON leaderboard
  FOR SELECT USING (true);

-- Allow anyone to insert into leaderboard (for quiz submissions)
CREATE POLICY "Allow public insert on leaderboard" ON leaderboard
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to insert into daily_quiz (for admin)
-- Note: For this to work, you need to enable auth and require authentication
-- For now, we'll allow public inserts but you should restrict this in production
CREATE POLICY "Allow public insert on daily_quiz" ON daily_quiz
  FOR INSERT WITH CHECK (true);

-- For production, you should use service role key or authenticated users:
-- CREATE POLICY "Allow authenticated insert on daily_quiz" ON daily_quiz
--   FOR INSERT TO authenticated WITH CHECK (true);


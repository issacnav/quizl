-- Create a table to track ALL quiz attempts, including anonymous ones
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id BIGSERIAL PRIMARY KEY,
  score INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for guests)
CREATE POLICY "Allow public insert on quiz_attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (true);

-- Allow public read (for analytics)
CREATE POLICY "Allow public read on quiz_attempts" ON quiz_attempts
  FOR SELECT USING (true);

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_date ON quiz_attempts(date);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_created_at ON quiz_attempts(created_at);









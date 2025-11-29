-- Remove the unique constraint on the date column in daily_quiz table
ALTER TABLE daily_quiz DROP CONSTRAINT IF EXISTS daily_quiz_date_key;
DROP INDEX IF EXISTS idx_daily_quiz_date;
CREATE INDEX IF NOT EXISTS idx_daily_quiz_date ON daily_quiz(date);

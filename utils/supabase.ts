import { createClient } from '@supabase/supabase-js';

// Using environment variables with fallback to provided credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ytdmxhpxceywuaudguti.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0ZG14aHB4Y2V5d3VhdWRndXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjA2MDAsImV4cCI6MjA3OTM5NjYwMH0.DF323J_0OhS6pad5jgXgtdHVJ1BcvaJre894-r5AMQU';

export const supabase = createClient(supabaseUrl, supabaseKey);


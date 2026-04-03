import { createClient } from '@supabase/supabase-js';

// Using environment variables with fallback to provided credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lwblnkrbqfvzselxbzjv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Ymxua3JicWZ2enNlbHhiemp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNDE0ODEsImV4cCI6MjA5MDgxNzQ4MX0.Zd_IzeYtxgy4IZayG_YAhPIc2HAQ831qIKdNqXjw-GU';

export const supabase = createClient(supabaseUrl, supabaseKey);


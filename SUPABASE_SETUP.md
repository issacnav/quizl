# Supabase Setup Guide

Follow these steps to set up your Supabase database for PhysioFlow.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `physioflow` (or any name you prefer)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose the closest region to your users
5. Click "Create new project" and wait for it to be ready (~2 minutes)

## Step 2: Create the Database Tables

1. In your Supabase project dashboard, go to **SQL Editor** (in the left sidebar)
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** (or press `Ctrl+Enter`)
5. You should see "Success. No rows returned" - this means the tables were created successfully!

## Step 3: Get Your API Credentials

1. Go to **Project Settings** (gear icon in the left sidebar)
2. Click on **API** in the settings menu
3. Copy the following values:

   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
     - Example: `https://abcdefghijklmnop.supabase.co`
   
   - **anon/public key**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - It's a long string starting with `eyJ...`

## Step 4: Configure Environment Variables

1. In your project root, create a file named `.env.local`
2. Add the following lines:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Replace `your_project_url_here` and `your_anon_key_here` with the values from Step 3
4. Save the file

**Important**: Never commit `.env.local` to git! It's already in `.gitignore`

## Step 5: Verify the Setup

1. In Supabase, go to **Table Editor** (in the left sidebar)
2. You should see two tables:
   - `daily_quiz`
   - `leaderboard`

3. Test by running your Next.js app:
   ```bash
   npm run dev
   ```

4. Visit:
   - `http://localhost:3000` - Should show "No quiz available for today" (normal if no quiz has been created)
   - `http://localhost:3000/admin` - Should show the admin panel

## Step 6: Create Your First Quiz

1. Go to `http://localhost:3000/admin`
2. Fill in the form:
   - Question: "What is the primary muscle for knee extension?"
   - Options: 
     - A: Hamstrings
     - B: Quadriceps (select this as correct)
     - C: Gastrocnemius
     - D: Gluteus Maximus
3. Click "Publish Live"
4. You should see a success message!

5. Go back to `http://localhost:3000` - Your quiz should now appear!

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure your `.env.local` file exists in the project root
- Check that the variable names are exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your dev server after creating/modifying `.env.local`

### "No quiz available for today" error
- This is normal if you haven't created a quiz yet
- Go to `/admin` and create a quiz for today
- Make sure the date is set to today (it's automatic)

### Can't see tables in Table Editor
- Go back to SQL Editor and run the schema again
- Check the console for any error messages

### Permission errors
- The RLS (Row Level Security) policies are set up to allow public access
- If you're getting permission errors, make sure you ran the full `supabase-schema.sql` file
- Check that the policies were created in the Authentication → Policies section

## Next Steps

- Add authentication for admin access (optional but recommended for production)
- Customize the quiz questions and options
- Deploy your app to Vercel or another hosting platform


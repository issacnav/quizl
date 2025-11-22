This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## PhysioFlow - Daily Quiz Platform

A Next.js application for daily physiotherapy quizzes with leaderboard functionality, powered by Supabase.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works perfectly)

## Getting Started

### 1. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project's SQL Editor
3. Run the SQL schema from `supabase-schema.sql` to create the required tables:
   - `daily_quiz` - Stores daily quiz questions
   - `leaderboard` - Stores user scores

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings:
- Project Settings → API → Project URL (for NEXT_PUBLIC_SUPABASE_URL)
- Project Settings → API → anon/public key (for NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Daily Quiz**: Users can take daily physiotherapy quizzes
- **Leaderboard**: View global rankings and submit scores
- **Admin Panel**: Create and publish daily quizzes at `/admin`

## Database Schema

### daily_quiz
- `id` (BIGSERIAL, PRIMARY KEY)
- `question` (TEXT)
- `options_json` (JSONB) - Array of option objects with `id` and `text`
- `correct_id` (TEXT) - The correct option ID (e.g., "a", "b", "c", "d")
- `date` (DATE) - Unique constraint, one quiz per day

### leaderboard
- `id` (BIGSERIAL, PRIMARY KEY)
- `username` (TEXT)
- `score` (INTEGER)
- `date` (DATE)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

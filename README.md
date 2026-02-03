# Package Adoption Tracker

Monitor npm package downloads across your projects and competitors. Track adoption trends, compare organizations, and make data-driven decisions.

## Features

- **Organization Management**: Group packages by organization/company
- **npm Package Tracking**: Monitor download statistics for any npm package
- **Trend Analysis**: Interactive charts with trendlines and date range filtering
- **Multi-org Comparison**: View up to 3 organizations side-by-side
- **Daily Stats Scraping**: Supabase Edge Function fetches stats daily

## Tech Stack

- **Frontend**: TanStack Start + React + TailwindCSS + shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions)
- **Charts**: Recharts with linear regression trendlines
- **Deployment**: Vercel (frontend) + Supabase Cloud (backend)

## Getting Started

### 1. Set Up Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/woeqzvfcprdaodpocxns)
2. Run the migration SQL from `supabase/migrations/20240101000000_create_tables.sql` in the SQL Editor
3. Get your API keys from Settings > API

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase anon key from the dashboard.

### 3. Install & Run

```bash
pnpm install
pnpm dev
```

Visit http://localhost:3000

### Local Development with Supabase CLI (Optional)

If you prefer local development:

```bash
# Install Supabase CLI: https://supabase.com/docs/guides/cli
supabase start
supabase db reset
```

Then update `.env` to use local URLs from `supabase status`.

## Production Deployment

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration SQL from `supabase/migrations/20240101000000_create_tables.sql`
3. Deploy the Edge Function:

```bash
supabase login
supabase link --project-ref woeqzvfcprdaodpocxns
supabase functions deploy scrape-npm-stats
```

4. Set up daily cron job in Supabase Dashboard or via pg_cron:

```sql
SELECT cron.schedule(
  'scrape-npm-stats-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://woeqzvfcprdaodpocxns.supabase.co/functions/v1/scrape-npm-stats',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `VITE_SUPABASE_URL`: `https://woeqzvfcprdaodpocxns.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: Your project's anon key

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── auth/           # Auth forms
│   │   ├── charts/         # Recharts components
│   │   ├── organizations/  # Org management
│   │   ├── projects/       # Project management
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # React Query hooks
│   ├── lib/
│   │   └── package-managers/  # Adapter pattern for npm/nuget/etc
│   ├── routes/             # TanStack Router file-based routes
│   └── types/              # TypeScript types
├── supabase/
│   ├── docker-compose.yml  # Local Supabase setup
│   ├── migrations/         # Database schema
│   └── functions/          # Edge Functions
└── vercel.json             # Vercel config
```

## Package Manager Abstraction

The app is designed to support multiple package managers. Currently only npm is implemented, but the adapter pattern in `src/lib/package-managers/` makes it easy to add:

- **nuget** (NuGet for .NET)
- **pypi** (PyPI for Python)
- **maven** (Maven for Java)
- **cargo** (Cargo for Rust)

## API Keys

### Local Development
Pre-configured demo keys in `.env.example` work with the local Docker setup.

### Production
Get your keys from the Supabase Dashboard → Settings → API:
- **Anon Key**: Safe to expose in frontend
- **Service Role Key**: Only for Edge Functions (never expose in frontend)

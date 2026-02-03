# Supabase Local Development

## Quick Start

1. Start Supabase services:
```bash
cd supabase
docker compose up -d
```

2. Access points:
- **API Gateway (Kong)**: http://localhost:54321
- **PostgreSQL**: localhost:54322 (user: postgres, password: postgres)
- **Auth**: http://localhost:54324
- **REST API**: http://localhost:54323
- **Email Testing (Inbucket)**: http://localhost:54325

3. API Keys for local development:
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`

## Stop Services

```bash
docker compose down
```

## Reset Database

```bash
docker compose down -v
docker compose up -d
```

-- Saved views for analytics filters (shared across all users)
CREATE TABLE IF NOT EXISTS public.saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_views_created_at ON public.saved_views(created_at);

-- Enable RLS
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

-- Drop policies if they already exist (idempotent)
DROP POLICY IF EXISTS "All authenticated users can view saved views" ON public.saved_views;
DROP POLICY IF EXISTS "Authenticated users can create saved views" ON public.saved_views;
DROP POLICY IF EXISTS "Users can update their own saved views" ON public.saved_views;
DROP POLICY IF EXISTS "Users can delete their own saved views" ON public.saved_views;

-- All authenticated users can view saved views (shared)
CREATE POLICY "All authenticated users can view saved views"
  ON public.saved_views FOR SELECT
  TO authenticated
  USING (true);

-- Any authenticated user can create saved views
CREATE POLICY "Authenticated users can create saved views"
  ON public.saved_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only the creator can update their saved views
CREATE POLICY "Users can update their own saved views"
  ON public.saved_views FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Only the creator can delete their saved views
CREATE POLICY "Users can delete their own saved views"
  ON public.saved_views FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

GRANT ALL ON public.saved_views TO authenticated;

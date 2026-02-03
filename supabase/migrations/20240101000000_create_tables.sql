-- ============================================
-- Package Adoption Tracker - Database Schema
-- ============================================
-- This migration is designed for Supabase CLI local development
-- Run: supabase start && supabase db reset

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Application Schema: Organizations & Projects
-- ============================================

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Package manager enum for future extensibility
CREATE TYPE package_manager_type AS ENUM ('npm', 'nuget', 'pypi', 'maven', 'cargo');

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  package_name TEXT NOT NULL,
  package_manager package_manager_type NOT NULL DEFAULT 'npm',
  package_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, package_name, package_manager)
);

-- Download stats table (stores daily snapshots)
CREATE TABLE IF NOT EXISTS public.download_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  downloads_day BIGINT DEFAULT 0,
  downloads_week BIGINT DEFAULT 0,
  downloads_month BIGINT DEFAULT 0,
  downloads_year BIGINT DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, date)
);

-- Historical download data (for charting over time)
CREATE TABLE IF NOT EXISTS public.download_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  downloads BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON public.organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_download_stats_project_id ON public.download_stats(project_id);
CREATE INDEX IF NOT EXISTS idx_download_stats_date ON public.download_stats(date);
CREATE INDEX IF NOT EXISTS idx_download_history_project_id ON public.download_history(project_id);
CREATE INDEX IF NOT EXISTS idx_download_history_dates ON public.download_history(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
-- Note: auth.uid() is provided by Supabase
CREATE POLICY "Users can view their own organizations"
  ON public.organizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organizations"
  ON public.organizations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own organizations"
  ON public.organizations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for projects (through organization ownership)
CREATE POLICY "Users can view projects in their organizations"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = projects.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects in their organizations"
  ON public.projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = projects.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update projects in their organizations"
  ON public.projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = projects.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete projects in their organizations"
  ON public.projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = projects.organization_id
      AND organizations.user_id = auth.uid()
    )
  );

-- RLS Policies for download_stats
CREATE POLICY "Users can view stats for their projects"
  ON public.download_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = download_stats.project_id
      AND o.user_id = auth.uid()
    )
  );

-- Service role can insert stats (for edge function)
CREATE POLICY "Service role can insert stats"
  ON public.download_stats FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update stats"
  ON public.download_stats FOR UPDATE
  TO service_role
  USING (true);

-- RLS Policies for download_history
CREATE POLICY "Users can view history for their projects"
  ON public.download_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = download_history.project_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert history"
  ON public.download_history FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Grant table permissions
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.projects TO authenticated;
GRANT SELECT ON public.download_stats TO authenticated;
GRANT SELECT ON public.download_history TO authenticated;
GRANT ALL ON public.download_stats TO service_role;
GRANT ALL ON public.download_history TO service_role;

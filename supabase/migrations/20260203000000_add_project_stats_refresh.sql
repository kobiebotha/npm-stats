-- Add stats refresh fields for manual bootstrap + daily refresh mode
DO $$ BEGIN
  CREATE TYPE stats_refresh_mode AS ENUM ('pending', 'daily');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS stats_refresh_mode stats_refresh_mode NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stats_bootstrapped_at TIMESTAMPTZ;

-- Existing projects should continue refreshing daily
UPDATE public.projects
SET stats_refresh_mode = 'daily'
WHERE stats_refresh_mode = 'pending';

CREATE INDEX IF NOT EXISTS idx_projects_stats_refresh_mode
  ON public.projects(stats_refresh_mode);

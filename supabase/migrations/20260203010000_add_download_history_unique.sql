-- Ensure download_history has a unique constraint for upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_download_history_unique
  ON public.download_history(project_id, start_date, end_date);

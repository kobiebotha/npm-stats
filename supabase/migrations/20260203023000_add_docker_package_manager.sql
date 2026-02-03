-- Add Docker Hub as a package manager type
DO $$ BEGIN
  ALTER TYPE package_manager_type ADD VALUE IF NOT EXISTS 'docker';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

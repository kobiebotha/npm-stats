-- Open up all tables so any authenticated user can read and write.

-- == Organizations ==
DROP POLICY IF EXISTS "Users can view their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can create their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can update their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can delete their own organizations" ON public.organizations;

CREATE POLICY "Authenticated users can select organizations"
  ON public.organizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert organizations"
  ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update organizations"
  ON public.organizations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete organizations"
  ON public.organizations FOR DELETE TO authenticated USING (true);

-- == Projects ==
DROP POLICY IF EXISTS "Users can view projects in their organizations" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects in their organizations" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects in their organizations" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects in their organizations" ON public.projects;

CREATE POLICY "Authenticated users can select projects"
  ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert projects"
  ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update projects"
  ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete projects"
  ON public.projects FOR DELETE TO authenticated USING (true);

-- == Download stats ==
DROP POLICY IF EXISTS "Users can view stats for their projects" ON public.download_stats;

CREATE POLICY "Authenticated users can select download stats"
  ON public.download_stats FOR SELECT TO authenticated USING (true);

-- == Download history ==
DROP POLICY IF EXISTS "Users can view history for their projects" ON public.download_history;

CREATE POLICY "Authenticated users can select download history"
  ON public.download_history FOR SELECT TO authenticated USING (true);

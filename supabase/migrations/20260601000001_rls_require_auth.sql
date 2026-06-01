-- Require authentication for all data access.
-- Drops the MVP anon_all policies and replaces them with authenticated_all.
-- Revokes direct anon grants; authenticated role retains full access.

-- ─── drop anon_all policies ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "anon_all" ON firms;
DROP POLICY IF EXISTS "anon_all" ON projects;
DROP POLICY IF EXISTS "anon_all" ON floorplans;
DROP POLICY IF EXISTS "anon_all" ON comments;
DROP POLICY IF EXISTS "anon_all" ON concept_layouts;
DROP POLICY IF EXISTS "anon_all" ON standard_builds;

-- ─── authenticated_all policies ───────────────────────────────────────────────

CREATE POLICY "authenticated_all" ON firms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON floorplans
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON comments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON concept_layouts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON standard_builds
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── revoke anon table grants ─────────────────────────────────────────────────

REVOKE SELECT, INSERT, UPDATE, DELETE ON firms           FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON projects        FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON floorplans      FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON comments        FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON concept_layouts FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON standard_builds FROM anon;
REVOKE SELECT ON dashboard_stats FROM anon;

-- ─── storage: swap anon policies for authenticated ────────────────────────────

DROP POLICY IF EXISTS "anon_upload" ON storage.objects;
DROP POLICY IF EXISTS "anon_read"   ON storage.objects;
DROP POLICY IF EXISTS "anon_update" ON storage.objects;
DROP POLICY IF EXISTS "anon_delete" ON storage.objects;

CREATE POLICY "auth_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'floorplans');
CREATE POLICY "auth_read"   ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'floorplans');
CREATE POLICY "auth_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'floorplans') WITH CHECK (bucket_id = 'floorplans');
CREATE POLICY "auth_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'floorplans');

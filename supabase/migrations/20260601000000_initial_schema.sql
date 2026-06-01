-- Camp Away Design — initial schema
-- Tables: firms, projects (brief inlined), floorplans, comments, concept_layouts, standard_builds
-- Views: dashboard_stats
-- Storage: floorplans bucket
-- RLS: all tables enabled; anon_all policies for MVP (no auth).
--       Replace with role-based policies when Supabase Auth is wired up.

-- ─── firms ────────────────────────────────────────────────────────────────────

CREATE TABLE firms (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL,
  active_projects int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── projects ─────────────────────────────────────────────────────────────────
-- TrailerBrief fields are inlined (brief_*) — they're always fetched together
-- and never queried independently, so a separate table adds no value.

CREATE TABLE projects (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name   text        NOT NULL,
  status        text        NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft','intake_submitted','awaiting_concept','concept_generated',
      'under_architect_review','revision_requested','approved','final_design_in_progress'
    )),
  firm_id       uuid        REFERENCES firms(id) ON DELETE SET NULL,
  thumbnail_url text        NOT NULL DEFAULT '',
  gallery_urls  text[]      NOT NULL DEFAULT '{}',

  brief_size_category  text   NOT NULL DEFAULT 'medium'
    CHECK (brief_size_category IN ('small','medium','large')),
  brief_sleeps         int    NOT NULL DEFAULT 2,
  brief_bathroom_type  text   NOT NULL DEFAULT 'wet_bath'
    CHECK (brief_bathroom_type IN ('none','wet_bath','dry_bath')),
  brief_kitchen_type   text   NOT NULL DEFAULT 'standard'
    CHECK (brief_kitchen_type IN ('basic','standard','extended_storage')),
  brief_power_options  text[] NOT NULL DEFAULT '{}',
  brief_intended_usage text   NOT NULL DEFAULT 'weekend'
    CHECK (brief_intended_usage IN ('weekend','part_time','full_time')),
  brief_tow_vehicle    text   NOT NULL DEFAULT 'suv'
    CHECK (brief_tow_vehicle IN ('suv','truck','unsure')),
  brief_budget_range   text   NOT NULL DEFAULT '40k_50k'
    CHECK (brief_budget_range IN ('under_40k','40k_50k','50k_70k','70k_plus')),
  brief_design_style   text   NOT NULL DEFAULT 'modern'
    CHECK (brief_design_style IN ('modern','rustic','minimalist','luxury_compact')),
  brief_notes          text   NOT NULL DEFAULT '',

  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── floorplans ───────────────────────────────────────────────────────────────

CREATE TABLE floorplans (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version       int         NOT NULL,
  status        text        NOT NULL DEFAULT 'current'
    CHECK (status IN ('current','superseded')),
  uploaded_by   text        NOT NULL,
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  label         text        NOT NULL,
  file_url      text,
  file_type     text,
  revision_note text,
  UNIQUE (project_id, version)
);

-- ─── comments ─────────────────────────────────────────────────────────────────

CREATE TABLE comments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author      text        NOT NULL,
  role        text        NOT NULL CHECK (role IN ('client','designer')),
  body        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── concept_layouts ──────────────────────────────────────────────────────────
-- At most one per project (UNIQUE on project_id).
-- zones: jsonb array of LayoutZone objects { kind, x, y, width, depth }.

CREATE TABLE concept_layouts (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid         NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  status      text         NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review','approved','rejected')),
  source      text         NOT NULL CHECK (source IN ('ai','template')),
  length_ft   numeric(6,2) NOT NULL,
  width_ft    numeric(6,2) NOT NULL,
  zones       jsonb        NOT NULL DEFAULT '[]',
  rationale   text         NOT NULL DEFAULT '',
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

-- ─── standard_builds ──────────────────────────────────────────────────────────

CREATE TABLE standard_builds (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  size_category text NOT NULL CHECK (size_category IN ('small','medium','large')),
  sleeps        int  NOT NULL,
  bathroom_type text NOT NULL CHECK (bathroom_type IN ('none','wet_bath','dry_bath')),
  kitchen_type  text NOT NULL CHECK (kitchen_type IN ('basic','standard','extended_storage'))
);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER concept_layouts_updated_at
  BEFORE UPDATE ON concept_layouts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_projects_firm_id        ON projects(firm_id);
CREATE INDEX idx_projects_status         ON projects(status);
CREATE INDEX idx_floorplans_project_id   ON floorplans(project_id);
CREATE INDEX idx_comments_project_id     ON comments(project_id);
CREATE INDEX idx_concept_layouts_project ON concept_layouts(project_id);

-- ─── dashboard_stats view ─────────────────────────────────────────────────────

CREATE VIEW dashboard_stats WITH (security_invoker = true) AS
SELECT
  COUNT(*) FILTER (WHERE status NOT IN ('draft','approved','final_design_in_progress'))
    AS active_projects,

  ROUND(
    COUNT(*) FILTER (WHERE status IN ('approved','final_design_in_progress'))::numeric
    / NULLIF(COUNT(*), 0),
    4
  ) AS reached_approval_rate,

  ROUND(
    (SELECT AVG(v) FROM (
      SELECT project_id, MAX(version) AS v FROM floorplans GROUP BY project_id
    ) t),
    2
  ) AS avg_revision_rounds,

  ROUND(
    COALESCE((
      SELECT AVG(EXTRACT(EPOCH FROM (first_upload - p.created_at)) / 86400)
      FROM projects p
      JOIN (
        SELECT project_id, MIN(uploaded_at) AS first_upload
        FROM floorplans GROUP BY project_id
      ) f ON f.project_id = p.id
    ), 0)::numeric,
    1
  ) AS avg_days_to_first_plan,

  (SELECT COUNT(DISTINCT firm_id)
   FROM projects
   WHERE firm_id IS NOT NULL
     AND status NOT IN ('draft','approved','final_design_in_progress')
  ) AS active_firms

FROM projects;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- MVP: no auth — anon has full access. Replace with scoped policies once
-- Supabase Auth and user roles (client / designer / ops) are implemented.

ALTER TABLE firms           ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE floorplans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE standard_builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON firms           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON projects        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON floorplans      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON comments        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON concept_layouts FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON standard_builds FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON firms           TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON projects        TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON floorplans      TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON comments        TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON concept_layouts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON standard_builds TO anon, authenticated;
GRANT SELECT ON dashboard_stats TO anon, authenticated;

-- ─── storage ──────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'floorplans',
  'floorplans',
  true,   -- public: floorplan files are non-sensitive
  20971520,
  ARRAY['image/png','image/jpeg','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anon_upload" ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'floorplans');
CREATE POLICY "anon_read"   ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'floorplans');
CREATE POLICY "anon_update" ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'floorplans') WITH CHECK (bucket_id = 'floorplans');
CREATE POLICY "anon_delete" ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'floorplans');

-- ─── seed: standard builds ────────────────────────────────────────────────────

INSERT INTO standard_builds (id, name, size_category, sleeps, bathroom_type, kitchen_type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Standard Small — Couple',   'small',  2, 'wet_bath', 'standard'),
  ('00000000-0000-0000-0000-000000000002', 'Standard Medium — Couple',  'medium', 2, 'wet_bath', 'standard'),
  ('00000000-0000-0000-0000-000000000003', 'Standard Medium — Family',  'medium', 4, 'wet_bath', 'standard'),
  ('00000000-0000-0000-0000-000000000004', 'Standard Large — Family',   'large',  4, 'wet_bath', 'extended_storage'),
  ('00000000-0000-0000-0000-000000000005', 'Standard Large — Extended', 'large',  6, 'wet_bath', 'extended_storage');

-- ─── seed: demo firms ─────────────────────────────────────────────────────────

INSERT INTO firms (id, name, active_projects) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Cedar & Pine Co.',  8),
  ('10000000-0000-0000-0000-000000000002', 'Wander Studios',    5),
  ('10000000-0000-0000-0000-000000000003', 'Tiny Foundry',      4),
  ('10000000-0000-0000-0000-000000000004', 'Hearth & Haul',     3),
  ('10000000-0000-0000-0000-000000000005', 'Drift Cabins',      2),
  ('10000000-0000-0000-0000-000000000006', 'Nomad Build Co.',   2);

-- ─── seed: demo projects ──────────────────────────────────────────────────────

INSERT INTO projects (
  id, client_name, status, firm_id,
  thumbnail_url, gallery_urls,
  brief_size_category, brief_sleeps, brief_bathroom_type, brief_kitchen_type,
  brief_power_options, brief_intended_usage, brief_tow_vehicle,
  brief_budget_range, brief_design_style, brief_notes,
  created_at, updated_at
) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Maria & Jon', 'under_architect_review',
    '10000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1604549053344-d353adf347d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    ARRAY['https://images.unsplash.com/photo-1604549053344-d353adf347d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080','https://images.unsplash.com/photo-1773123441753-e87f821ec76d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080','https://images.unsplash.com/photo-1759398430338-8057876edf61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
    'medium',2,'wet_bath','standard','{}','weekend','suv','40k_50k','rustic',
    'Weekend getaways for two; prefer light wood interior.',
    '2026-05-15T12:00:00Z','2026-05-28T12:00:00Z'),
  ('20000000-0000-0000-0000-000000000002', 'Dev & Sam', 'intake_submitted', NULL,
    'https://images.unsplash.com/photo-1604549001484-df28edea610b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    ARRAY['https://images.unsplash.com/photo-1604549001484-df28edea610b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
    'medium',2,'wet_bath','standard',ARRAY['solar'],'weekend','suv','40k_50k','modern',
    'Off-grid weekends; would love solar.',
    '2026-05-26T12:00:00Z','2026-05-26T12:00:00Z'),
  ('20000000-0000-0000-0000-000000000003', 'The Okafors', 'approved',
    '10000000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1771022136054-208a15f1126f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    ARRAY['https://images.unsplash.com/photo-1771022136054-208a15f1126f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
    'small',2,'wet_bath','standard','{}','weekend','suv','under_40k','minimalist',
    'Compact and light; two kids occasionally.',
    '2026-05-02T12:00:00Z','2026-05-18T12:00:00Z'),
  ('20000000-0000-0000-0000-000000000004', 'Lena T.', 'draft',
    '10000000-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1641996992441-244ee607935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    ARRAY['https://images.unsplash.com/photo-1641996992441-244ee607935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
    'medium',3,'wet_bath','standard','{}','weekend','suv','50k_70k','modern',
    'Needs to sleep three.',
    '2026-05-29T12:00:00Z','2026-05-29T12:00:00Z'),
  ('20000000-0000-0000-0000-000000000005', 'Priya & Rui', 'revision_requested',
    '10000000-0000-0000-0000-000000000003',
    'https://images.unsplash.com/photo-1604549001484-df28edea610b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    ARRAY['https://images.unsplash.com/photo-1604549001484-df28edea610b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
    'medium',2,'wet_bath','standard',ARRAY['battery'],'weekend','suv','40k_50k','modern','',
    '2026-05-20T12:00:00Z','2026-05-27T12:00:00Z'),
  ('20000000-0000-0000-0000-000000000006', 'Aria & Sky', 'concept_generated', NULL,
    'https://images.unsplash.com/photo-1641996992441-244ee607935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    ARRAY['https://images.unsplash.com/photo-1641996992441-244ee607935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
    'medium',2,'dry_bath','standard','{}','weekend','suv','under_40k','modern',
    'Prefer a dry bath and more storage.',
    '2026-05-29T12:00:00Z','2026-05-29T12:00:00Z');

-- ─── seed: demo floorplans ────────────────────────────────────────────────────

INSERT INTO floorplans (id, project_id, version, status, uploaded_by, uploaded_at, label) VALUES
  ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',1,'superseded','designer','2026-05-24T12:00:00Z','17ft Trailer Layout'),
  ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',2,'current',   'designer','2026-05-28T12:00:00Z','17ft Trailer Layout'),
  ('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003',1,'superseded','designer','2026-05-10T12:00:00Z','16ft Trailer Layout'),
  ('30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000003',2,'superseded','designer','2026-05-14T12:00:00Z','16ft Trailer Layout'),
  ('30000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000003',3,'current',   'designer','2026-05-18T12:00:00Z','16ft Trailer Layout'),
  ('30000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000005',1,'current',   'designer','2026-05-27T12:00:00Z','17ft Trailer Layout');

-- ─── seed: demo comments ──────────────────────────────────────────────────────

INSERT INTO comments (id, project_id, author, role, body, created_at) VALUES
  ('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Maria',   'client',  'Could the kitchenette be a bit larger?','2026-05-25T12:00:00Z'),
  ('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Designer','designer','Done — v2 widens it by 20cm.',          '2026-05-28T12:00:00Z');

-- ─── seed: demo concept layout (Aria & Sky) ───────────────────────────────────

INSERT INTO concept_layouts (id, project_id, status, source, length_ft, width_ft, zones, rationale, created_at, updated_at)
VALUES (
  '50000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000006',
  'pending_review', 'template', 18.00, 7.50,
  '[{"kind":"entry","x":0,"y":0,"width":1.8,"depth":7.5},{"kind":"kitchenette","x":1.8,"y":0,"width":4.32,"depth":7.5},{"kind":"bathroom","x":6.12,"y":0,"width":3.24,"depth":7.5},{"kind":"storage","x":9.36,"y":0,"width":2.16,"depth":7.5},{"kind":"sleeping","x":11.52,"y":0,"width":6.48,"depth":7.5}]'::jsonb,
  'Rough zoning for a 18ft × 7.5ft trailer: entry at the hitch end, then kitchenette and wet bath mid-body, storage, and a rear sleeping area. A starting point for review — not a final architectural drawing.',
  '2026-05-29T12:00:00Z','2026-05-29T12:00:00Z'
);

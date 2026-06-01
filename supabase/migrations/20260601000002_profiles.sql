-- User profiles — stores role alongside auth.users.
--
-- Role is populated by the on_auth_user_created trigger from signup metadata.
-- Only 'client' and 'designer' are accepted from the public signup flow.
-- Any other value (including 'admin') is silently clamped to 'client'.
--
-- To promote a user to admin (run in Supabase SQL editor as a superuser):
--   UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';

CREATE TABLE profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'client'
             CHECK (role IN ('client', 'designer', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- Users can update their own profile but cannot self-promote to admin.
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role IN ('client', 'designer'));

GRANT SELECT, UPDATE ON profiles TO authenticated;

-- ─── trigger: create profile row on signup ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (
    NEW.id,
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN ('client', 'designer')
        THEN NEW.raw_user_meta_data->>'role'
      ELSE 'client'
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

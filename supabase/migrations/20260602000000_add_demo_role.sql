-- Add 'demo' as the default role for all regular signups.
--
-- Users who sign up through the public form get 'demo' — they see the
-- client/designer toggle for exploration. Role-specific accounts
-- (demo-client, demo-designer) keep their explicit roles; admin is
-- still only assignable via manual SQL.

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('demo', 'client', 'designer', 'admin'));

ALTER TABLE profiles
  ALTER COLUMN role SET DEFAULT 'demo';

-- Update the signup trigger: accept explicit 'client'/'designer' from
-- metadata (used by the role-specific demo accounts), default everyone
-- else to 'demo'.
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
      ELSE 'demo'
    END
  );
  RETURN NEW;
END;
$$;

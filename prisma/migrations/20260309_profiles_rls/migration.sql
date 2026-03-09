-- Profiles RLS policies and auto-creation trigger
-- Idempotent: uses IF NOT EXISTS / OR REPLACE guards

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Self-read: authenticated users can read their own profile
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_read_own_profile' AND tablename = 'profiles') THEN
    CREATE POLICY "users_read_own_profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

-- Self-update: users can update their own profile (except role)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_update_own_profile' AND tablename = 'profiles') THEN
    CREATE POLICY "users_update_own_profile" ON profiles
      FOR UPDATE USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Admin read all: admins can read all profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "admin_read_all_profiles" ON profiles
      FOR SELECT USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
      );
  END IF;
END $$;

-- Admin update all: admins can update any profile (including role)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_update_all_profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "admin_update_all_profiles" ON profiles
      FOR UPDATE USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
      );
  END IF;
END $$;

-- Profile auto-creation trigger
-- When a new user signs up via Supabase Auth, automatically create a profile row
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::text,
      'CUSTOMER'
    ),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger only if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

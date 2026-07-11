-- ============================================================
-- MaintainIQ - Supabase Setup
-- Run this entire file in: Supabase Dashboard > SQL Editor
-- ============================================================
--
-- DASHBOARD SETTINGS (do these BEFORE or AFTER running SQL):
--
-- App uses Supabase's DEFAULT link-based email templates (magic link
-- style) for both signup confirmation and password recovery — no need
-- to edit "Confirm signup" / "Reset password" templates at all.
--
-- 1) Authentication > Providers > Email
--    - Enable Email provider
--    - Enable "Confirm email"
--
-- 2) Authentication > URL Configuration  (REQUIRED — links won't work
--    without this, you'll get "requested path is invalid" errors)
--    Site URL: http://localhost:5173
--    Redirect URLs: http://localhost:5173/**
--    (add your deployed URL too once you host it, e.g. https://yourapp.vercel.app/**)
--
-- 3) Authentication > SMTP Settings
--    Using your own SMTP is recommended (Supabase's built-in email
--    sender is rate-limited to a few emails/hour, easy to hit while testing).
--
-- 4) Database > Replication (or Publications)
--    Enable Realtime for: assets, issues, activity_log, profiles
--
-- ============================================================

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT DEFAULT 'User',
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'technician', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  category TEXT,
  location TEXT,
  status TEXT DEFAULT 'Operational',
  condition TEXT DEFAULT 'Good',
  last_service_date TIMESTAMPTZ,
  next_service_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issues
CREATE TABLE IF NOT EXISTS public.issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in-progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.profiles(id),
  reported_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Activity log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  detail TEXT,
  reference_type TEXT,
  reference_id UUID,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Helper: checks admin role WITHOUT going back through profiles' own RLS
-- (querying profiles directly inside a profiles policy causes
-- "infinite recursion detected in policy for relation profiles")
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Assets policies
DROP POLICY IF EXISTS "Authenticated users can read assets" ON public.assets;
CREATE POLICY "Authenticated users can read assets" ON public.assets
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public can read assets" ON public.assets;
CREATE POLICY "Public can read assets" ON public.assets
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Admins can manage assets" ON public.assets;
CREATE POLICY "Admins can manage assets" ON public.assets
  FOR ALL TO authenticated USING (public.is_admin());

-- Issues policies
DROP POLICY IF EXISTS "Authenticated users can read issues" ON public.issues;
CREATE POLICY "Authenticated users can read issues" ON public.issues
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public can read issues" ON public.issues;
CREATE POLICY "Public can read issues" ON public.issues
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Anyone can report issues" ON public.issues;
CREATE POLICY "Anyone can report issues" ON public.issues
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage issues" ON public.issues;
CREATE POLICY "Admins can manage issues" ON public.issues
  FOR UPDATE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete issues" ON public.issues;
CREATE POLICY "Admins can delete issues" ON public.issues
  FOR DELETE TO authenticated USING (public.is_admin());

-- Activity log policies
DROP POLICY IF EXISTS "Authenticated users can read activity" ON public.activity_log;
CREATE POLICY "Authenticated users can read activity" ON public.activity_log
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert activity" ON public.activity_log;
CREATE POLICY "Authenticated users can insert activity" ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

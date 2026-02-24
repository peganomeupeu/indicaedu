
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'headhunter');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Referral status enum
CREATE TYPE public.referral_status AS ENUM ('indicado', 'contato_realizado', 'inscrito', 'matriculado', 'nao_convertido');

-- Interest level enum
CREATE TYPE public.interest_level AS ENUM ('baixo', 'medio', 'alto');

-- Referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headhunter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_name TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  referred_phone TEXT NOT NULL,
  referred_company TEXT NOT NULL,
  referred_position TEXT NOT NULL,
  course TEXT NOT NULL,
  interest_level public.interest_level NOT NULL DEFAULT 'medio',
  notes TEXT DEFAULT '',
  status public.referral_status NOT NULL DEFAULT 'indicado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Status history table
CREATE TABLE public.referral_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  old_status public.referral_status,
  new_status public.referral_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_status_history ENABLE ROW LEVEL SECURITY;

-- ============ HELPER FUNCTIONS ============

-- Check if user has a specific role (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get profile id for current user
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  -- Default role: headhunter
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'headhunter');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on referrals
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-log status changes
CREATE OR REPLACE FUNCTION public.log_referral_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.referral_status_history (referral_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_referral_status_change
  AFTER UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.log_referral_status_change();

-- ============ RLS POLICIES ============

-- user_roles: users can read their own role, admins can read all
CREATE POLICY "Users can read own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- profiles: everyone authenticated can read, users can update own
CREATE POLICY "Authenticated can read profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- referrals: headhunters see own, admins see all
CREATE POLICY "Headhunters can insert own referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (headhunter_id = public.get_my_profile_id());

CREATE POLICY "Users can read own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (headhunter_id = public.get_my_profile_id() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update referrals" ON public.referrals
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete referrals" ON public.referrals
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- referral_status_history: same as referrals
CREATE POLICY "Users can read own referral history" ON public.referral_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.referrals r
      WHERE r.id = referral_id
      AND (r.headhunter_id = public.get_my_profile_id() OR public.has_role(auth.uid(), 'admin'))
    )
  );

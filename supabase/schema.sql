-- FarmaWatch Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  province TEXT,
  city TEXT,
  whatsapp TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ticket categories
CREATE TABLE ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rejection reasons
CREATE TABLE rejection_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID REFERENCES profiles(id) NULL,
  is_anonymous BOOLEAN DEFAULT false,
  category_id UUID REFERENCES ticket_categories(id),
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  description TEXT NOT NULL,
  drug_product TEXT,
  image_urls TEXT[] DEFAULT '{}',
  hyperlinks TEXT[],
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'under_review', 'resolved', 'rejected')),
  rejection_reason_id UUID REFERENCES rejection_reasons(id),
  ai_summary TEXT,
  ai_tags TEXT[],
  tagging_method TEXT CHECK (tagging_method IN ('ai', 'fallback')),
  accepted_by UUID REFERENCES profiles(id),
  accepted_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_province ON tickets(province);
CREATE INDEX idx_tickets_category ON tickets(category_id);
CREATE INDEX idx_tickets_created ON tickets(created_at DESC);
CREATE INDEX idx_tickets_submitted_by ON tickets(submitted_by);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_role ON profiles(role);

-- accepted_by/accepted_at wajib saat status = 'accepted'
ALTER TABLE tickets ADD CONSTRAINT accepted_requires_fields
  CHECK (status != 'accepted' OR (accepted_by IS NOT NULL AND accepted_at IS NOT NULL));

-- resolved_by/resolved_at wajib saat status = 'resolved'
ALTER TABLE tickets ADD CONSTRAINT resolved_requires_fields
  CHECK (status != 'resolved' OR (resolved_by IS NOT NULL AND resolved_at IS NOT NULL));

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Notify AI tagging service when ticket is accepted
-- Used by Supabase Database Webhook or pg_notify listener
CREATE OR REPLACE FUNCTION public.notify_ticket_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_notify(
    'ai_tagging',
    json_build_object('ticket_id', NEW.id)::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_ai_tagging
  AFTER UPDATE OF status ON tickets
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM 'accepted' AND NEW.status = 'accepted')
  EXECUTE FUNCTION public.notify_ticket_accepted();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Helper functions (SECURITY DEFINER bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid
      AND role IN ('admin', 'superadmin')
      AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid
      AND role = 'superadmin'
      AND status = 'approved'
  );
$$;

-- Validates ticket status transitions (called by RLS WITH CHECK)
CREATE OR REPLACE FUNCTION public.is_valid_ticket_transition(ticket_id UUID, new_status TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = ticket_id
    AND (
      (t.status = 'submitted' AND new_status IN ('accepted', 'rejected'))
      OR (t.status = 'accepted' AND new_status IN ('under_review'))
      OR (t.status = 'under_review' AND new_status IN ('resolved'))
      OR (t.status IN ('resolved', 'rejected') AND new_status = t.status)
    )
  );
$$;

-- Auto-create profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'user',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; admins can read all
CREATE POLICY "Read profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin(auth.uid())
  );

-- Users can update only safe fields on their own profile.
-- Privileged fields (role, status) cannot be changed by the user.
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND status = (SELECT status FROM profiles WHERE id = auth.uid())
  );

-- Admins can update profiles.
-- Superadmins have full access.
-- Regular admins can update non-privileged fields (status, province, city, whatsapp)
-- but cannot change role (their own or others').
CREATE POLICY "Admins update profiles" ON profiles
  FOR UPDATE USING (public.is_admin(auth.uid()))
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (
      role = (SELECT p.role FROM profiles p WHERE p.id = profiles.id)
    )
  );

-- Superadmin can delete profiles
CREATE POLICY "Superadmin delete profiles" ON profiles
  FOR DELETE USING (public.is_superadmin(auth.uid()));

-- No client-side INSERT: profiles are created by the on_auth_user_created trigger.

-- Ticket Categories RLS
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read active categories" ON ticket_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins read all categories" ON ticket_categories
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Superadmin manage categories" ON ticket_categories
  FOR ALL USING (public.is_superadmin(auth.uid()));

-- Rejection Reasons RLS
ALTER TABLE rejection_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read rejection reasons" ON rejection_reasons
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Superadmin manage reasons" ON rejection_reasons
  FOR ALL USING (public.is_superadmin(auth.uid()));

-- Tickets RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can insert tickets.
-- Authenticated submitters can only stamp their own user id; admins/services bypass via service role.
CREATE POLICY "Anyone insert tickets" ON tickets
  FOR INSERT
  WITH CHECK (
    status = 'submitted'
    AND accepted_by IS NULL
    AND resolved_by IS NULL
    AND ai_summary IS NULL
    AND ai_tags IS NULL
    AND (
      submitted_by IS NULL
      OR submitted_by = auth.uid()
    )
  );

CREATE POLICY "Users read own tickets" ON tickets
  FOR SELECT USING (
    auth.uid() = submitted_by OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins update tickets" ON tickets
  FOR UPDATE USING (public.is_admin(auth.uid()))
  WITH CHECK (
    public.is_valid_ticket_transition(id, status)
    AND (status != 'rejected' OR rejection_reason_id IS NOT NULL)
  );

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-images', 'ticket-images', true)
ON CONFLICT (id) DO NOTHING;

-- Read ticket images:
--   - Public can read images belonging to anonymous tickets
--   - Authenticated submitters can read their own ticket images
--   - Admins can read all
CREATE POLICY "Read ticket images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'ticket-images'
    AND (
      public.is_admin(auth.uid())
      OR (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM tickets
        WHERE id::text = split_part(name, '/', 2)
        AND submitted_by = auth.uid()
      ))
      OR EXISTS (
        SELECT 1 FROM tickets
        WHERE id::text = split_part(name, '/', 2)
        AND is_anonymous = true
      )
    )
  );

-- Restrict uploads: only to ticket-images bucket, only image mime types, max 8 MB.
CREATE POLICY "Restricted upload ticket images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ticket-images'
    AND (lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'))
    AND coalesce((metadata->>'size')::bigint, 0) <= 8388608
  );

-- Admins & superadmins can delete images
CREATE POLICY "Admins delete ticket images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ticket-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND status = 'approved'
    )
  );

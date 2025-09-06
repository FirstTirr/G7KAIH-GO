-- Temporarily disable RLS on all tables for testing
-- WARNING: This removes security - only for debugging!

-- Disable RLS on all main tables
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.aktivitas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.aktivitas_field_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.aktivitas_field_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.aktivitas_field_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.category DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.komentar DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.role DISABLE ROW LEVEL SECURITY;

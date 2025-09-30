-- WARNING: FOR DEBUGGING PURPOSES ONLY.
-- This script grants broad read access to the 'teacher' role (roleid = 2).
-- These policies are NOT secure for a production environment as they allow teacher to see more data than they should.
-- The purpose is to unblock development and verify data flow.
-- Replace these with more restrictive policies before going to production.

-- Function to get the current user's roleid (reuse existing function)
CREATE OR REPLACE FUNCTION get_my_roleid()
RETURNS int
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT roleid FROM public.user_profiles WHERE userid = auth.uid();
$$;

-- Grant SELECT access to teacher on all relevant tables

-- Table: user_profiles
DROP POLICY IF EXISTS "Teacher can read all user_profiles" ON public.user_profiles;
CREATE POLICY "Teacher can read all user_profiles"
ON public.user_profiles FOR SELECT
USING (get_my_roleid() = 2);

-- Table: aktivitas
DROP POLICY IF EXISTS "Teacher can read all aktivitas" ON public.aktivitas;
CREATE POLICY "Teacher can read all aktivitas"
ON public.aktivitas FOR SELECT
USING (get_my_roleid() = 2);

-- Table: komentar
DROP POLICY IF EXISTS "Teacher can read all komentar" ON public.komentar;
CREATE POLICY "Teacher can read all komentar"
ON public.komentar FOR SELECT
USING (get_my_roleid() = 2);

-- Table: kegiatan
DROP POLICY IF EXISTS "Teacher can read all kegiatan" ON public.kegiatan;
CREATE POLICY "Teacher can read all kegiatan"
ON public.kegiatan FOR SELECT
USING (get_my_roleid() = 2);

-- Table: category
DROP POLICY IF EXISTS "Teacher can read all category" ON public.category;
CREATE POLICY "Teacher can read all category"
ON public.category FOR SELECT
USING (get_my_roleid() = 2);

-- Table: kegiatan_categories
DROP POLICY IF EXISTS "Teacher can read all kegiatan_categories" ON public.kegiatan_categories;
CREATE POLICY "Teacher can read all kegiatan_categories"
ON public.kegiatan_categories FOR SELECT
USING (get_my_roleid() = 2);

-- Table: aktivitas_field_values
DROP POLICY IF EXISTS "Teacher can read all aktivitas_field_values" ON public.aktivitas_field_values;
CREATE POLICY "Teacher can read all aktivitas_field_values"
ON public.aktivitas_field_values FOR SELECT
USING (get_my_roleid() = 2);

-- Table: category_fields
DROP POLICY IF EXISTS "Teacher can read all category_fields" ON public.category_fields;
CREATE POLICY "Teacher can read all category_fields"
ON public.category_fields FOR SELECT
USING (get_my_roleid() = 2);

-- Table: aktivitas_field_files (if exists)
DROP POLICY IF EXISTS "Teacher can read all aktivitas_field_files" ON public.aktivitas_field_files;
CREATE POLICY "Teacher can read all aktivitas_field_files"
ON public.aktivitas_field_files FOR SELECT
USING (get_my_roleid() = 2);

-- Table: aktivitas_field_images
DROP POLICY IF EXISTS "Teacher can read all aktivitas_field_images" ON public.aktivitas_field_images;
CREATE POLICY "Teacher can read all aktivitas_field_images"
ON public.aktivitas_field_images FOR SELECT
USING (get_my_roleid() = 2);

-- Table: role
DROP POLICY IF EXISTS "Teacher can read all role" ON public.role;
CREATE POLICY "Teacher can read all role"
ON public.role FOR SELECT
USING (get_my_roleid() = 2);

-- Also allow teacher to create/update/delete their own comments
DROP POLICY IF EXISTS "Teacher can manage their own comments" ON public.komentar;
CREATE POLICY "Teacher can manage their own comments"
ON public.komentar FOR ALL
USING (auth.uid() = userid AND get_my_roleid() = 2)
WITH CHECK (auth.uid() = userid AND get_my_roleid() = 2);

-- Allow teacher to validate activities (similar to guruwali)
DROP POLICY IF EXISTS "Teacher can update aktivitas validation" ON public.aktivitas;
CREATE POLICY "Teacher can update aktivitas validation"
ON public.aktivitas FOR UPDATE
USING (get_my_roleid() = 2)
WITH CHECK (get_my_roleid() = 2);

-- Allow teacher to update aktivitas_field_values validation status
DROP POLICY IF EXISTS "Teacher can update aktivitas_field_values validation" ON public.aktivitas_field_values;
CREATE POLICY "Teacher can update aktivitas_field_values validation"
ON public.aktivitas_field_values FOR UPDATE
USING (get_my_roleid() = 2)
WITH CHECK (get_my_roleid() = 2);

-- Allow teacher to insert new comments for students
DROP POLICY IF EXISTS "Teacher can insert komentar" ON public.komentar;
CREATE POLICY "Teacher can insert komentar"
ON public.komentar FOR INSERT
WITH CHECK (get_my_roleid() = 2);
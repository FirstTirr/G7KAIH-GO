-- Update RLS policies and functions for guruwali functionality
-- Using existing columns: is_guruwali and is_wali_kelas

-- Create helper functions for guruwali assignment logic

-- Function to check if user is guruwali
CREATE OR REPLACE FUNCTION is_guruwali()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(is_guruwali, false) FROM public.user_profiles WHERE userid = auth.uid();
$$;

-- Function to check if user is teacher OR has guruwali privileges
CREATE OR REPLACE FUNCTION is_teacher_or_guruwali()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT (roleid = 2 OR roleid = 6 OR COALESCE(is_guruwali, false)) 
  FROM public.user_profiles 
  WHERE userid = auth.uid();
$$;

-- Function to get students under current user's supervision
CREATE OR REPLACE FUNCTION get_my_supervised_students()
RETURNS TABLE(userid uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH current_user_profile AS (
    SELECT userid, kelas, is_wali_kelas, roleid, is_guruwali
    FROM public.user_profiles 
    WHERE userid = auth.uid()
  )
  SELECT up_student.userid
  FROM public.user_profiles up_student, current_user_profile cup
  WHERE up_student.roleid = 5 -- student role
    AND (
      -- Direct assignment via guruwali_userid
      up_student.guruwali_userid = cup.userid
      OR
      -- Class-based assignment (if current user is wali kelas)
      (cup.is_wali_kelas = true AND up_student.kelas = cup.kelas)
      OR
      -- If user is full guruwali, can supervise all students
      (cup.roleid = 6)
    );
$$;

-- Update RLS policies to use new logic

-- Table: user_profiles
DROP POLICY IF EXISTS "Teacher and Guruwali can read all user_profiles" ON public.user_profiles;
CREATE POLICY "Teacher and Guruwali can read all user_profiles"
ON public.user_profiles FOR SELECT
USING (is_teacher_or_guruwali());

-- Table: aktivitas
DROP POLICY IF EXISTS "Teacher and Guruwali can read all aktivitas" ON public.aktivitas;
CREATE POLICY "Teacher and Guruwali can read all aktivitas"
ON public.aktivitas FOR SELECT
USING (is_teacher_or_guruwali());

-- Table: komentar
DROP POLICY IF EXISTS "Teacher and Guruwali can read all komentar" ON public.komentar;
CREATE POLICY "Teacher and Guruwali can read all komentar"
ON public.komentar FOR SELECT
USING (is_teacher_or_guruwali());

-- Table: kegiatan
DROP POLICY IF EXISTS "Teacher and Guruwali can read all kegiatan" ON public.kegiatan;
CREATE POLICY "Teacher and Guruwali can read all kegiatan"
ON public.kegiatan FOR SELECT
USING (is_teacher_or_guruwali());

-- Table: category
DROP POLICY IF EXISTS "Teacher and Guruwali can read all category" ON public.category;
CREATE POLICY "Teacher and Guruwali can read all category"
ON public.category FOR SELECT
USING (is_teacher_or_guruwali());

-- Table: kegiatan_categories
DROP POLICY IF EXISTS "Teacher and Guruwali can read all kegiatan_categories" ON public.kegiatan_categories;
CREATE POLICY "Teacher and Guruwali can read all kegiatan_categories"
ON public.kegiatan_categories FOR SELECT
USING (is_teacher_or_guruwali());

-- Table: aktivitas_field_values
DROP POLICY IF EXISTS "Teacher and Guruwali can read all aktivitas_field_values" ON public.aktivitas_field_values;
CREATE POLICY "Teacher and Guruwali can read all aktivitas_field_values"
ON public.aktivitas_field_values FOR SELECT
USING (is_teacher_or_guruwali());

-- Table: category_fields
DROP POLICY IF EXISTS "Teacher and Guruwali can read all category_fields" ON public.category_fields;
CREATE POLICY "Teacher and Guruwali can read all category_fields"
ON public.category_fields FOR SELECT
USING (is_teacher_or_guruwali());

-- Table: aktivitas_field_files
DROP POLICY IF EXISTS "Teacher and Guruwali can read all aktivitas_field_files" ON public.aktivitas_field_files;
CREATE POLICY "Teacher and Guruwali can read all aktivitas_field_files"
ON public.aktivitas_field_files FOR SELECT
USING (is_teacher_or_guruwali());

-- Table: role
DROP POLICY IF EXISTS "Teacher and Guruwali can read all role" ON public.role;
CREATE POLICY "Teacher and Guruwali can read all role"
ON public.role FOR SELECT
USING (is_teacher_or_guruwali());

-- Allow teacher and guruwali to manage comments
DROP POLICY IF EXISTS "Teacher and Guruwali can manage their own comments" ON public.komentar;
CREATE POLICY "Teacher and Guruwali can manage their own comments"
ON public.komentar FOR ALL
USING (auth.uid() = userid AND is_teacher_or_guruwali())
WITH CHECK (auth.uid() = userid AND is_teacher_or_guruwali());

-- Allow teacher and guruwali to validate activities
DROP POLICY IF EXISTS "Teacher and Guruwali can update aktivitas validation" ON public.aktivitas;
CREATE POLICY "Teacher and Guruwali can update aktivitas validation"
ON public.aktivitas FOR UPDATE
USING (is_teacher_or_guruwali())
WITH CHECK (is_teacher_or_guruwali());

-- Allow teacher and guruwali to update aktivitas_field_values validation status
DROP POLICY IF EXISTS "Teacher and Guruwali can update aktivitas_field_values validation" ON public.aktivitas_field_values;
CREATE POLICY "Teacher and Guruwali can update aktivitas_field_values validation"
ON public.aktivitas_field_values FOR UPDATE
USING (is_teacher_or_guruwali())
WITH CHECK (is_teacher_or_guruwali());
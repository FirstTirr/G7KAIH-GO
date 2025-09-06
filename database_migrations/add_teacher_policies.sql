-- Add comprehensive teacher policies for all necessary tables

-- Teacher can read all user profiles (to see students)
DROP POLICY IF EXISTS "Teacher can read all user_profiles" ON public.user_profiles;
CREATE POLICY "Teacher can read all user_profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'teacher'
  )
);

-- Teacher can read all aktivitas (to monitor student activities)
DROP POLICY IF EXISTS "Teacher can read all aktivitas" ON public.aktivitas;
CREATE POLICY "Teacher can read all aktivitas"
ON public.aktivitas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'teacher'
  )
);

-- Teacher can read all aktivitas_field_values (to see student submissions)
DROP POLICY IF EXISTS "Teacher can read all aktivitas_field_values" ON public.aktivitas_field_values;
CREATE POLICY "Teacher can read all aktivitas_field_values"
ON public.aktivitas_field_values
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'teacher'
  )
);

-- Teacher can update aktivitas_field_values (for validation)
DROP POLICY IF EXISTS "Teacher can update aktivitas_field_values" ON public.aktivitas_field_values;
CREATE POLICY "Teacher can update aktivitas_field_values"
ON public.aktivitas_field_values
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'teacher'
  )
);

-- Teacher can read all aktivitas_field_images (to see uploaded files)
DROP POLICY IF EXISTS "Teacher can read all aktivitas_field_images" ON public.aktivitas_field_images;
CREATE POLICY "Teacher can read all aktivitas_field_images"
ON public.aktivitas_field_images
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'teacher'
  )
);

-- Teacher can read all category_fields (to understand field structure)
DROP POLICY IF EXISTS "Teacher can read all category_fields" ON public.category_fields;
CREATE POLICY "Teacher can read all category_fields"
ON public.category_fields
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'teacher'
  )
);

-- Teacher can read all categories (to understand categories)
DROP POLICY IF EXISTS "Teacher can read all category" ON public.category;
CREATE POLICY "Teacher can read all category"
ON public.category
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'teacher'
  )
);

-- Teacher can read all kegiatan (to understand activities)
DROP POLICY IF EXISTS "Teacher can read all kegiatan" ON public.kegiatan;
CREATE POLICY "Teacher can read all kegiatan"
ON public.kegiatan
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'teacher'
  )
);

-- Teacher can read roles (for understanding user roles)
DROP POLICY IF EXISTS "Teacher can read all role" ON public.role;
CREATE POLICY "Teacher can read all role"
ON public.role
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'teacher'
  )
);

-- Teacher can read comments (for monitoring)
DROP POLICY IF EXISTS "Teacher can read all komentar" ON public.komentar;
CREATE POLICY "Teacher can read all komentar"
ON public.komentar
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'teacher'
  )
);

-- Teacher can insert comments (for feedback)
DROP POLICY IF EXISTS "Teacher can insert komentar" ON public.komentar;
CREATE POLICY "Teacher can insert komentar"
ON public.komentar
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'teacher'
  )
);

-- Teacher can update comments (for editing their feedback)
DROP POLICY IF EXISTS "Teacher can update own komentar" ON public.komentar;
CREATE POLICY "Teacher can update own komentar"
ON public.komentar
FOR UPDATE
TO authenticated
USING (
  userid = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'teacher'
  )
);

-- Drop all existing teacher policies first
DROP POLICY IF EXISTS "Teacher can read all user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Teacher can read all aktivitas" ON public.aktivitas;
DROP POLICY IF EXISTS "Teacher can read all aktivitas_field_values" ON public.aktivitas_field_values;
DROP POLICY IF EXISTS "Teacher can update aktivitas_field_values" ON public.aktivitas_field_values;
DROP POLICY IF EXISTS "Teacher can read all aktivitas_field_images" ON public.aktivitas_field_images;
DROP POLICY IF EXISTS "Teacher can read all category_fields" ON public.category_fields;
DROP POLICY IF EXISTS "Teacher can read all category" ON public.category;
DROP POLICY IF EXISTS "Teacher can read all kegiatan" ON public.kegiatan;
DROP POLICY IF EXISTS "Teacher can read all role" ON public.role;
DROP POLICY IF EXISTS "Teacher can read all komentar" ON public.komentar;
DROP POLICY IF EXISTS "Teacher can insert komentar" ON public.komentar;
DROP POLICY IF EXISTS "Teacher can update own komentar" ON public.komentar;

-- Use the same approach as parent policies
-- Function already exists: get_my_roleid()

-- Grant SELECT access to teachers on all relevant tables (roleid = 2 for teacher)

-- Table: user_profiles
DROP POLICY IF EXISTS "Teachers can read all user_profiles" ON public.user_profiles;
CREATE POLICY "Teachers can read all user_profiles"
ON public.user_profiles FOR SELECT
USING (get_my_roleid() = 2);

-- Table: aktivitas
DROP POLICY IF EXISTS "Teachers can read all aktivitas" ON public.aktivitas;
CREATE POLICY "Teachers can read all aktivitas"
ON public.aktivitas FOR SELECT
USING (get_my_roleid() = 2);

-- Table: komentar
DROP POLICY IF EXISTS "Teachers can read all komentar" ON public.komentar;
CREATE POLICY "Teachers can read all komentar"
ON public.komentar FOR SELECT
USING (get_my_roleid() = 2);

-- Table: kegiatan
DROP POLICY IF EXISTS "Teachers can read all kegiatan" ON public.kegiatan;
CREATE POLICY "Teachers can read all kegiatan"
ON public.kegiatan FOR SELECT
USING (get_my_roleid() = 2);

-- Table: category
DROP POLICY IF EXISTS "Teachers can read all category" ON public.category;
CREATE POLICY "Teachers can read all category"
ON public.category FOR SELECT
USING (get_my_roleid() = 2);

-- Table: kegiatan_categories
DROP POLICY IF EXISTS "Teachers can read all kegiatan_categories" ON public.kegiatan_categories;
CREATE POLICY "Teachers can read all kegiatan_categories"
ON public.kegiatan_categories FOR SELECT
USING (get_my_roleid() = 2);

-- Table: aktivitas_field_values
DROP POLICY IF EXISTS "Teachers can read all aktivitas_field_values" ON public.aktivitas_field_values;
CREATE POLICY "Teachers can read all aktivitas_field_values"
ON public.aktivitas_field_values FOR SELECT
USING (get_my_roleid() = 2);

-- Teachers can also update aktivitas_field_values for validation
DROP POLICY IF EXISTS "Teachers can update aktivitas_field_values" ON public.aktivitas_field_values;
CREATE POLICY "Teachers can update aktivitas_field_values"
ON public.aktivitas_field_values FOR UPDATE
USING (get_my_roleid() = 2);

-- Table: category_fields
DROP POLICY IF EXISTS "Teachers can read all category_fields" ON public.category_fields;
CREATE POLICY "Teachers can read all category_fields"
ON public.category_fields FOR SELECT
USING (get_my_roleid() = 2);

-- Table: aktivitas_field_images
DROP POLICY IF EXISTS "Teachers can read all aktivitas_field_images" ON public.aktivitas_field_images;
CREATE POLICY "Teachers can read all aktivitas_field_images"
ON public.aktivitas_field_images FOR SELECT
USING (get_my_roleid() = 2);

-- Table: role
DROP POLICY IF EXISTS "Teachers can read all role" ON public.role;
CREATE POLICY "Teachers can read all role"
ON public.role FOR SELECT
USING (get_my_roleid() = 2);

-- Allow teachers to create/update/delete their own comments
DROP POLICY IF EXISTS "Teachers can manage their own comments" ON public.komentar;
CREATE POLICY "Teachers can manage their own comments"
ON public.komentar FOR ALL
USING (auth.uid() = userid AND get_my_roleid() = 2)
WITH CHECK (auth.uid() = userid AND get_my_roleid() = 2);

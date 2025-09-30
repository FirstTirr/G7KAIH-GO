-- Allow students to read category field definitions without service-role access
DROP POLICY IF EXISTS "Students can read category_fields" ON public.category_fields;
CREATE POLICY "Students can read category_fields"
ON public.category_fields
FOR SELECT
TO authenticated
USING (get_user_role() = 'student'::text);

-- Allow students to read category metadata
DROP POLICY IF EXISTS "Students can read category" ON public.category;
CREATE POLICY "Students can read category"
ON public.category
FOR SELECT
TO authenticated
USING (get_user_role() = 'student'::text);

-- Allow students to read kegiatan-category links for visible kegiatan
DROP POLICY IF EXISTS "Students can read kegiatan_categories" ON public.kegiatan_categories;
CREATE POLICY "Students can read kegiatan_categories"
ON public.kegiatan_categories
FOR SELECT
TO authenticated
USING (
	get_user_role() = 'student'::text
);

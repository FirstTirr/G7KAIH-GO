-- WARNING: FOR DEBUGGING PURPOSES ONLY.
-- This script grants broad read access to the 'parent' role (roleid = 4).
-- These policies are NOT secure for a production environment as they allow parents to see more data than they should.
-- The purpose is to unblock development and verify data flow.
-- Replace these with more restrictive policies before going to production.

-- Function to get the current user's roleid
CREATE OR REPLACE FUNCTION get_my_roleid()
RETURNS int
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT roleid FROM public.user_profiles WHERE userid = auth.uid();
$$;

-- Grant SELECT access to parents on all relevant tables

-- Table: user_profiles
DROP POLICY IF EXISTS "Parents can read all user_profiles" ON public.user_profiles;
CREATE POLICY "Parents can read all user_profiles"
ON public.user_profiles FOR SELECT
USING (get_my_roleid() = 4);

-- Table: aktivitas
DROP POLICY IF EXISTS "Parents can read all aktivitas" ON public.aktivitas;
CREATE POLICY "Parents can read all aktivitas"
ON public.aktivitas FOR SELECT
USING (get_my_roleid() = 4);

-- Table: komentar
DROP POLICY IF EXISTS "Parents can read all komentar" ON public.komentar;
CREATE POLICY "Parents can read all komentar"
ON public.komentar FOR SELECT
USING (get_my_roleid() = 4);

-- Table: kegiatan
DROP POLICY IF EXISTS "Parents can read all kegiatan" ON public.kegiatan;
CREATE POLICY "Parents can read all kegiatan"
ON public.kegiatan FOR SELECT
USING (get_my_roleid() = 4);

-- Table: category
DROP POLICY IF EXISTS "Parents can read all category" ON public.category;
CREATE POLICY "Parents can read all category"
ON public.category FOR SELECT
USING (get_my_roleid() = 4);

-- Table: kegiatan_categories
DROP POLICY IF EXISTS "Parents can read all kegiatan_categories" ON public.kegiatan_categories;
CREATE POLICY "Parents can read all kegiatan_categories"
ON public.kegiatan_categories FOR SELECT
USING (get_my_roleid() = 4);

-- Table: aktivitas_field_values
DROP POLICY IF EXISTS "Parents can read all aktivitas_field_values" ON public.aktivitas_field_values;
CREATE POLICY "Parents can read all aktivitas_field_values"
ON public.aktivitas_field_values FOR SELECT
USING (get_my_roleid() = 4);

-- Table: category_fields
DROP POLICY IF EXISTS "Parents can read all category_fields" ON public.category_fields;
CREATE POLICY "Parents can read all category_fields"
ON public.category_fields FOR SELECT
USING (get_my_roleid() = 4);

-- Also allow parents to create/update/delete their own comments
DROP POLICY IF EXISTS "Parents can manage their own comments" ON public.komentar;
CREATE POLICY "Parents can manage their own comments"
ON public.komentar FOR ALL
USING (auth.uid() = userid AND get_my_roleid() = 4)
WITH CHECK (auth.uid() = userid AND get_my_roleid() = 4);

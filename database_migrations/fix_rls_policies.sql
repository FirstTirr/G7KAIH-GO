-- Drop the problematic policy and create simpler ones
DROP POLICY IF EXISTS "Parent can read student profiles" ON public.user_profiles;

-- Simple policy for parents to read any user profile (for monitoring)
CREATE POLICY "Parent can read all user profiles" ON public.user_profiles
FOR SELECT USING (get_user_role() = 'parent'::text);

-- Ensure aktivitas_field_values and category_fields policies exist
DROP POLICY IF EXISTS "Parent can read all aktivitas_field_values" ON public.aktivitas_field_values;
CREATE POLICY "Parent can read all aktivitas_field_values" ON public.aktivitas_field_values
FOR SELECT USING (get_user_role() = 'parent'::text);

DROP POLICY IF EXISTS "Parent can read all category_fields" ON public.category_fields;
CREATE POLICY "Parent can read all category_fields" ON public.category_fields
FOR SELECT USING (get_user_role() = 'parent'::text);

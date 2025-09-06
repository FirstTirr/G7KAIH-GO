-- Drop all parent-related RLS policies that were just added
DROP POLICY IF EXISTS "Parent can read all aktivitas_field_values" ON public.aktivitas_field_values;
DROP POLICY IF EXISTS "Parent can read all category_fields" ON public.category_fields;
DROP POLICY IF EXISTS "Parent can read student profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Parent can read student aktivitas" ON public.aktivitas;
DROP POLICY IF EXISTS "Parent can validate aktivitas_field_values" ON public.aktivitas_field_values;

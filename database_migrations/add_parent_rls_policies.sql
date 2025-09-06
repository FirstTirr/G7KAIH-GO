-- Add RLS policies for parent access to field values and related tables

-- Policy for aktivitas_field_values table - allow parents to read field values
CREATE POLICY "Parent can read all aktivitas_field_values" ON public.aktivitas_field_values
FOR SELECT USING (get_user_role() = 'parent'::text);

-- Policy for category_fields table - allow parents to read category fields
CREATE POLICY "Parent can read all category_fields" ON public.category_fields
FOR SELECT USING (get_user_role() = 'parent'::text);

-- Additional policy for parents to read user profiles of students they monitor
-- This allows parents to access student profiles for monitoring purposes
CREATE POLICY "Parent can read student profiles" ON public.user_profiles
FOR SELECT USING (
  get_user_role() = 'parent'::text AND 
  (
    -- Can read their own profile
    auth.uid() = userid OR 
    -- Can read profile of student they are parent of
    EXISTS (
      SELECT 1 FROM user_profiles parent_profile 
      WHERE parent_profile.userid = auth.uid() 
      AND parent_profile.parent_of_userid = user_profiles.userid
    )
  )
);

-- Policy for parents to read aktivitas of their students
CREATE POLICY "Parent can read student aktivitas" ON public.aktivitas
FOR SELECT USING (
  get_user_role() = 'parent'::text AND 
  EXISTS (
    SELECT 1 FROM user_profiles parent_profile 
    WHERE parent_profile.userid = auth.uid() 
    AND parent_profile.parent_of_userid = aktivitas.userid
  )
);

-- Allow parents to update validation status in aktivitas_field_values
CREATE POLICY "Parent can validate aktivitas_field_values" ON public.aktivitas_field_values
FOR UPDATE USING (
  get_user_role() = 'parent'::text AND 
  EXISTS (
    SELECT 1 FROM aktivitas a
    JOIN user_profiles parent_profile ON parent_profile.userid = auth.uid()
    WHERE a.activityid = aktivitas_field_values.activityid
    AND parent_profile.parent_of_userid = a.userid
  )
);

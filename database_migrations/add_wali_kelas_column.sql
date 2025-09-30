-- Add missing is_wali_kelas column to user_profiles table
-- This allows teachers to be designated as homeroom teachers

-- Add new column
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_wali_kelas boolean DEFAULT false;

-- Update existing policies to include is_wali_kelas
-- Function to check if user is wali kelas
CREATE OR REPLACE FUNCTION is_wali_kelas()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(is_wali_kelas, false) FROM public.user_profiles WHERE userid = auth.uid();
$$;

-- Function to check if user is teacher or wali kelas 
CREATE OR REPLACE FUNCTION is_teacher_or_wali()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT (roleid = 2 OR roleid = 6 OR COALESCE(is_guruwali, false) OR COALESCE(is_wali_kelas, false)) 
  FROM public.user_profiles 
  WHERE userid = auth.uid();
$$;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.is_wali_kelas IS 'Boolean flag to indicate if teacher is assigned as homeroom teacher (wali kelas)';
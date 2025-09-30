-- Add guruwali_userid field to user_profiles table
-- This field will track which guruwali (homeroom teacher) supervises each student

ALTER TABLE public.user_profiles 
ADD COLUMN guruwali_userid uuid;

-- Add foreign key constraint
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_guruwali_userid_fkey 
FOREIGN KEY (guruwali_userid) REFERENCES auth.users(id);

-- Add index for better query performance
CREATE INDEX idx_user_profiles_guruwali_userid ON public.user_profiles(guruwali_userid);

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.guruwali_userid IS 'UUID of the guruwali (homeroom teacher) who supervises this student';

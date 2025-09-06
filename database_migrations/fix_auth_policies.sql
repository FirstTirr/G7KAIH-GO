-- Fix user_profiles access for all authenticated users
-- Allow users to read their own profile and others (needed for auth flow)

-- Drop existing restrictive policies that might block auth flow
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Allow authenticated users to read any user profile (needed for role resolution)
CREATE POLICY "Authenticated users can read user_profiles"
ON public.user_profiles FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (userid = auth.uid())
WITH CHECK (userid = auth.uid());

-- Allow users to insert their own profile (for new signups)
CREATE POLICY "Users can insert own profile"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (userid = auth.uid());

-- Allow reading role table for all authenticated users (needed for role resolution)
DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.role;
CREATE POLICY "Authenticated users can read roles"
ON public.role FOR SELECT
TO authenticated
USING (true);

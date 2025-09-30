-- Create table to control student submission window
CREATE TABLE IF NOT EXISTS public.submission_window (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  is_open BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Ensure audit fields are updated on every change
CREATE OR REPLACE FUNCTION public.set_submission_window_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS submission_window_audit ON public.submission_window;
CREATE TRIGGER submission_window_audit
BEFORE INSERT OR UPDATE ON public.submission_window
FOR EACH ROW
EXECUTE FUNCTION public.set_submission_window_audit();

-- Seed default row (closed by default)
INSERT INTO public.submission_window (id, is_open)
VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS and add role-based access policies
ALTER TABLE public.submission_window ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read submission window" ON public.submission_window;
CREATE POLICY "Authenticated can read submission window"
ON public.submission_window
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS "Admins can seed submission window" ON public.submission_window;
CREATE POLICY "Admins can seed submission window"
ON public.submission_window
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins manage submission window" ON public.submission_window;
CREATE POLICY "Admins manage submission window"
ON public.submission_window
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_profiles up
    JOIN public.role r ON up.roleid = r.roleid
    WHERE up.userid = auth.uid() AND r.rolename = 'admin'
  )
);

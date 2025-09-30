-- Align submitted_date with Asia/Jakarta timezone for daily submission guard
DROP INDEX IF EXISTS aktivitas_unique_daily_submission;

ALTER TABLE public.aktivitas
  DROP COLUMN IF EXISTS submitted_date;

ALTER TABLE public.aktivitas
  ADD COLUMN submitted_date date GENERATED ALWAYS AS (((created_at AT TIME ZONE 'Asia/Jakarta')::date)) STORED;

CREATE UNIQUE INDEX aktivitas_unique_daily_submission
  ON public.aktivitas (kegiatanid, userid, submitted_date);

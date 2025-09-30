-- Ensure students can only submit one aktivitas per kegiatan per day
ALTER TABLE public.aktivitas
  ADD COLUMN IF NOT EXISTS submitted_date date GENERATED ALWAYS AS (((created_at AT TIME ZONE 'UTC')::date)) STORED;

-- Create unique index to enforce one submission per day per kegiatan per user
CREATE UNIQUE INDEX IF NOT EXISTS aktivitas_unique_daily_submission
  ON public.aktivitas (kegiatanid, userid, submitted_date);

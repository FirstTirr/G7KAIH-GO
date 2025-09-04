-- Script untuk menambahkan relasi orang tua dengan siswa
-- Jalankan script ini di Supabase SQL Editor atau database PostgreSQL

-- 1. Tambahkan kolom parent_of_userid ke table user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN parent_of_userid uuid;

-- 2. Tambahkan foreign key constraint untuk parent_of_userid
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_parent_of_userid_fkey 
FOREIGN KEY (parent_of_userid) REFERENCES auth.users(id);

-- 3. Tambahkan index untuk performa query
CREATE INDEX idx_user_profiles_parent_of_userid 
ON public.user_profiles(parent_of_userid);

-- 4. Tambahkan comment untuk dokumentasi
COMMENT ON COLUMN public.user_profiles.parent_of_userid 
IS 'ID siswa yang menjadi anak dari orang tua ini (hanya untuk role orang tua)';

-- 5. Contoh data untuk testing (opsional)
-- Uncomment baris di bawah jika ingin menambahkan data test
/*
-- Update orang tua untuk menghubungkan dengan siswa tertentu
-- Ganti dengan UUID yang sesuai dari data Anda
UPDATE public.user_profiles 
SET parent_of_userid = '05c3061e-e24c-4918-ae00-5fabfa8a2552' 
WHERE roleid = 3 AND username LIKE '%orang%tua%' 
LIMIT 1;
*/

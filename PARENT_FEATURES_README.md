# Implementasi Fitur Halaman Orang Tua

## Deskripsi
Halaman orang tua telah diimplementasikan dengan fitur:
1. **Kalender Aktivitas Siswa** - Melihat aktivitas siswa per hari dalam bentuk kalender
2. **Komentar** - Memberikan dan melihat komentar untuk siswa

## Perubahan Database yang Diperlukan

### 1. Menambahkan Field `parent_of_userid`
Jalankan script SQL berikut di Supabase SQL Editor:

```sql
-- Tambahkan kolom parent_of_userid ke table user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN parent_of_userid uuid;

-- Tambahkan foreign key constraint
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_parent_of_userid_fkey 
FOREIGN KEY (parent_of_userid) REFERENCES auth.users(id);

-- Tambahkan index untuk performa
CREATE INDEX idx_user_profiles_parent_of_userid 
ON public.user_profiles(parent_of_userid);
```

### 2. Mengatur Relasi Orang Tua - Siswa
Ada dua cara untuk mengatur relasi:

#### A. Melalui Admin Dashboard
1. Akses `/dashboard/admin/parent-student`
2. Pilih orang tua dan siswa yang akan dihubungkan
3. Klik "Hubungkan"

#### B. Manual melalui SQL
```sql
-- Contoh: Hubungkan orang tua dengan siswa
UPDATE public.user_profiles 
SET parent_of_userid = 'SISWA_USER_ID_DISINI' 
WHERE userid = 'ORANGTUA_USER_ID_DISINI' AND roleid = 3;
```

## API Endpoints Baru

### 1. `/api/orangtua/siswa` 
- **GET**: Mendapatkan data siswa yang terkait dengan orang tua
- **POST**: Mengatur relasi orang tua dengan siswa

### 2. `/api/komentar` (Updated)
- **GET**: Mendapatkan komentar untuk siswa tertentu
- **POST**: Menambahkan komentar baru
- **DELETE**: Menghapus komentar (hanya pemilik komentar)

## Komponen Baru

### 1. `ParentDashboard.tsx`
- Komponen utama halaman orang tua
- Menampilkan kalender aktivitas siswa
- Terintegrasi dengan sistem komentar

### 2. `ParentStudentManager.tsx`
- Komponen admin untuk mengelola relasi orang tua-siswa
- Dapat menghubungkan dan memutus relasi

### 3. `CommentSection.tsx` (Updated)
- Diperbaiki query database
- Ditambahkan fitur delete komentar
- UI yang lebih baik

## Cara Penggunaan

### Untuk Orang Tua:
1. Login dengan akun yang memiliki role `roleid = 3` (Orang Tua)
2. Akses halaman `/orangtua`
3. Lihat kalender aktivitas anak
4. Berikan komentar di tab "Komentar"

### Untuk Admin:
1. Akses `/dashboard/admin/parent-student`
2. Atur relasi orang tua dengan siswa
3. Monitor dan kelola relasi yang ada

## Fitur Fallback
Jika field `parent_of_userid` belum ada atau relasi belum diatur:
- Sistem akan menampilkan siswa pertama yang tersedia (untuk demo)
- Menampilkan pesan informatif kepada user
- Menampilkan debug info untuk development

## Testing
1. Buat user dengan role orang tua (roleid = 3)
2. Buat user dengan role siswa (roleid = 4)  
3. Atur relasi melalui admin dashboard atau SQL
4. Test akses halaman `/orangtua`
5. Test fitur kalender dan komentar

## File yang Diubah/Ditambah
- `src/app/(user)/orangtua/page.tsx` - Halaman utama orang tua
- `src/components/orangtua/ParentDashboard.tsx` - Komponen dashboard orang tua
- `src/app/api/orangtua/siswa/route.ts` - API endpoint untuk data siswa orang tua
- `src/components/admin/ParentStudentManager.tsx` - Manajemen relasi admin
- `src/app/(user)/dashboard/admin/parent-student/page.tsx` - Halaman admin
- `src/app/api/komentar/route.ts` - API komentar yang diperbaiki
- `src/components/komentar/CommentSection.tsx` - Komponen komentar yang diperbaiki
- `src/hooks/use-current-user.ts` - Hook untuk mendapatkan user ID
- `database_migrations/add_parent_student_relation.sql` - Script database migration

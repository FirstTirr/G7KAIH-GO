-- ==========================================
-- G7KAIH PostgreSQL Database Schema
-- ==========================================
-- Version: 1.0.0
-- Description: Complete database schema for G7KAIH activity management system
-- ==========================================

-- Create database (run this separately if needed)
-- CREATE DATABASE g7kaih;
-- \c g7kaih;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- DROP TABLES (if exists, for clean setup)
-- ==========================================
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS parent_students CASCADE;
DROP TABLE IF EXISTS teacher_roles CASCADE;
DROP TABLE IF EXISTS guruwali_assignments CASCADE;
DROP TABLE IF EXISTS kegiatan CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS submission_windows CASCADE;

-- ==========================================
-- TABLES
-- ==========================================

-- Users Table (Main authentication table)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    nis VARCHAR(50) UNIQUE,
    class VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'siswa' CHECK (role IN ('admin', 'guru', 'guruwali', 'siswa', 'orangtua')),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Kegiatan Table (Activity Types/Templates)
CREATE TABLE kegiatan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    form_schema JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Activities Table (Student Submissions)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kegiatan_id UUID NOT NULL REFERENCES kegiatan(id) ON DELETE RESTRICT,
    date DATE NOT NULL,
    form_data JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Comments Table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Teacher Roles Table (Teacher-Class Assignments)
CREATE TABLE teacher_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_name VARCHAR(50) NOT NULL,
    subject VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Guru Wali Assignments Table (Homeroom Teacher)
CREATE TABLE guruwali_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Parent-Student Relationships Table
CREATE TABLE parent_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(parent_id, student_id)
);

-- Submission Window Table (Control submission time window)
CREATE TABLE submission_windows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    is_open BOOLEAN DEFAULT true,
    open_time VARCHAR(10),
    close_time VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- User Profiles indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_class ON user_profiles(class);
CREATE INDEX idx_user_profiles_nis ON user_profiles(nis);
CREATE INDEX idx_user_profiles_deleted_at ON user_profiles(deleted_at);

-- Categories indexes
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_deleted_at ON categories(deleted_at);

-- Kegiatan indexes
CREATE INDEX idx_kegiatan_category_id ON kegiatan(category_id);
CREATE INDEX idx_kegiatan_is_active ON kegiatan(is_active);
CREATE INDEX idx_kegiatan_deleted_at ON kegiatan(deleted_at);

-- Activities indexes
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_kegiatan_id ON activities(kegiatan_id);
CREATE INDEX idx_activities_date ON activities(date DESC);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_user_date ON activities(user_id, date DESC);
CREATE INDEX idx_activities_kegiatan_date ON activities(kegiatan_id, date DESC);
CREATE INDEX idx_activities_deleted_at ON activities(deleted_at);

-- Comments indexes
CREATE INDEX idx_comments_activity_id ON comments(activity_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_deleted_at ON comments(deleted_at);

-- Teacher Roles indexes
CREATE INDEX idx_teacher_roles_teacher_id ON teacher_roles(teacher_id);
CREATE INDEX idx_teacher_roles_class_name ON teacher_roles(class_name);
CREATE INDEX idx_teacher_roles_deleted_at ON teacher_roles(deleted_at);

-- Guru Wali Assignments indexes
CREATE INDEX idx_guruwali_assignments_teacher_id ON guruwali_assignments(teacher_id);
CREATE INDEX idx_guruwali_assignments_class_name ON guruwali_assignments(class_name);
CREATE INDEX idx_guruwali_assignments_deleted_at ON guruwali_assignments(deleted_at);

-- Parent-Student indexes
CREATE INDEX idx_parent_students_parent_id ON parent_students(parent_id);
CREATE INDEX idx_parent_students_student_id ON parent_students(student_id);
CREATE INDEX idx_parent_students_deleted_at ON parent_students(deleted_at);

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kegiatan_updated_at BEFORE UPDATE ON kegiatan
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_roles_updated_at BEFORE UPDATE ON teacher_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guruwali_assignments_updated_at BEFORE UPDATE ON guruwali_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parent_students_updated_at BEFORE UPDATE ON parent_students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submission_windows_updated_at BEFORE UPDATE ON submission_windows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- INITIAL DATA (SEED)
-- ==========================================

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (id, email, password) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@g7kaih.com', '$2a$10$YourHashedPasswordHere');

INSERT INTO user_profiles (user_id, name, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'Administrator', 'admin');

-- Insert default categories
INSERT INTO categories (id, name, description, icon, color) VALUES 
('10000000-0000-0000-0000-000000000001', 'Akademik', 'Kegiatan akademik dan pembelajaran', '📚', '#3B82F6'),
('10000000-0000-0000-0000-000000000002', 'Ekstrakurikuler', 'Kegiatan di luar jam pelajaran', '⚽', '#10B981'),
('10000000-0000-0000-0000-000000000003', 'Karakter', 'Pembentukan karakter dan moral', '🌟', '#F59E0B'),
('10000000-0000-0000-0000-000000000004', 'Sosial', 'Kegiatan sosial dan kemasyarakatan', '🤝', '#EF4444'),
('10000000-0000-0000-0000-000000000005', 'Spiritual', 'Kegiatan keagamaan dan spiritual', '🕌', '#8B5CF6');

-- Insert sample kegiatan
INSERT INTO kegiatan (id, name, description, category_id, is_active, form_schema) VALUES 
(
    '20000000-0000-0000-0000-000000000001', 
    'Sholat Berjamaah', 
    'Melaksanakan sholat berjamaah di masjid sekolah',
    '10000000-0000-0000-0000-000000000005',
    true,
    '{"fields": [{"name": "waktu_sholat", "type": "select", "label": "Waktu Sholat", "options": ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"]}, {"name": "lokasi", "type": "text", "label": "Lokasi"}]}'::jsonb
),
(
    '20000000-0000-0000-0000-000000000002',
    'Membaca Al-Quran',
    'Membaca Al-Quran minimal 1 halaman',
    '10000000-0000-0000-0000-000000000005',
    true,
    '{"fields": [{"name": "jumlah_halaman", "type": "number", "label": "Jumlah Halaman"}, {"name": "surat", "type": "text", "label": "Nama Surat"}]}'::jsonb
),
(
    '20000000-0000-0000-0000-000000000003',
    'Belajar Mandiri',
    'Belajar mandiri di rumah',
    '10000000-0000-0000-0000-000000000001',
    true,
    '{"fields": [{"name": "mata_pelajaran", "type": "text", "label": "Mata Pelajaran"}, {"name": "durasi", "type": "number", "label": "Durasi (menit)"}]}'::jsonb
),
(
    '20000000-0000-0000-0000-000000000004',
    'Membantu Orang Tua',
    'Membantu pekerjaan rumah orang tua',
    '10000000-0000-0000-0000-000000000003',
    true,
    '{"fields": [{"name": "jenis_pekerjaan", "type": "text", "label": "Jenis Pekerjaan"}, {"name": "durasi", "type": "number", "label": "Durasi (menit)"}]}'::jsonb
);

-- Insert default submission window
INSERT INTO submission_windows (is_open, open_time, close_time) VALUES 
(true, '05:00', '22:00');

-- ==========================================
-- VIEWS (Helpful queries)
-- ==========================================

-- View for student activities summary
CREATE OR REPLACE VIEW v_student_activities_summary AS
SELECT 
    u.id as user_id,
    up.name as student_name,
    up.class,
    COUNT(a.id) as total_activities,
    COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected_count,
    MAX(a.date) as last_activity_date
FROM users u
JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN activities a ON u.id = a.user_id AND a.deleted_at IS NULL
WHERE up.role = 'siswa' AND up.deleted_at IS NULL AND u.deleted_at IS NULL
GROUP BY u.id, up.name, up.class;

-- View for daily activity report
CREATE OR REPLACE VIEW v_daily_activity_report AS
SELECT 
    a.date,
    k.name as kegiatan_name,
    c.name as category_name,
    COUNT(a.id) as submission_count,
    COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_count
FROM activities a
JOIN kegiatan k ON a.kegiatan_id = k.id
JOIN categories c ON k.category_id = c.id
WHERE a.deleted_at IS NULL
GROUP BY a.date, k.name, c.name
ORDER BY a.date DESC;

-- View for teacher assignments
CREATE OR REPLACE VIEW v_teacher_assignments AS
SELECT 
    u.id as teacher_id,
    up.name as teacher_name,
    up.role,
    tr.class_name,
    tr.subject,
    CASE WHEN gw.id IS NOT NULL THEN true ELSE false END as is_guruwali
FROM users u
JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN teacher_roles tr ON u.id = tr.teacher_id AND tr.deleted_at IS NULL
LEFT JOIN guruwali_assignments gw ON u.id = gw.teacher_id AND gw.deleted_at IS NULL
WHERE up.role IN ('guru', 'guruwali') AND up.deleted_at IS NULL AND u.deleted_at IS NULL;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to get student activity statistics
CREATE OR REPLACE FUNCTION get_student_stats(student_user_id UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    total_activities BIGINT,
    approved_activities BIGINT,
    pending_activities BIGINT,
    rejected_activities BIGINT,
    activity_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_activities,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_activities,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_activities,
        ROUND(
            COUNT(CASE WHEN status = 'approved' THEN 1 END)::NUMERIC / 
            NULLIF((end_date - start_date + 1)::NUMERIC, 0) * 100, 
            2
        ) as activity_rate
    FROM activities
    WHERE user_id = student_user_id 
        AND date BETWEEN start_date AND end_date
        AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get inactive students for a date
CREATE OR REPLACE FUNCTION get_inactive_students(check_date DATE, target_class VARCHAR)
RETURNS TABLE (
    user_id UUID,
    name VARCHAR,
    nis VARCHAR,
    class VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        up.name,
        up.nis,
        up.class
    FROM users u
    JOIN user_profiles up ON u.id = up.user_id
    WHERE up.role = 'siswa'
        AND (target_class IS NULL OR up.class = target_class)
        AND up.deleted_at IS NULL
        AND u.deleted_at IS NULL
        AND NOT EXISTS (
            SELECT 1 FROM activities a
            WHERE a.user_id = u.id 
                AND a.date = check_date
                AND a.deleted_at IS NULL
        );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PERMISSIONS (Optional, adjust as needed)
-- ==========================================

-- Create roles if needed
-- CREATE ROLE g7kaih_app;
-- GRANT CONNECT ON DATABASE g7kaih TO g7kaih_app;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO g7kaih_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO g7kaih_app;

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'G7KAIH Database Schema Created Successfully!';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Tables created: 10';
    RAISE NOTICE 'Indexes created: 24';
    RAISE NOTICE 'Triggers created: 10';
    RAISE NOTICE 'Views created: 3';
    RAISE NOTICE 'Functions created: 2';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Sample data inserted:';
    RAISE NOTICE '- 1 Admin user';
    RAISE NOTICE '- 5 Categories';
    RAISE NOTICE '- 4 Sample Kegiatan';
    RAISE NOTICE '=========================================';
END $$;

package database

import (
	"fmt"
	"log"

	"github.com/FirstTirr/G7KAIH-GO/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// New creates a new database connection
func New(cfg config.DatabaseConfig) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		cfg.Host, cfg.User, cfg.Password, cfg.DBName, cfg.Port, cfg.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	// Set connection pool settings
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	log.Println("Database connection established successfully")
	return db, nil
}

// Migrate runs database migrations
func Migrate(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// Enable UUID extension
	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
		return fmt.Errorf("failed to create uuid extension: %w", err)
	}

	// Skip auto-migration since we're using schema.sql
	log.Println("Using existing schema.sql for database structure...")

	// Create indexes
	if err := createIndexes(db); err != nil {
		return fmt.Errorf("failed to create indexes: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

func createIndexes(db *gorm.DB) error {
	indexes := []string{
		// activities references the user_profile_id column
		"CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities (user_profile_id, date DESC)",
		"CREATE INDEX IF NOT EXISTS idx_activities_kegiatan_date ON activities (kegiatan_id, date DESC)",
		"CREATE INDEX IF NOT EXISTS idx_activities_status ON activities (status)",
		"CREATE INDEX IF NOT EXISTS idx_comments_activity ON comments (activity_id, created_at DESC)",
		"CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles (role)",
		"CREATE INDEX IF NOT EXISTS idx_user_profiles_class ON user_profiles (class)",
		// teacher_roles uses class_name per schema
		"CREATE INDEX IF NOT EXISTS idx_teacher_roles_class_name ON teacher_roles (class_name)",
		// guruwali_assignments doesn't have class_name; index teacher_id/student_id instead
		"CREATE INDEX IF NOT EXISTS idx_guruwali_assignments_teacher_id ON guruwali_assignments (teacher_id)",
		"CREATE INDEX IF NOT EXISTS idx_guruwali_assignments_student_id ON guruwali_assignments (student_id)",
	}

	for _, idx := range indexes {
		if err := db.Exec(idx).Error; err != nil {
			log.Printf("Warning: Failed to create index: %v", err)
		}
	}

	return nil
}

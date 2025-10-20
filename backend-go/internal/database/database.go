package database

import (
	"fmt"
	"log"

	"github.com/DityaPerdana/G7KAIH/backend/internal/config"
	"github.com/DityaPerdana/G7KAIH/backend/internal/models"
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

	// Auto migrate all models
	if err := db.AutoMigrate(
		&models.User{},
		&models.UserProfile{},
		&models.Category{},
		&models.Kegiatan{},
		&models.Activity{},
		&models.Comment{},
		&models.TeacherRole{},
		&models.GuruWaliAssignment{},
		&models.ParentStudent{},
		&models.SubmissionWindow{},
	); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	// Create indexes
	if err := createIndexes(db); err != nil {
		return fmt.Errorf("failed to create indexes: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

func createIndexes(db *gorm.DB) error {
	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities (user_id, date DESC)",
		"CREATE INDEX IF NOT EXISTS idx_activities_kegiatan_date ON activities (kegiatan_id, date DESC)",
		"CREATE INDEX IF NOT EXISTS idx_activities_status ON activities (status)",
		"CREATE INDEX IF NOT EXISTS idx_comments_activity ON comments (activity_id, created_at DESC)",
		"CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles (role)",
		"CREATE INDEX IF NOT EXISTS idx_user_profiles_class ON user_profiles (class)",
		"CREATE INDEX IF NOT EXISTS idx_teacher_roles_class ON teacher_roles (class_name)",
		"CREATE INDEX IF NOT EXISTS idx_guruwali_class ON guruwali_assignments (class_name)",
	}

	for _, idx := range indexes {
		if err := db.Exec(idx).Error; err != nil {
			log.Printf("Warning: Failed to create index: %v", err)
		}
	}

	return nil
}

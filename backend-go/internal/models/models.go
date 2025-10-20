package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserProfile represents a user in the system
type UserProfile struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Class     string         `json:"class"`
	Role      string         `gorm:"not null;default:'siswa'" json:"role"` // admin, guru, guruwali, siswa, orangtua
	TokenHash string         `gorm:"not null;uniqueIndex" json:"-"`
	AvatarURL *string        `json:"avatar_url,omitempty"`
	Bio       *string        `json:"bio,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Activities          []Activity           `gorm:"foreignKey:UserProfileID" json:"activities,omitempty"`
	Comments            []Comment            `gorm:"foreignKey:UserProfileID" json:"comments,omitempty"`
	TeacherRoles        []TeacherRole        `gorm:"foreignKey:TeacherID" json:"teacher_roles,omitempty"`
	GuruWaliAssignments []GuruWaliAssignment `gorm:"foreignKey:TeacherID" json:"guruwali_assignments,omitempty"`
	ParentRelations     []ParentStudent      `gorm:"foreignKey:ParentID" json:"parent_relations,omitempty"`
	StudentRelations    []ParentStudent      `gorm:"foreignKey:StudentID" json:"student_relations,omitempty"`
}

// Category represents activity categories
type Category struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"uniqueIndex;not null" json:"name"`
	Description *string        `json:"description,omitempty"`
	Icon        *string        `json:"icon,omitempty"`
	Color       *string        `json:"color,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Kegiatan []Kegiatan `gorm:"foreignKey:CategoryID" json:"kegiatan,omitempty"`
}

// Kegiatan represents activity templates/types
type Kegiatan struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	Description *string        `gorm:"type:text" json:"description,omitempty"`
	CategoryID  uuid.UUID      `gorm:"type:uuid;not null" json:"category_id"`
	FormSchema  *string        `gorm:"type:jsonb" json:"form_schema,omitempty"` // JSON schema for dynamic forms
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Category   *Category  `gorm:"foreignKey:CategoryID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"category,omitempty"`
	Activities []Activity `gorm:"foreignKey:KegiatanID" json:"activities,omitempty"`
}

// Activity represents user activities
type Activity struct {
	ID            uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserProfileID uuid.UUID      `gorm:"type:uuid;not null" json:"user_profile_id"`
	KegiatanID    uuid.UUID      `gorm:"type:uuid;not null" json:"kegiatan_id"`
	Date          time.Time      `gorm:"not null;index:idx_user_date" json:"date"`
	FormData      *string        `gorm:"type:jsonb" json:"form_data,omitempty"` // JSON data from dynamic forms
	Status        string         `gorm:"default:'pending'" json:"status"`        // pending, approved, rejected
	Notes         *string        `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	UserProfile *UserProfile `gorm:"foreignKey:UserProfileID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user_profile,omitempty"`
	Kegiatan    *Kegiatan    `gorm:"foreignKey:KegiatanID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"kegiatan,omitempty"`
	Comments    []Comment    `gorm:"foreignKey:ActivityID" json:"comments,omitempty"`
}

// Comment represents comments on activities
type Comment struct {
	ID            uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ActivityID    uuid.UUID      `gorm:"type:uuid;not null" json:"activity_id"`
	UserProfileID uuid.UUID      `gorm:"type:uuid;not null" json:"user_profile_id"`
	Content       string         `gorm:"type:text;not null" json:"content"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Activity    *Activity    `gorm:"foreignKey:ActivityID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"activity,omitempty"`
	UserProfile *UserProfile `gorm:"foreignKey:UserProfileID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user_profile,omitempty"`
}

// TeacherRole represents teacher assignments to classes
type TeacherRole struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	TeacherID uuid.UUID      `gorm:"type:uuid;not null" json:"teacher_id"`
	ClassName string         `gorm:"not null" json:"class_name"`
	Subject   *string        `json:"subject,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Teacher *UserProfile `gorm:"foreignKey:TeacherID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"teacher,omitempty"`
}

// GuruWaliAssignment represents wali class assignments
type GuruWaliAssignment struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	TeacherID uuid.UUID      `gorm:"type:uuid;not null" json:"teacher_id"`
	StudentID uuid.UUID      `gorm:"type:uuid;not null" json:"student_id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Teacher *UserProfile `gorm:"foreignKey:TeacherID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"teacher,omitempty"`
	Student *UserProfile `gorm:"foreignKey:StudentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"student,omitempty"`
}

// ParentStudent represents parent-student relationships
type ParentStudent struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ParentID  uuid.UUID      `gorm:"type:uuid;not null" json:"parent_id"`
	StudentID uuid.UUID      `gorm:"type:uuid;not null" json:"student_id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Parent  *UserProfile `gorm:"foreignKey:ParentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"parent,omitempty"`
	Student *UserProfile `gorm:"foreignKey:StudentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"student,omitempty"`
}

// SubmissionWindow represents the time window for activity submissions
type SubmissionWindow struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	IsOpen    bool      `gorm:"default:true" json:"is_open"`
	OpenTime  *string   `json:"open_time,omitempty"`  // Format: "HH:MM"
	CloseTime *string   `json:"close_time,omitempty"` // Format: "HH:MM"
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName overrides
func (UserProfile) TableName() string {
	return "user_profiles"
}

func (Category) TableName() string {
	return "categories"
}

func (Kegiatan) TableName() string {
	return "kegiatan"
}

func (Activity) TableName() string {
	return "activities"
}

func (Comment) TableName() string {
	return "comments"
}

func (TeacherRole) TableName() string {
	return "teacher_roles"
}

func (GuruWaliAssignment) TableName() string {
	return "guruwali_assignments"
}

func (ParentStudent) TableName() string {
	return "parent_students"
}

func (SubmissionWindow) TableName() string {
	return "submission_windows"
}
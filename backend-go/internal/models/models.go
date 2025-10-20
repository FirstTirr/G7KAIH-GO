package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents the main user table (dari auth.users Supabase)
type User struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Phone     *string        `gorm:"unique" json:"phone,omitempty"`
	Password  string         `gorm:"not null" json:"-"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Profile      *UserProfile       `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"profile,omitempty"`
	Activities   []Activity         `gorm:"foreignKey:UserID" json:"activities,omitempty"`
	Comments     []Comment          `gorm:"foreignKey:UserID" json:"comments,omitempty"`
	TeacherRoles []TeacherRole      `gorm:"foreignKey:TeacherID" json:"teacher_roles,omitempty"`
	GuruWaliAssignments []GuruWaliAssignment `gorm:"foreignKey:TeacherID" json:"guruwali_assignments,omitempty"`
	ParentRelations []ParentStudent `gorm:"foreignKey:ParentID" json:"parent_relations,omitempty"`
	StudentRelations []ParentStudent `gorm:"foreignKey:StudentID" json:"student_relations,omitempty"`
}

// UserProfile represents user profile information
type UserProfile struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID      `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	Name        string         `gorm:"not null" json:"name"`
	NIS         *string        `gorm:"unique" json:"nis,omitempty"`
	Class       *string        `json:"class,omitempty"`
	Role        string         `gorm:"not null;default:'siswa'" json:"role"` // admin, guru, guruwali, siswa, orangtua
	AvatarURL   *string        `json:"avatar_url,omitempty"`
	Bio         *string        `json:"bio,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	User User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
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
	Activities []Kegiatan `gorm:"foreignKey:CategoryID" json:"activities,omitempty"`
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
	Category   Category   `gorm:"foreignKey:CategoryID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"category,omitempty"`
	Activities []Activity `gorm:"foreignKey:KegiatanID" json:"activities,omitempty"`
}

// Activity represents student activity submissions
type Activity struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID      `gorm:"type:uuid;not null;index:idx_user_date" json:"user_id"`
	KegiatanID  uuid.UUID      `gorm:"type:uuid;not null" json:"kegiatan_id"`
	Date        time.Time      `gorm:"not null;index:idx_user_date" json:"date"`
	FormData    *string        `gorm:"type:jsonb" json:"form_data,omitempty"` // JSON data from dynamic forms
	Status      string         `gorm:"default:'pending'" json:"status"` // pending, approved, rejected
	Notes       *string        `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	User     User       `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
	Kegiatan Kegiatan   `gorm:"foreignKey:KegiatanID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"kegiatan,omitempty"`
	Comments []Comment  `gorm:"foreignKey:ActivityID" json:"comments,omitempty"`
}

// Comment represents comments on activities
type Comment struct {
	ID         uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ActivityID uuid.UUID      `gorm:"type:uuid;not null;index" json:"activity_id"`
	UserID     uuid.UUID      `gorm:"type:uuid;not null" json:"user_id"`
	Content    string         `gorm:"type:text;not null" json:"content"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Activity Activity `gorm:"foreignKey:ActivityID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"activity,omitempty"`
	User     User     `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
}

// TeacherRole represents teacher assignments to classes
type TeacherRole struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	TeacherID uuid.UUID      `gorm:"type:uuid;not null;index" json:"teacher_id"`
	ClassName string         `gorm:"not null" json:"class_name"`
	Subject   *string        `json:"subject,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Teacher User `gorm:"foreignKey:TeacherID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"teacher,omitempty"`
}

// GuruWaliAssignment represents homeroom teacher assignments
type GuruWaliAssignment struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	TeacherID uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"teacher_id"`
	ClassName string         `gorm:"not null" json:"class_name"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Teacher User `gorm:"foreignKey:TeacherID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"teacher,omitempty"`
}

// ParentStudent represents parent-student relationships
type ParentStudent struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ParentID  uuid.UUID      `gorm:"type:uuid;not null;index" json:"parent_id"`
	StudentID uuid.UUID      `gorm:"type:uuid;not null;index" json:"student_id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Parent  User `gorm:"foreignKey:ParentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"parent,omitempty"`
	Student User `gorm:"foreignKey:StudentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"student,omitempty"`
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
func (User) TableName() string {
	return "users"
}

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

package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/FirstTirr/G7KAIH-GO/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdminHandler struct {
	db *gorm.DB
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

type CreateUserRequest struct {
	Name  string `json:"name" binding:"required"`
	Class string `json:"class" binding:"required"`
	Role  string `json:"role" binding:"required,oneof=siswa orangtua guru guruwali admin"`
}

type CreateUserResponse struct {
	UserID string `json:"user_id"`
	Token  string `json:"token"` // 4-digit token
}

type LinkParentStudentRequest struct {
	ParentID  uuid.UUID `json:"parent_id" binding:"required"`
	StudentID uuid.UUID `json:"student_id" binding:"required"`
}

type AssignGuruWaliRequest struct {
	TeacherID uuid.UUID `json:"teacher_id" binding:"required"`
	StudentID uuid.UUID `json:"student_id" binding:"required"`
}

type AssignTeacherRoleRequest struct {
	TeacherID uuid.UUID `json:"teacher_id" binding:"required"`
	ClassName string    `json:"class_name" binding:"required"`
	Subject   *string   `json:"subject"`
}

type UpdateSubmissionWindowRequest struct {
	IsOpen    *bool   `json:"is_open"`
	OpenTime  *string `json:"open_time"`
	CloseTime *string `json:"close_time"`
}



// GetUsers godoc
// @Summary Get all users
// @Description Get list of all users with optional filters
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Param role query string false "Filter by role"
// @Param class query string false "Filter by class"
// @Success 200 {array} models.UserProfile
// @Router /admin/users [get]
func (h *AdminHandler) GetUsers(c *gin.Context) {
	query := h.db.Model(&models.UserProfile{})

	if role := c.Query("role"); role != "" {
		query = query.Where("role = ?", role)
	}

	if class := c.Query("class"); class != "" {
		query = query.Where("class = ?", class)
	}

	var profiles []models.UserProfile
	if err := query.Find(&profiles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, profiles)
}

// CreateUser godoc
// @Summary Create new user
// @Description Create a new user (Admin only)
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param user body CreateUserRequest true "User data"
// @Success 201 {object} CreateUserResponse
// @Router /admin/users [post]
func (h *AdminHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, err := random4Digits()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}
	hash := hashToken(token)

	profile := &models.UserProfile{
		ID:        uuid.New(),
		Name:      req.Name,
		Class:     req.Class,
		Role:      req.Role,
		TokenHash: hash,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.db.Create(profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, CreateUserResponse{
		UserID: profile.ID.String(),
		Token:  token,
	})
}

// UpdateUser godoc
// @Summary Update user
// @Description Update user information (Admin only)
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "User ID"
// @Param user body CreateUserRequest true "User data"
// @Success 200 {object} models.UserProfile
// @Router /admin/users/{id} [put]
func (h *AdminHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")

	var profile models.UserProfile
	if err := h.db.Where("id = ?", id).First(&profile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile.Name = req.Name
	profile.Role = req.Role
	profile.Class = req.Class

	if err := h.db.Save(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// DeleteUser godoc
// @Summary Delete user
// @Description Delete a user (Admin only)
// @Tags admin
// @Security BearerAuth
// @Param id path string true "User ID"
// @Success 204
// @Router /admin/users/{id} [delete]
func (h *AdminHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.Where("id = ?", id).Delete(&models.UserProfile{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.Status(http.StatusNoContent)
}

// BulkImportUsers godoc
// @Summary Bulk import users from CSV
// @Description Import multiple users from CSV file (format: name,class,role)
// @Tags admin
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "CSV file"
// @Success 200 {object} map[string]interface{}
// @Router /admin/users/bulk-import [post]
func (h *AdminHandler) BulkImportUsers(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}

	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer f.Close()

	reader := csv.NewReader(f)
	records, err := reader.ReadAll()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid CSV format"})
		return
	}

	if len(records) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CSV file is empty"})
		return
	}

	// Skip header row
	successCount := 0
	errorCount := 0
	errors := []string{}
	tokens := []map[string]string{}

	for i, record := range records[1:] {
		if len(record) < 3 {
			errors = append(errors, fmt.Sprintf("Row %d: Invalid format (expected: name,class,role)", i+2))
			errorCount++
			continue
		}

		name := strings.TrimSpace(record[0])
		class := strings.TrimSpace(record[1])
		role := strings.TrimSpace(record[2])

		// Generate token
		token, err := random4Digits()
		if err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: Failed to generate token", i+2))
			errorCount++
			continue
		}
		hash := hashToken(token)

		profile := models.UserProfile{
			ID:        uuid.New(),
			Name:      name,
			Class:     class,
			Role:      role,
			TokenHash: hash,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := h.db.Create(&profile).Error; err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: Failed to create user - %s", i+2, err.Error()))
			errorCount++
			continue
		}

		tokens = append(tokens, map[string]string{
			"name":  name,
			"token": token,
			"id":    profile.ID.String(),
		})
		successCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"success_count": successCount,
		"error_count":   errorCount,
		"errors":        errors,
		"tokens":        tokens, // Return tokens for users to save
	})
}

// LinkParentStudent godoc
// @Summary Link parent to student
// @Description Create parent-student relationship
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param link body LinkParentStudentRequest true "Link data"
// @Success 201 {object} models.ParentStudent
// @Router /admin/link-parent-student [post]
func (h *AdminHandler) LinkParentStudent(c *gin.Context) {
	var req LinkParentStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	link := models.ParentStudent{
		ParentID:  req.ParentID,
		StudentID: req.StudentID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.db.Create(&link).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create link"})
		return
	}

	c.JSON(http.StatusCreated, link)
}

// UnlinkParentStudent godoc
// @Summary Unlink parent from student
// @Description Remove parent-student relationship
// @Tags admin
// @Security BearerAuth
// @Param id path string true "Link ID"
// @Success 204
// @Router /admin/link-parent-student/{id} [delete]
func (h *AdminHandler) UnlinkParentStudent(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.Where("id = ?", id).Delete(&models.ParentStudent{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete link"})
		return
	}

	c.Status(http.StatusNoContent)
}

// AssignGuruWali godoc
// @Summary Assign guruwali to student
// @Description Assign a teacher as guruwali (homeroom teacher) for a student
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param assignment body AssignGuruWaliRequest true "Assignment data"
// @Success 201 {object} models.GuruWaliAssignment
// @Router /admin/assign-guruwali [post]
func (h *AdminHandler) AssignGuruWali(c *gin.Context) {
	var req AssignGuruWaliRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignment := models.GuruWaliAssignment{
		TeacherID: req.TeacherID,
		StudentID: req.StudentID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.db.Create(&assignment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create assignment"})
		return
	}

	h.db.Preload("Teacher").Preload("Student").First(&assignment, assignment.ID)

	c.JSON(http.StatusCreated, assignment)
}

// UnassignGuruWali godoc
// @Summary Unassign guruwali from student
// @Description Remove guruwali assignment
// @Tags admin
// @Security BearerAuth
// @Param id path string true "Assignment ID"
// @Success 204
// @Router /admin/assign-guruwali/{id} [delete]
func (h *AdminHandler) UnassignGuruWali(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.Where("id = ?", id).Delete(&models.GuruWaliAssignment{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete assignment"})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetGuruWaliAssignments godoc
// @Summary Get all guruwali assignments
// @Description Get list of all guruwali assignments
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.GuruWaliAssignment
// @Router /admin/guruwali-assignments [get]
func (h *AdminHandler) GetGuruWaliAssignments(c *gin.Context) {
	var assignments []models.GuruWaliAssignment
	if err := h.db.Preload("Teacher").Preload("Student").Find(&assignments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assignments"})
		return
	}

	c.JSON(http.StatusOK, assignments)
}

// AssignTeacherRole godoc
// @Summary Assign teacher role
// @Description Assign a teacher to a class
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param role body AssignTeacherRoleRequest true "Role data"
// @Success 201 {object} models.TeacherRole
// @Router /admin/teacher-roles [post]
func (h *AdminHandler) AssignTeacherRole(c *gin.Context) {
	var req AssignTeacherRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := models.TeacherRole{
		TeacherID: req.TeacherID,
		ClassName: req.ClassName,
		Subject:   req.Subject,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.db.Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create role"})
		return
	}

	h.db.Preload("Teacher").First(&role, role.ID)

	c.JSON(http.StatusCreated, role)
}

// UnassignTeacherRole godoc
// @Summary Unassign teacher role
// @Description Remove teacher role assignment
// @Tags admin
// @Security BearerAuth
// @Param id path string true "Role ID"
// @Success 204
// @Router /admin/teacher-roles/{id} [delete]
func (h *AdminHandler) UnassignTeacherRole(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.Where("id = ?", id).Delete(&models.TeacherRole{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete role"})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetTeacherRoles godoc
// @Summary Get all teacher roles
// @Description Get list of all teacher role assignments
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.TeacherRole
// @Router /admin/teacher-roles [get]
func (h *AdminHandler) GetTeacherRoles(c *gin.Context) {
	var roles []models.TeacherRole
	if err := h.db.Preload("Teacher").Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch roles"})
		return
	}

	c.JSON(http.StatusOK, roles)
}

// GetSubmissionWindow godoc
// @Summary Get submission window settings
// @Description Get current submission window configuration
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.SubmissionWindow
// @Router /admin/submission-window [get]
func (h *AdminHandler) GetSubmissionWindow(c *gin.Context) {
	var window models.SubmissionWindow
	if err := h.db.First(&window).Error; err != nil {
		// Create default if not exists
		window = models.SubmissionWindow{
			IsOpen:    true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		h.db.Create(&window)
	}

	c.JSON(http.StatusOK, window)
}

// UpdateSubmissionWindow godoc
// @Summary Update submission window settings
// @Description Update submission window configuration
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param window body UpdateSubmissionWindowRequest true "Window settings"
// @Success 200 {object} models.SubmissionWindow
// @Router /admin/submission-window [put]
func (h *AdminHandler) UpdateSubmissionWindow(c *gin.Context) {
	var window models.SubmissionWindow
	if err := h.db.First(&window).Error; err != nil {
		// Create if not exists
		window = models.SubmissionWindow{
			IsOpen:    true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		h.db.Create(&window)
	}

	var req UpdateSubmissionWindowRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.IsOpen != nil {
		window.IsOpen = *req.IsOpen
	}
	if req.OpenTime != nil {
		window.OpenTime = req.OpenTime
	}
	if req.CloseTime != nil {
		window.CloseTime = req.CloseTime
	}

	window.UpdatedAt = time.Now()

	if err := h.db.Save(&window).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update window"})
		return
	}

	c.JSON(http.StatusOK, window)
}
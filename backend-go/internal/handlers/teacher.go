package handlers

import (
	"net/http"
	"time"

	"github.com/DityaPerdana/G7KAIH/backend/internal/middleware"
	"github.com/DityaPerdana/G7KAIH/backend/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TeacherHandler struct {
	db *gorm.DB
}

func NewTeacherHandler(db *gorm.DB) *TeacherHandler {
	return &TeacherHandler{db: db}
}

// GetStudents godoc
// @Summary Get all students
// @Description Get list of all students that teacher can access
// @Tags teacher
// @Produce json
// @Security BearerAuth
// @Param class query string false "Filter by class"
// @Success 200 {array} models.UserProfile
// @Router /teacher/students [get]
func (h *TeacherHandler) GetStudents(c *gin.Context) {
	teacherID, _ := middleware.GetUserID(c)
	userRole, _ := middleware.GetUserRole(c)

	query := h.db.Model(&models.UserProfile{}).Where("role = ?", "siswa")

	// If not admin, filter by teacher's assigned classes
	if userRole != "admin" {
		var teacherRoles []models.TeacherRole
		h.db.Where("teacher_id = ?", teacherID).Find(&teacherRoles)

		if len(teacherRoles) > 0 {
			classes := make([]string, len(teacherRoles))
			for i, tr := range teacherRoles {
				classes[i] = tr.ClassName
			}
			query = query.Where("class IN ?", classes)
		}
	}

	// Filter by class if provided
	if class := c.Query("class"); class != "" {
		query = query.Where("class = ?", class)
	}

	var students []models.UserProfile
	if err := query.Preload("User").Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch students"})
		return
	}

	c.JSON(http.StatusOK, students)
}

// GetStudent godoc
// @Summary Get student details
// @Description Get detailed information about a specific student
// @Tags teacher
// @Produce json
// @Security BearerAuth
// @Param id path string true "Student ID"
// @Success 200 {object} models.UserProfile
// @Router /teacher/students/{id} [get]
func (h *TeacherHandler) GetStudent(c *gin.Context) {
	id := c.Param("id")

	var student models.UserProfile
	if err := h.db.Preload("User").Where("id = ? AND role = ?", id, "siswa").First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	c.JSON(http.StatusOK, student)
}

// GetStudentActivities godoc
// @Summary Get student activities
// @Description Get activities for a specific student
// @Tags teacher
// @Produce json
// @Security BearerAuth
// @Param id path string true "Student User ID"
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Success 200 {array} models.Activity
// @Router /teacher/students/{id}/activities [get]
func (h *TeacherHandler) GetStudentActivities(c *gin.Context) {
	studentID := c.Param("id")

	query := h.db.Model(&models.Activity{}).
		Where("user_id = ?", studentID).
		Preload("Kegiatan.Category").
		Preload("Comments.User.Profile")

	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("date >= ?", startDate)
	}

	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("date <= ?", endDate)
	}

	var activities []models.Activity
	if err := query.Order("date DESC").Find(&activities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch activities"})
		return
	}

	c.JSON(http.StatusOK, activities)
}

// GetSupervisedStudents godoc
// @Summary Get supervised students
// @Description Get students supervised by this teacher
// @Tags teacher
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.UserProfile
// @Router /teacher/supervised-students [get]
func (h *TeacherHandler) GetSupervisedStudents(c *gin.Context) {
	teacherID, _ := middleware.GetUserID(c)

	var teacherRoles []models.TeacherRole
	h.db.Where("teacher_id = ?", teacherID).Find(&teacherRoles)

	if len(teacherRoles) == 0 {
		c.JSON(http.StatusOK, []models.UserProfile{})
		return
	}

	classes := make([]string, len(teacherRoles))
	for i, tr := range teacherRoles {
		classes[i] = tr.ClassName
	}

	var students []models.UserProfile
	if err := h.db.Where("role = ? AND class IN ?", "siswa", classes).
		Preload("User").
		Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch students"})
		return
	}

	c.JSON(http.StatusOK, students)
}

// GetDailyInactiveReport godoc
// @Summary Get daily inactive students report
// @Description Get list of students who haven't submitted activities for a specific date
// @Tags teacher
// @Produce json
// @Security BearerAuth
// @Param date query string true "Date (YYYY-MM-DD)"
// @Success 200 {object} map[string]interface{}
// @Router /teacher/reports/daily-inactive [get]
func (h *TeacherHandler) GetDailyInactiveReport(c *gin.Context) {
	dateStr := c.Query("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	teacherID, _ := middleware.GetUserID(c)
	userRole, _ := middleware.GetUserRole(c)

	// Get teacher's classes
	query := h.db.Model(&models.UserProfile{}).Where("role = ?", "siswa")

	if userRole != "admin" {
		var teacherRoles []models.TeacherRole
		h.db.Where("teacher_id = ?", teacherID).Find(&teacherRoles)

		if len(teacherRoles) > 0 {
			classes := make([]string, len(teacherRoles))
			for i, tr := range teacherRoles {
				classes[i] = tr.ClassName
			}
			query = query.Where("class IN ?", classes)
		}
	}

	var allStudents []models.UserProfile
	query.Preload("User").Find(&allStudents)

	// Get students who have submitted activities on this date
	var activeUserIDs []string
	h.db.Model(&models.Activity{}).
		Where("DATE(date) = ?", dateStr).
		Distinct("user_id").
		Pluck("user_id", &activeUserIDs)

	// Filter out active students
	var inactiveStudents []models.UserProfile
	activeMap := make(map[string]bool)
	for _, id := range activeUserIDs {
		activeMap[id] = true
	}

	for _, student := range allStudents {
		if !activeMap[student.UserID.String()] {
			inactiveStudents = append(inactiveStudents, student)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"date":              dateStr,
		"total_students":    len(allStudents),
		"inactive_count":    len(inactiveStudents),
		"inactive_students": inactiveStudents,
	})
}

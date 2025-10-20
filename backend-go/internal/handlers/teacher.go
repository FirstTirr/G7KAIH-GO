package handlers

import (
	"net/http"
	"time"

	"github.com/FirstTirr/G7KAIH-GO/internal/middleware"
	"github.com/FirstTirr/G7KAIH-GO/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TeacherHandler struct {
	db *gorm.DB
}

func NewTeacherHandler(db *gorm.DB) *TeacherHandler {
	return &TeacherHandler{db: db}
}

func (h *TeacherHandler) GetStudents(c *gin.Context) {
	teacherID, _ := middleware.GetUserID(c)
	userRole, _ := middleware.GetUserRole(c)

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

	if class := c.Query("class"); class != "" {
		query = query.Where("class = ?", class)
	}

	var students []models.UserProfile
	if err := query.Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch students"})
		return
	}

	c.JSON(http.StatusOK, students)
}

func (h *TeacherHandler) GetStudent(c *gin.Context) {
	id := c.Param("id")

	var student models.UserProfile
	if err := h.db.Where("id = ? AND role = ?", id, "siswa").First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	c.JSON(http.StatusOK, student)
}

func (h *TeacherHandler) GetStudentActivities(c *gin.Context) {
	studentID := c.Param("id")

	query := h.db.Model(&models.Activity{}).
		Where("user_profile_id = ?", studentID).
		Preload("Kegiatan").
		Preload("Comments.UserProfile")

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
		Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch students"})
		return
	}

	c.JSON(http.StatusOK, students)
}

func (h *TeacherHandler) GetDailyInactiveReport(c *gin.Context) {
	dateStr := c.Query("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	teacherID, _ := middleware.GetUserID(c)
	userRole, _ := middleware.GetUserRole(c)

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
	query.Find(&allStudents)

	var activeUserIDs []string
	h.db.Model(&models.Activity{}).
		Where("DATE(date) = ?", dateStr).
		Distinct("user_profile_id").
		Pluck("user_profile_id", &activeUserIDs)

	activeMap := make(map[string]bool)
	for _, id := range activeUserIDs {
		activeMap[id] = true
	}

	var inactiveStudents []models.UserProfile
	for _, student := range allStudents {
		if !activeMap[student.ID.String()] {
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
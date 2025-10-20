package handlers

import (
	"net/http"
	"time"

	"github.com/DityaPerdana/G7KAIH/backend/internal/middleware"
	"github.com/DityaPerdana/G7KAIH/backend/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type GuruWaliHandler struct {
	db *gorm.DB
}

func NewGuruWaliHandler(db *gorm.DB) *GuruWaliHandler {
	return &GuruWaliHandler{db: db}
}

// GetStudents godoc
// @Summary Get guruwali's students
// @Description Get list of students in guruwali's class
// @Tags guruwali
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.UserProfile
// @Router /guruwali/students [get]
func (h *GuruWaliHandler) GetStudents(c *gin.Context) {
	teacherID, _ := middleware.GetUserID(c)

	// Get guruwali assignment
	var assignment models.GuruWaliAssignment
	if err := h.db.Where("teacher_id = ?", teacherID).First(&assignment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No guruwali assignment found"})
		return
	}

	var students []models.UserProfile
	if err := h.db.Where("role = ? AND class = ?", "siswa", assignment.ClassName).
		Preload("User").
		Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch students"})
		return
	}

	c.JSON(http.StatusOK, students)
}

// GetStudent godoc
// @Summary Get student details
// @Description Get detailed information about a specific student in guruwali's class
// @Tags guruwali
// @Produce json
// @Security BearerAuth
// @Param id path string true "Student Profile ID"
// @Success 200 {object} models.UserProfile
// @Router /guruwali/students/{id} [get]
func (h *GuruWaliHandler) GetStudent(c *gin.Context) {
	id := c.Param("id")
	teacherID, _ := middleware.GetUserID(c)

	// Get guruwali assignment
	var assignment models.GuruWaliAssignment
	if err := h.db.Where("teacher_id = ?", teacherID).First(&assignment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No guruwali assignment found"})
		return
	}

	var student models.UserProfile
	if err := h.db.Preload("User").
		Where("id = ? AND role = ? AND class = ?", id, "siswa", assignment.ClassName).
		First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	c.JSON(http.StatusOK, student)
}

// GetStudentDetails godoc
// @Summary Get detailed student information with activities
// @Description Get comprehensive information about a student including recent activities
// @Tags guruwali
// @Produce json
// @Security BearerAuth
// @Param id path string true "Student Profile ID"
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Success 200 {object} map[string]interface{}
// @Router /guruwali/students/{id}/details [get]
func (h *GuruWaliHandler) GetStudentDetails(c *gin.Context) {
	id := c.Param("id")
	teacherID, _ := middleware.GetUserID(c)

	// Get guruwali assignment
	var assignment models.GuruWaliAssignment
	if err := h.db.Where("teacher_id = ?", teacherID).First(&assignment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No guruwali assignment found"})
		return
	}

	var student models.UserProfile
	if err := h.db.Preload("User").
		Where("id = ? AND role = ? AND class = ?", id, "siswa", assignment.ClassName).
		First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	// Get student activities
	query := h.db.Model(&models.Activity{}).
		Where("user_id = ?", student.UserID).
		Preload("Kegiatan.Category").
		Preload("Comments.User.Profile")

	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("date >= ?", startDate)
	}

	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("date <= ?", endDate)
	}

	var activities []models.Activity
	query.Order("date DESC").Limit(50).Find(&activities)

	c.JSON(http.StatusOK, gin.H{
		"student":    student,
		"activities": activities,
	})
}

// GetDailyInactiveReport godoc
// @Summary Get daily inactive students report for guruwali's class
// @Description Get list of students in guruwali's class who haven't submitted activities
// @Tags guruwali
// @Produce json
// @Security BearerAuth
// @Param date query string true "Date (YYYY-MM-DD)"
// @Success 200 {object} map[string]interface{}
// @Router /guruwali/reports/daily-inactive [get]
func (h *GuruWaliHandler) GetDailyInactiveReport(c *gin.Context) {
	dateStr := c.Query("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	teacherID, _ := middleware.GetUserID(c)

	// Get guruwali assignment
	var assignment models.GuruWaliAssignment
	if err := h.db.Where("teacher_id = ?", teacherID).First(&assignment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No guruwali assignment found"})
		return
	}

	// Get all students in the class
	var allStudents []models.UserProfile
	h.db.Where("role = ? AND class = ?", "siswa", assignment.ClassName).
		Preload("User").
		Find(&allStudents)

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
		"class":             assignment.ClassName,
		"total_students":    len(allStudents),
		"inactive_count":    len(inactiveStudents),
		"inactive_students": inactiveStudents,
	})
}

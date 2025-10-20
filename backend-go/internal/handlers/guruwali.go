package handlers

import (
	"net/http"
	"time"

	"github.com/FirstTirr/G7KAIH-GO/internal/middleware"
	"github.com/FirstTirr/G7KAIH-GO/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type GuruWaliHandler struct {
	db *gorm.DB
}

func NewGuruWaliHandler(db *gorm.DB) *GuruWaliHandler {
	return &GuruWaliHandler{db: db}
}

func (h *GuruWaliHandler) GetStudents(c *gin.Context) {
	teacherID, _ := middleware.GetUserID(c)

	var assignments []models.GuruWaliAssignment
	if err := h.db.Where("teacher_id = ?", teacherID).
		Preload("Student").
		Find(&assignments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assignments"})
		return
	}

	if len(assignments) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No guruwali assignment found"})
		return
	}

	var students []models.UserProfile
	for _, assignment := range assignments {
		if assignment.Student != nil {
			students = append(students, *assignment.Student)
		}
	}

	c.JSON(http.StatusOK, students)
}

func (h *GuruWaliHandler) GetStudent(c *gin.Context) {
	id := c.Param("id")
	teacherID, _ := middleware.GetUserID(c)

	var assignment models.GuruWaliAssignment
	if err := h.db.Where("teacher_id = ? AND student_id = ?", teacherID, id).
		First(&assignment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found or not assigned to you"})
		return
	}

	var student models.UserProfile
	if err := h.db.Where("id = ?", id).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	c.JSON(http.StatusOK, student)
}

func (h *GuruWaliHandler) GetStudentDetails(c *gin.Context) {
	id := c.Param("id")
	teacherID, _ := middleware.GetUserID(c)

	var assignment models.GuruWaliAssignment
	if err := h.db.Where("teacher_id = ? AND student_id = ?", teacherID, id).
		First(&assignment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found or not assigned to you"})
		return
	}

	var student models.UserProfile
	if err := h.db.Where("id = ?", id).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	query := h.db.Model(&models.Activity{}).
		Where("user_profile_id = ?", student.ID).
		Preload("Kegiatan").
		Preload("Comments.UserProfile")

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

func (h *GuruWaliHandler) GetDailyInactiveReport(c *gin.Context) {
	dateStr := c.Query("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	teacherID, _ := middleware.GetUserID(c)

	var assignments []models.GuruWaliAssignment
	if err := h.db.Where("teacher_id = ?", teacherID).
		Preload("Student").
		Find(&assignments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assignments"})
		return
	}

	if len(assignments) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No guruwali assignment found"})
		return
	}

	var allStudents []models.UserProfile
	var studentIDs []string
	for _, assignment := range assignments {
		if assignment.Student != nil {
			allStudents = append(allStudents, *assignment.Student)
			studentIDs = append(studentIDs, assignment.Student.ID.String())
		}
	}

	var activeUserIDs []string
	h.db.Model(&models.Activity{}).
		Where("DATE(date) = ? AND user_profile_id IN ?", dateStr, studentIDs).
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
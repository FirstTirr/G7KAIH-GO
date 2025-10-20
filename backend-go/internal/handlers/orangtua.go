package handlers

import (
	"net/http"
	"strconv"

	"github.com/FirstTirr/G7KAIH-GO/internal/middleware"
	"github.com/FirstTirr/G7KAIH-GO/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type OrangTuaHandler struct {
	db *gorm.DB
}

func NewOrangTuaHandler(db *gorm.DB) *OrangTuaHandler {
	return &OrangTuaHandler{db: db}
}

func (h *OrangTuaHandler) GetChildren(c *gin.Context) {
	parentID, _ := middleware.GetUserID(c)

	var relationships []models.ParentStudent
	if err := h.db.Where("parent_id = ?", parentID).
		Preload("Student").
		Find(&relationships).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch children"})
		return
	}

	children := make([]models.UserProfile, 0, len(relationships))
	for _, rel := range relationships {
		if rel.Student != nil {
			children = append(children, *rel.Student)
		}
	}

	c.JSON(http.StatusOK, children)
}

func (h *OrangTuaHandler) GetChildActivities(c *gin.Context) {
	studentID := c.Param("id")
	parentID, _ := middleware.GetUserID(c)

	var relationship models.ParentStudent
	if err := h.db.Where("parent_id = ? AND student_id = ?", parentID, studentID).
		First(&relationship).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view this student's activities"})
		return
	}

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

	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil {
			limit = parsedLimit
		}
	}

	var activities []models.Activity
	if err := query.Order("date DESC").Limit(limit).Find(&activities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch activities"})
		return
	}

	c.JSON(http.StatusOK, activities)
}
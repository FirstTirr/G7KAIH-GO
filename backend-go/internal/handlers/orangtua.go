package handlers

import (
	"net/http"

	"github.com/DityaPerdana/G7KAIH/backend/internal/middleware"
	"github.com/DityaPerdana/G7KAIH/backend/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type OrangTuaHandler struct {
	db *gorm.DB
}

func NewOrangTuaHandler(db *gorm.DB) *OrangTuaHandler {
	return &OrangTuaHandler{db: db}
}

// GetChildren godoc
// @Summary Get parent's children
// @Description Get list of children linked to this parent
// @Tags orangtua
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.UserProfile
// @Router /orangtua/siswa [get]
func (h *OrangTuaHandler) GetChildren(c *gin.Context) {
	parentID, _ := middleware.GetUserID(c)

	// Get parent-student relationships
	var relationships []models.ParentStudent
	if err := h.db.Where("parent_id = ?", parentID).
		Preload("Student.Profile").
		Find(&relationships).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch children"})
		return
	}

	children := make([]models.UserProfile, 0, len(relationships))
	for _, rel := range relationships {
		if rel.Student.Profile != nil {
			children = append(children, *rel.Student.Profile)
		}
	}

	c.JSON(http.StatusOK, children)
}

// GetChildActivities godoc
// @Summary Get child's activities
// @Description Get activities for a specific child
// @Tags orangtua
// @Produce json
// @Security BearerAuth
// @Param id path string true "Student User ID"
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Param limit query int false "Limit results (default: 50)"
// @Success 200 {array} models.Activity
// @Router /orangtua/siswa/{id}/activities [get]
func (h *OrangTuaHandler) GetChildActivities(c *gin.Context) {
	studentID := c.Param("id")
	parentID, _ := middleware.GetUserID(c)

	// Verify relationship
	var relationship models.ParentStudent
	if err := h.db.Where("parent_id = ? AND student_id = ?", parentID, studentID).
		First(&relationship).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view this student's activities"})
		return
	}

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

	limit := 50
	if l := c.Query("limit"); l != "" {
		// Parse limit
		query = query.Limit(limit)
	}

	var activities []models.Activity
	if err := query.Order("date DESC").Limit(limit).Find(&activities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch activities"})
		return
	}

	c.JSON(http.StatusOK, activities)
}

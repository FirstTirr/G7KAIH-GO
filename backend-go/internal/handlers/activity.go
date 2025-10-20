package handlers

import (
	"net/http"
	"time"

	"github.com/DityaPerdana/G7KAIH/backend/internal/middleware"
	"github.com/DityaPerdana/G7KAIH/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ActivityHandler struct {
	db *gorm.DB
}

func NewActivityHandler(db *gorm.DB) *ActivityHandler {
	return &ActivityHandler{db: db}
}

type CreateActivityRequest struct {
	KegiatanID uuid.UUID `json:"kegiatan_id" binding:"required"`
	Date       string    `json:"date" binding:"required"` // Format: YYYY-MM-DD
	FormData   *string   `json:"form_data"`
	Notes      *string   `json:"notes"`
}

type UpdateActivityRequest struct {
	Date     *string `json:"date"`
	FormData *string `json:"form_data"`
	Status   *string `json:"status"`
	Notes    *string `json:"notes"`
}

// GetActivities godoc
// @Summary Get activities
// @Description Get list of activities with optional filters
// @Tags activities
// @Produce json
// @Security BearerAuth
// @Param user_id query string false "Filter by user ID"
// @Param kegiatan_id query string false "Filter by kegiatan ID"
// @Param date query string false "Filter by date (YYYY-MM-DD)"
// @Param status query string false "Filter by status"
// @Param limit query int false "Limit results"
// @Param offset query int false "Offset results"
// @Success 200 {array} models.Activity
// @Failure 500 {object} map[string]string
// @Router /activities [get]
func (h *ActivityHandler) GetActivities(c *gin.Context) {
	query := h.db.Model(&models.Activity{}).
		Preload("User.Profile").
		Preload("Kegiatan.Category").
		Preload("Comments.User.Profile")

	// Filters
	if userID := c.Query("user_id"); userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	if kegiatanID := c.Query("kegiatan_id"); kegiatanID != "" {
		query = query.Where("kegiatan_id = ?", kegiatanID)
	}

	if date := c.Query("date"); date != "" {
		query = query.Where("DATE(date) = ?", date)
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Pagination
	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := uuid.Parse(l); err == nil {
			limit = int(parsedLimit.ID())
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsedOffset, err := uuid.Parse(o); err == nil {
			offset = int(parsedOffset.ID())
		}
	}

	var activities []models.Activity
	if err := query.Order("date DESC").Limit(limit).Offset(offset).Find(&activities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch activities"})
		return
	}

	c.JSON(http.StatusOK, activities)
}

// GetActivity godoc
// @Summary Get activity by ID
// @Description Get single activity details
// @Tags activities
// @Produce json
// @Security BearerAuth
// @Param id path string true "Activity ID"
// @Success 200 {object} models.Activity
// @Failure 404 {object} map[string]string
// @Router /activities/{id} [get]
func (h *ActivityHandler) GetActivity(c *gin.Context) {
	id := c.Param("id")

	var activity models.Activity
	if err := h.db.Preload("User.Profile").
		Preload("Kegiatan.Category").
		Preload("Comments.User.Profile").
		Where("id = ?", id).
		First(&activity).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Activity not found"})
		return
	}

	c.JSON(http.StatusOK, activity)
}

// CreateActivity godoc
// @Summary Create new activity
// @Description Create a new activity submission
// @Tags activities
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param activity body CreateActivityRequest true "Activity data"
// @Success 201 {object} models.Activity
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /activities [post]
func (h *ActivityHandler) CreateActivity(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req CreateActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse date
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	// Verify kegiatan exists
	var kegiatan models.Kegiatan
	if err := h.db.Where("id = ? AND is_active = ?", req.KegiatanID, true).First(&kegiatan).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kegiatan not found or inactive"})
		return
	}

	activity := models.Activity{
		UserID:     userID,
		KegiatanID: req.KegiatanID,
		Date:       date,
		FormData:   req.FormData,
		Notes:      req.Notes,
		Status:     "pending",
	}

	if err := h.db.Create(&activity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create activity"})
		return
	}

	// Reload with relations
	h.db.Preload("User.Profile").
		Preload("Kegiatan.Category").
		First(&activity, activity.ID)

	c.JSON(http.StatusCreated, activity)
}

// UpdateActivity godoc
// @Summary Update activity
// @Description Update an existing activity
// @Tags activities
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Activity ID"
// @Param activity body UpdateActivityRequest true "Activity data"
// @Success 200 {object} models.Activity
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /activities/{id} [put]
func (h *ActivityHandler) UpdateActivity(c *gin.Context) {
	id := c.Param("id")
	userID, _ := middleware.GetUserID(c)
	userRole, _ := middleware.GetUserRole(c)

	var activity models.Activity
	if err := h.db.Where("id = ?", id).First(&activity).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Activity not found"})
		return
	}

	// Check permissions
	if activity.UserID != userID && userRole != "admin" && userRole != "guru" && userRole != "guruwali" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	var req UpdateActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	if req.Date != nil {
		date, err := time.Parse("2006-01-02", *req.Date)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
			return
		}
		activity.Date = date
	}

	if req.FormData != nil {
		activity.FormData = req.FormData
	}

	if req.Status != nil {
		// Only teachers and admin can change status
		if userRole == "admin" || userRole == "guru" || userRole == "guruwali" {
			activity.Status = *req.Status
		}
	}

	if req.Notes != nil {
		activity.Notes = req.Notes
	}

	if err := h.db.Save(&activity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update activity"})
		return
	}

	// Reload with relations
	h.db.Preload("User.Profile").
		Preload("Kegiatan.Category").
		Preload("Comments.User.Profile").
		First(&activity, activity.ID)

	c.JSON(http.StatusOK, activity)
}

// DeleteActivity godoc
// @Summary Delete activity
// @Description Delete an activity
// @Tags activities
// @Security BearerAuth
// @Param id path string true "Activity ID"
// @Success 204
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /activities/{id} [delete]
func (h *ActivityHandler) DeleteActivity(c *gin.Context) {
	id := c.Param("id")
	userID, _ := middleware.GetUserID(c)
	userRole, _ := middleware.GetUserRole(c)

	var activity models.Activity
	if err := h.db.Where("id = ?", id).First(&activity).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Activity not found"})
		return
	}

	// Check permissions
	if activity.UserID != userID && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	if err := h.db.Delete(&activity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete activity"})
		return
	}

	c.Status(http.StatusNoContent)
}

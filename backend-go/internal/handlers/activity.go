package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/FirstTirr/G7KAIH-GO/internal/middleware"
	"github.com/FirstTirr/G7KAIH-GO/internal/models"
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
	Date       string    `json:"date" binding:"required"`
	FormData   *string   `json:"form_data"`
	Notes      *string   `json:"notes"`
}

type UpdateActivityRequest struct {
	Date     *string `json:"date"`
	FormData *string `json:"form_data"`
	Status   *string `json:"status"`
	Notes    *string `json:"notes"`
}

func (h *ActivityHandler) GetActivities(c *gin.Context) {
	query := h.db.Model(&models.Activity{}).
		Preload("UserProfile").
		Preload("Kegiatan").
		Preload("Comments.UserProfile")

	if userID := c.Query("user_id"); userID != "" {
		query = query.Where("user_profile_id = ?", userID)
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

	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil {
			limit = parsedLimit
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsedOffset, err := strconv.Atoi(o); err == nil {
			offset = parsedOffset
		}
	}

	var activities []models.Activity
	if err := query.Order("date DESC").Limit(limit).Offset(offset).Find(&activities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch activities"})
		return
	}

	c.JSON(http.StatusOK, activities)
}

func (h *ActivityHandler) GetActivity(c *gin.Context) {
	id := c.Param("id")

	var activity models.Activity
	if err := h.db.Preload("UserProfile").
		Preload("Kegiatan").
		Preload("Comments.UserProfile").
		Where("id = ?", id).
		First(&activity).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Activity not found"})
		return
	}

	c.JSON(http.StatusOK, activity)
}

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

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	var kegiatan models.Kegiatan
	if err := h.db.Where("id = ? AND is_active = ?", req.KegiatanID, true).First(&kegiatan).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kegiatan not found or inactive"})
		return
	}

	activity := models.Activity{
		UserProfileID: userID,
		KegiatanID:    req.KegiatanID,
		Date:          date,
		FormData:      req.FormData,
		Notes:         req.Notes,
		Status:        "pending",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := h.db.Create(&activity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create activity"})
		return
	}

	h.db.Preload("UserProfile").
		Preload("Kegiatan").
		First(&activity, activity.ID)

	c.JSON(http.StatusCreated, activity)
}

func (h *ActivityHandler) UpdateActivity(c *gin.Context) {
	id := c.Param("id")
	userID, _ := middleware.GetUserID(c)
	userRole, _ := middleware.GetUserRole(c)

	var activity models.Activity
	if err := h.db.Where("id = ?", id).First(&activity).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Activity not found"})
		return
	}

	if activity.UserProfileID != userID && userRole != "admin" && userRole != "guru" && userRole != "guruwali" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	var req UpdateActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

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
		if userRole == "admin" || userRole == "guru" || userRole == "guruwali" {
			activity.Status = *req.Status
		}
	}

	if req.Notes != nil {
		activity.Notes = req.Notes
	}

	activity.UpdatedAt = time.Now()

	if err := h.db.Save(&activity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update activity"})
		return
	}

	h.db.Preload("UserProfile").
		Preload("Kegiatan").
		Preload("Comments.UserProfile").
		First(&activity, activity.ID)

	c.JSON(http.StatusOK, activity)
}

func (h *ActivityHandler) DeleteActivity(c *gin.Context) {
	id := c.Param("id")
	userID, _ := middleware.GetUserID(c)
	userRole, _ := middleware.GetUserRole(c)

	var activity models.Activity
	if err := h.db.Where("id = ?", id).First(&activity).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Activity not found"})
		return
	}

	if activity.UserProfileID != userID && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	if err := h.db.Delete(&activity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete activity"})
		return
	}

	c.Status(http.StatusNoContent)
}
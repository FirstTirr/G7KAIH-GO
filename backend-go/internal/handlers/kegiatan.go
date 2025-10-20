package handlers

import (
	"net/http"

	"github.com/DityaPerdana/G7KAIH/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type KegiatanHandler struct {
	db *gorm.DB
}

func NewKegiatanHandler(db *gorm.DB) *KegiatanHandler {
	return &KegiatanHandler{db: db}
}

type CreateKegiatanRequest struct {
	Name        string     `json:"name" binding:"required"`
	Description *string    `json:"description"`
	CategoryID  uuid.UUID  `json:"category_id" binding:"required"`
	FormSchema  *string    `json:"form_schema"`
	IsActive    *bool      `json:"is_active"`
}

// GetKegiatan godoc
// @Summary Get all kegiatan
// @Description Get list of all kegiatan (activity types)
// @Tags kegiatan
// @Produce json
// @Param category_id query string false "Filter by category ID"
// @Param is_active query bool false "Filter by active status"
// @Success 200 {array} models.Kegiatan
// @Router /kegiatan [get]
func (h *KegiatanHandler) GetKegiatan(c *gin.Context) {
	query := h.db.Model(&models.Kegiatan{}).Preload("Category")

	if categoryID := c.Query("category_id"); categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	if isActive := c.Query("is_active"); isActive != "" {
		query = query.Where("is_active = ?", isActive == "true")
	}

	var kegiatan []models.Kegiatan
	if err := query.Find(&kegiatan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch kegiatan"})
		return
	}

	c.JSON(http.StatusOK, kegiatan)
}

// GetKegiatanByID godoc
// @Summary Get kegiatan by ID
// @Description Get single kegiatan details
// @Tags kegiatan
// @Produce json
// @Param id path string true "Kegiatan ID"
// @Success 200 {object} models.Kegiatan
// @Failure 404 {object} map[string]string
// @Router /kegiatan/{id} [get]
func (h *KegiatanHandler) GetKegiatanByID(c *gin.Context) {
	id := c.Param("id")

	var kegiatan models.Kegiatan
	if err := h.db.Preload("Category").Where("id = ?", id).First(&kegiatan).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kegiatan not found"})
		return
	}

	c.JSON(http.StatusOK, kegiatan)
}

// CreateKegiatan godoc
// @Summary Create new kegiatan
// @Description Create a new kegiatan (Admin only)
// @Tags kegiatan
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param kegiatan body CreateKegiatanRequest true "Kegiatan data"
// @Success 201 {object} models.Kegiatan
// @Failure 400 {object} map[string]string
// @Router /kegiatan [post]
func (h *KegiatanHandler) CreateKegiatan(c *gin.Context) {
	var req CreateKegiatanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify category exists
	var category models.Category
	if err := h.db.Where("id = ?", req.CategoryID).First(&category).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category not found"})
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	kegiatan := models.Kegiatan{
		Name:        req.Name,
		Description: req.Description,
		CategoryID:  req.CategoryID,
		FormSchema:  req.FormSchema,
		IsActive:    isActive,
	}

	if err := h.db.Create(&kegiatan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create kegiatan"})
		return
	}

	h.db.Preload("Category").First(&kegiatan, kegiatan.ID)

	c.JSON(http.StatusCreated, kegiatan)
}

// UpdateKegiatan godoc
// @Summary Update kegiatan
// @Description Update an existing kegiatan (Admin only)
// @Tags kegiatan
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Kegiatan ID"
// @Param kegiatan body CreateKegiatanRequest true "Kegiatan data"
// @Success 200 {object} models.Kegiatan
// @Failure 404 {object} map[string]string
// @Router /kegiatan/{id} [put]
func (h *KegiatanHandler) UpdateKegiatan(c *gin.Context) {
	id := c.Param("id")

	var kegiatan models.Kegiatan
	if err := h.db.Where("id = ?", id).First(&kegiatan).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kegiatan not found"})
		return
	}

	var req CreateKegiatanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	kegiatan.Name = req.Name
	kegiatan.Description = req.Description
	kegiatan.CategoryID = req.CategoryID
	kegiatan.FormSchema = req.FormSchema
	if req.IsActive != nil {
		kegiatan.IsActive = *req.IsActive
	}

	if err := h.db.Save(&kegiatan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update kegiatan"})
		return
	}

	h.db.Preload("Category").First(&kegiatan, kegiatan.ID)

	c.JSON(http.StatusOK, kegiatan)
}

// DeleteKegiatan godoc
// @Summary Delete kegiatan
// @Description Delete a kegiatan (Admin only)
// @Tags kegiatan
// @Security BearerAuth
// @Param id path string true "Kegiatan ID"
// @Success 204
// @Failure 404 {object} map[string]string
// @Router /kegiatan/{id} [delete]
func (h *KegiatanHandler) DeleteKegiatan(c *gin.Context) {
	id := c.Param("id")

	var kegiatan models.Kegiatan
	if err := h.db.Where("id = ?", id).First(&kegiatan).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kegiatan not found"})
		return
	}

	if err := h.db.Delete(&kegiatan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete kegiatan"})
		return
	}

	c.Status(http.StatusNoContent)
}

package handlers

import (
	"net/http"

	"github.com/DityaPerdana/G7KAIH/backend/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CategoryHandler struct {
	db *gorm.DB
}

func NewCategoryHandler(db *gorm.DB) *CategoryHandler {
	return &CategoryHandler{db: db}
}

type CreateCategoryRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description"`
	Icon        *string `json:"icon"`
	Color       *string `json:"color"`
}

// GetCategories godoc
// @Summary Get all categories
// @Description Get list of all categories
// @Tags categories
// @Produce json
// @Success 200 {array} models.Category
// @Router /categories [get]
func (h *CategoryHandler) GetCategories(c *gin.Context) {
	var categories []models.Category
	if err := h.db.Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}

	c.JSON(http.StatusOK, categories)
}

// GetCategory godoc
// @Summary Get category by ID
// @Description Get single category details
// @Tags categories
// @Produce json
// @Param id path string true "Category ID"
// @Success 200 {object} models.Category
// @Failure 404 {object} map[string]string
// @Router /categories/{id} [get]
func (h *CategoryHandler) GetCategory(c *gin.Context) {
	id := c.Param("id")

	var category models.Category
	if err := h.db.Preload("Activities").Where("id = ?", id).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	c.JSON(http.StatusOK, category)
}

// CreateCategory godoc
// @Summary Create new category
// @Description Create a new category (Admin only)
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param category body CreateCategoryRequest true "Category data"
// @Success 201 {object} models.Category
// @Failure 400 {object} map[string]string
// @Router /categories [post]
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category := models.Category{
		Name:        req.Name,
		Description: req.Description,
		Icon:        req.Icon,
		Color:       req.Color,
	}

	if err := h.db.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	c.JSON(http.StatusCreated, category)
}

// UpdateCategory godoc
// @Summary Update category
// @Description Update an existing category (Admin only)
// @Tags categories
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Category ID"
// @Param category body CreateCategoryRequest true "Category data"
// @Success 200 {object} models.Category
// @Failure 404 {object} map[string]string
// @Router /categories/{id} [put]
func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	id := c.Param("id")

	var category models.Category
	if err := h.db.Where("id = ?", id).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category.Name = req.Name
	category.Description = req.Description
	category.Icon = req.Icon
	category.Color = req.Color

	if err := h.db.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}

	c.JSON(http.StatusOK, category)
}

// DeleteCategory godoc
// @Summary Delete category
// @Description Delete a category (Admin only)
// @Tags categories
// @Security BearerAuth
// @Param id path string true "Category ID"
// @Success 204
// @Failure 404 {object} map[string]string
// @Router /categories/{id} [delete]
func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	id := c.Param("id")

	var category models.Category
	if err := h.db.Where("id = ?", id).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	if err := h.db.Delete(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
		return
	}

	c.Status(http.StatusNoContent)
}

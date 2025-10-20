package handlers

import (
	"net/http"

	"github.com/DityaPerdana/G7KAIH/backend/internal/middleware"
	"github.com/DityaPerdana/G7KAIH/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommentHandler struct {
	db *gorm.DB
}

func NewCommentHandler(db *gorm.DB) *CommentHandler {
	return &CommentHandler{db: db}
}

type CreateCommentRequest struct {
	ActivityID uuid.UUID `json:"activity_id" binding:"required"`
	Content    string    `json:"content" binding:"required"`
}

type UpdateCommentRequest struct {
	Content string `json:"content" binding:"required"`
}

// GetComments godoc
// @Summary Get comments
// @Description Get comments for an activity
// @Tags comments
// @Produce json
// @Security BearerAuth
// @Param activity_id query string true "Activity ID"
// @Success 200 {array} models.Comment
// @Router /comments [get]
func (h *CommentHandler) GetComments(c *gin.Context) {
	activityID := c.Query("activity_id")
	if activityID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "activity_id is required"})
		return
	}

	var comments []models.Comment
	if err := h.db.Preload("User.Profile").
		Where("activity_id = ?", activityID).
		Order("created_at ASC").
		Find(&comments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	c.JSON(http.StatusOK, comments)
}

// CreateComment godoc
// @Summary Create comment
// @Description Add a comment to an activity
// @Tags comments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param comment body CreateCommentRequest true "Comment data"
// @Success 201 {object} models.Comment
// @Router /comments [post]
func (h *CommentHandler) CreateComment(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify activity exists
	var activity models.Activity
	if err := h.db.Where("id = ?", req.ActivityID).First(&activity).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Activity not found"})
		return
	}

	comment := models.Comment{
		ActivityID: req.ActivityID,
		UserID:     userID,
		Content:    req.Content,
	}

	if err := h.db.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

	h.db.Preload("User.Profile").First(&comment, comment.ID)

	c.JSON(http.StatusCreated, comment)
}

// UpdateComment godoc
// @Summary Update comment
// @Description Update a comment
// @Tags comments
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Comment ID"
// @Param comment body UpdateCommentRequest true "Comment data"
// @Success 200 {object} models.Comment
// @Router /comments/{id} [put]
func (h *CommentHandler) UpdateComment(c *gin.Context) {
	id := c.Param("id")
	userID, _ := middleware.GetUserID(c)
	userRole, _ := middleware.GetUserRole(c)

	var comment models.Comment
	if err := h.db.Where("id = ?", id).First(&comment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	// Check permissions
	if comment.UserID != userID && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comment.Content = req.Content

	if err := h.db.Save(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comment"})
		return
	}

	h.db.Preload("User.Profile").First(&comment, comment.ID)

	c.JSON(http.StatusOK, comment)
}

// DeleteComment godoc
// @Summary Delete comment
// @Description Delete a comment
// @Tags comments
// @Security BearerAuth
// @Param id path string true "Comment ID"
// @Success 204
// @Router /comments/{id} [delete]
func (h *CommentHandler) DeleteComment(c *gin.Context) {
	id := c.Param("id")
	userID, _ := middleware.GetUserID(c)
	userRole, _ := middleware.GetUserRole(c)

	var comment models.Comment
	if err := h.db.Where("id = ?", id).First(&comment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	// Check permissions
	if comment.UserID != userID && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	if err := h.db.Delete(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	c.Status(http.StatusNoContent)
}

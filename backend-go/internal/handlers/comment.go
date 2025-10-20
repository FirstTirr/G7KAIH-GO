package handlers

import (
	"net/http"
	"time"

	"github.com/FirstTirr/G7KAIH-GO/internal/middleware"
	"github.com/FirstTirr/G7KAIH-GO/internal/models"
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

func (h *CommentHandler) GetComments(c *gin.Context) {
	activityID := c.Query("activity_id")
	if activityID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "activity_id is required"})
		return
	}

	var comments []models.Comment
	if err := h.db.Preload("UserProfile").
		Where("activity_id = ?", activityID).
		Order("created_at ASC").
		Find(&comments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	c.JSON(http.StatusOK, comments)
}

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

	var activity models.Activity
	if err := h.db.Where("id = ?", req.ActivityID).First(&activity).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Activity not found"})
		return
	}

	comment := models.Comment{
		ActivityID:    req.ActivityID,
		UserProfileID: userID,
		Content:       req.Content,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := h.db.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

	h.db.Preload("UserProfile").First(&comment, comment.ID)

	c.JSON(http.StatusCreated, comment)
}

func (h *CommentHandler) UpdateComment(c *gin.Context) {
	id := c.Param("id")
	userID, _ := middleware.GetUserID(c)
	userRole, _ := middleware.GetUserRole(c)

	var comment models.Comment
	if err := h.db.Where("id = ?", id).First(&comment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	if comment.UserProfileID != userID && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	var req UpdateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comment.Content = req.Content
	comment.UpdatedAt = time.Now()

	if err := h.db.Save(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comment"})
		return
	}

	h.db.Preload("UserProfile").First(&comment, comment.ID)

	c.JSON(http.StatusOK, comment)
}

func (h *CommentHandler) DeleteComment(c *gin.Context) {
	id := c.Param("id")
	userID, _ := middleware.GetUserID(c)
	userRole, _ := middleware.GetUserRole(c)

	var comment models.Comment
	if err := h.db.Where("id = ?", id).First(&comment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Comment not found"})
		return
	}

	if comment.UserProfileID != userID && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Permission denied"})
		return
	}

	if err := h.db.Delete(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	c.Status(http.StatusNoContent)
}
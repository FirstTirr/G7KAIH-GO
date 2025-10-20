package handlers

import (
	"net/http"
	"time"

	"github.com/FirstTirr/G7KAIH-GO/internal/middleware"
	"github.com/FirstTirr/G7KAIH-GO/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserHandler struct {
	db *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{db: db}
}

type UpdateProfileRequest struct {
	Name      *string `json:"name"`
	Class     *string `json:"class"`
	AvatarURL *string `json:"avatar_url"`
	Bio       *string `json:"bio"`
}

type ChangeTokenRequest struct {
	CurrentToken string `json:"current_token" binding:"required,len=4"`
}

type ChangeTokenResponse struct {
	NewToken string `json:"new_token"`
	Message  string `json:"message"`
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var profile models.UserProfile
	if err := h.db.Where("id = ?", userID).First(&profile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var profile models.UserProfile
	if err := h.db.Where("id = ?", userID).First(&profile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != nil {
		profile.Name = *req.Name
	}
	if req.Class != nil {
		profile.Class = *req.Class
	}
	if req.AvatarURL != nil {
		profile.AvatarURL = req.AvatarURL
	}
	if req.Bio != nil {
		profile.Bio = req.Bio
	}

	profile.UpdatedAt = time.Now()

	if err := h.db.Save(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (h *UserHandler) ChangeToken(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var profile models.UserProfile
	if err := h.db.Where("id = ?", userID).First(&profile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		return
	}

	var req ChangeTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	currentHash := hashToken(req.CurrentToken)
	if profile.TokenHash != currentHash {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current token is incorrect"})
		return
	}

	newToken, err := random4Digits()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate new token"})
		return
	}

	profile.TokenHash = hashToken(newToken)
	profile.UpdatedAt = time.Now()

	if err := h.db.Save(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update token"})
		return
	}

	c.JSON(http.StatusOK, ChangeTokenResponse{
		NewToken: newToken,
		Message:  "Token changed successfully. Please save your new token securely.",
	})
}
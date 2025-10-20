package handlers

import (
	"net/http"

	"github.com/DityaPerdana/G7KAIH/backend/internal/auth"
	"github.com/DityaPerdana/G7KAIH/backend/internal/middleware"
	"github.com/DityaPerdana/G7KAIH/backend/internal/models"
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
	NIS       *string `json:"nis"`
	Class     *string `json:"class"`
	AvatarURL *string `json:"avatar_url"`
	Bio       *string `json:"bio"`
}

type UpdatePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

// GetProfile godoc
// @Summary Get user profile
// @Description Get current user's profile
// @Tags users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} ProfileResponse
// @Router /users/profile [get]
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var profile models.UserProfile
	if err := h.db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateProfile godoc
// @Summary Update user profile
// @Description Update current user's profile
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param profile body UpdateProfileRequest true "Profile data"
// @Success 200 {object} models.UserProfile
// @Router /users/profile [put]
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var profile models.UserProfile
	if err := h.db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	if req.Name != nil {
		profile.Name = *req.Name
	}
	if req.NIS != nil {
		profile.NIS = req.NIS
	}
	if req.Class != nil {
		profile.Class = req.Class
	}
	if req.AvatarURL != nil {
		profile.AvatarURL = req.AvatarURL
	}
	if req.Bio != nil {
		profile.Bio = req.Bio
	}

	if err := h.db.Save(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdatePassword godoc
// @Summary Update user password
// @Description Update current user's password
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param password body UpdatePasswordRequest true "Password data"
// @Success 200 {object} map[string]string
// @Router /users/password [put]
func (h *UserHandler) UpdatePassword(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var user models.User
	if err := h.db.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req UpdatePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify current password
	if err := auth.VerifyPassword(user.Password, req.CurrentPassword); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}

	// Hash new password
	hashedPassword, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	user.Password = hashedPassword

	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

package handlers

import (
	"net/http"
	"time"

	"github.com/FirstTirr/G7KAIH-GO/internal/auth"
	"github.com/FirstTirr/G7KAIH-GO/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db         *gorm.DB
	jwtService *auth.JWTService
}

func NewAuthHandler(db *gorm.DB, jwtService *auth.JWTService) *AuthHandler {
	return &AuthHandler{db: db, jwtService: jwtService}
}

type SignupRequest struct {
	Name  string `json:"name" binding:"required"`
	Class string `json:"class" binding:"required"`
	Role  string `json:"role" binding:"required,oneof=siswa orangtua guru guruwali admin"`
}

type SignupResponse struct {
	UserID string `json:"user_id"`
	Token  string `json:"token"`
}

type LoginRequest struct {
	Token string `json:"token" binding:"required,len=4"`
}

type LoginResponse struct {
	Token   string              `json:"token"`
	Profile *models.UserProfile `json:"profile,omitempty"`
}

func (h *AuthHandler) Signup(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, err := random4Digits()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}
	hash := hashToken(token)

	profile := &models.UserProfile{
		ID:        uuid.New(),
		Name:      req.Name,
		Class:     req.Class,
		Role:      req.Role,
		TokenHash: hash,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.db.Create(profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create profile"})
		return
	}

	c.JSON(http.StatusOK, SignupResponse{UserID: profile.ID.String(), Token: token})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hash := hashToken(req.Token)

	var profile models.UserProfile
	if err := h.db.Where("token_hash = ?", hash).First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	tokenStr, _, err := h.jwtService.GenerateToken(profile.ID, profile.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{Token: tokenStr, Profile: &profile})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var profile models.UserProfile
	if err := h.db.Where("id = ?", userID).First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Profile not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	tokenStr, _, err := h.jwtService.GenerateToken(profile.ID, profile.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, LoginResponse{Token: tokenStr, Profile: &profile})
}
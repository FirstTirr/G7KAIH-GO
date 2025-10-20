package handlers

import (
	"net/http"

	"github.com/DityaPerdana/G7KAIH/backend/internal/auth"
	"github.com/DityaPerdana/G7KAIH/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db         *gorm.DB
	jwtService *auth.JWTService
}

func NewAuthHandler(db *gorm.DB, jwtService *auth.JWTService) *AuthHandler {
	return &AuthHandler{
		db:         db,
		jwtService: jwtService,
	}
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Email    string  `json:"email" binding:"required,email"`
	Password string  `json:"password" binding:"required,min=6"`
	Name     string  `json:"name" binding:"required"`
	Role     string  `json:"role" binding:"required,oneof=siswa orangtua guru guruwali admin"`
	NIS      *string `json:"nis"`
	Class    *string `json:"class"`
}

type LoginResponse struct {
	User    *UserResponse   `json:"user"`
	Profile *ProfileResponse `json:"profile"`
	Tokens  *auth.TokenPair  `json:"tokens"`
}

type UserResponse struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
}

type ProfileResponse struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Name      string    `json:"name"`
	NIS       *string   `json:"nis,omitempty"`
	Class     *string   `json:"class,omitempty"`
	Role      string    `json:"role"`
	AvatarURL *string   `json:"avatar_url,omitempty"`
}

// Login godoc
// @Summary Login user
// @Description Login with email and password
// @Tags auth
// @Accept json
// @Produce json
// @Param credentials body LoginRequest true "Login credentials"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.db.Preload("Profile").Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := auth.VerifyPassword(user.Password, req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	role := "siswa"
	if user.Profile != nil {
		role = user.Profile.Role
	}

	tokens, err := h.jwtService.GenerateTokenPair(user.ID, user.Email, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	response := &LoginResponse{
		User: &UserResponse{
			ID:    user.ID,
			Email: user.Email,
		},
		Tokens: tokens,
	}

	if user.Profile != nil {
		response.Profile = &ProfileResponse{
			ID:        user.Profile.ID,
			UserID:    user.Profile.UserID,
			Name:      user.Profile.Name,
			NIS:       user.Profile.NIS,
			Class:     user.Profile.Class,
			Role:      user.Profile.Role,
			AvatarURL: user.Profile.AvatarURL,
		}
	}

	c.JSON(http.StatusOK, response)
}

// Register godoc
// @Summary Register new user
// @Description Register a new user account
// @Tags auth
// @Accept json
// @Produce json
// @Param user body RegisterRequest true "User registration data"
// @Success 201 {object} LoginResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := h.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already registered"})
		return
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	// Create user with transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	user := models.User{
		Email:    req.Email,
		Password: hashedPassword,
	}

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	profile := models.UserProfile{
		UserID: user.ID,
		Name:   req.Name,
		Role:   req.Role,
		NIS:    req.NIS,
		Class:  req.Class,
	}

	if err := tx.Create(&profile).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create profile"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete registration"})
		return
	}

	// Generate tokens
	tokens, err := h.jwtService.GenerateTokenPair(user.ID, user.Email, profile.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate tokens"})
		return
	}

	response := &LoginResponse{
		User: &UserResponse{
			ID:    user.ID,
			Email: user.Email,
		},
		Profile: &ProfileResponse{
			ID:        profile.ID,
			UserID:    profile.UserID,
			Name:      profile.Name,
			NIS:       profile.NIS,
			Class:     profile.Class,
			Role:      profile.Role,
			AvatarURL: profile.AvatarURL,
		},
		Tokens: tokens,
	}

	c.JSON(http.StatusCreated, response)
}

// RefreshToken godoc
// @Summary Refresh access token
// @Description Get new access token using refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Param token body map[string]string true "Refresh token"
// @Success 200 {object} auth.TokenPair
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tokens, err := h.jwtService.RefreshAccessToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	c.JSON(http.StatusOK, tokens)
}

// Me godoc
// @Summary Get current user
// @Description Get currently authenticated user info
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} LoginResponse
// @Failure 401 {object} map[string]string
// @Router /auth/me [get]
func (h *AuthHandler) Me(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var user models.User
	if err := h.db.Preload("Profile").Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	response := &LoginResponse{
		User: &UserResponse{
			ID:    user.ID,
			Email: user.Email,
		},
	}

	if user.Profile != nil {
		response.Profile = &ProfileResponse{
			ID:        user.Profile.ID,
			UserID:    user.Profile.UserID,
			Name:      user.Profile.Name,
			NIS:       user.Profile.NIS,
			Class:     user.Profile.Class,
			Role:      user.Profile.Role,
			AvatarURL: user.Profile.AvatarURL,
		}
	}

	c.JSON(http.StatusOK, response)
}

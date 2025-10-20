package router

import (
	"github.com/FirstTirr/G7KAIH-GO/internal/auth"
	"github.com/FirstTirr/G7KAIH-GO/internal/config"
	"github.com/FirstTirr/G7KAIH-GO/internal/handlers"
	"github.com/FirstTirr/G7KAIH-GO/internal/middleware"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
)

func Setup(db *gorm.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// Set trusted proxies
	if len(cfg.Server.TrustedProxies) > 0 {
		r.SetTrustedProxies(cfg.Server.TrustedProxies)
	}

	// Middleware - Request ID (for tracing in microservices)
	r.Use(middleware.RequestID())

	// Middleware - Service Info
	r.Use(middleware.ServiceInfo(cfg.Server.ServiceName, cfg.Server.ServiceVersion))

	// Middleware - CORS (Dynamic based on mode)
	r.Use(middleware.CORSDynamic(
		cfg.CORS.AllowedOrigins,
		cfg.CORS.AllowCredentials,
		cfg.CORS.MaxAgeHours,
	))

	// Middleware - IP Whitelist (if configured)
	if len(cfg.CORS.AllowedBackendIPs) > 0 {
		r.Use(middleware.IPWhitelist(cfg.CORS.AllowedBackendIPs))
	}

	// Middleware - Rate Limiting
	if cfg.RateLimit.Enabled {
		rateLimiter := middleware.NewRateLimiter(cfg.RateLimit.RequestsPerMinute)
		r.Use(rateLimiter.Limit())
	}

	// JWT Service
	jwtService := auth.NewJWTService(
		cfg.JWT.Secret,
		cfg.JWT.ExpirationHours,
	)

	// Auth Middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtService)

	// Handlers
	authHandler := handlers.NewAuthHandler(db, jwtService)
	categoryHandler := handlers.NewCategoryHandler(db)
	kegiatanHandler := handlers.NewKegiatanHandler(db)
	activityHandler := handlers.NewActivityHandler(db)
	commentHandler := handlers.NewCommentHandler(db)
	userHandler := handlers.NewUserHandler(db)
	teacherHandler := handlers.NewTeacherHandler(db)
	guruWaliHandler := handlers.NewGuruWaliHandler(db)
	orangTuaHandler := handlers.NewOrangTuaHandler(db)
	adminHandler := handlers.NewAdminHandler(db)

	// Swagger documentation
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.POST("/login", authHandler.Login)
			// expose a token-validated 'me' endpoint so frontends can fetch current user
			// Note: requires Authorization header (Bearer token)
			auth.GET("/me", authMiddleware.Authenticate(), authHandler.Me)
		}

		// Categories (public read, admin write)
		categories := v1.Group("/categories")
		{
			categories.GET("", categoryHandler.GetCategories)
			categories.GET("/:id", categoryHandler.GetCategory)
			categories.POST("", authMiddleware.Authenticate(), authMiddleware.RequireAdmin(), categoryHandler.CreateCategory)
			categories.PUT("/:id", authMiddleware.Authenticate(), authMiddleware.RequireAdmin(), categoryHandler.UpdateCategory)
			categories.DELETE("/:id", authMiddleware.Authenticate(), authMiddleware.RequireAdmin(), categoryHandler.DeleteCategory)
		}

		// Kegiatan (public read, admin write)
		kegiatan := v1.Group("/kegiatan")
		{
			kegiatan.GET("", kegiatanHandler.GetKegiatan)
			kegiatan.GET("/:id", kegiatanHandler.GetKegiatanByID)
			kegiatan.POST("", authMiddleware.Authenticate(), authMiddleware.RequireAdmin(), kegiatanHandler.CreateKegiatan)
			kegiatan.PUT("/:id", authMiddleware.Authenticate(), authMiddleware.RequireAdmin(), kegiatanHandler.UpdateKegiatan)
			kegiatan.DELETE("/:id", authMiddleware.Authenticate(), authMiddleware.RequireAdmin(), kegiatanHandler.DeleteKegiatan)
		}

		// Activities (authenticated)
		activities := v1.Group("/activities")
		activities.Use(authMiddleware.Authenticate())
		{
			activities.GET("", activityHandler.GetActivities)
			activities.GET("/:id", activityHandler.GetActivity)
			activities.POST("", activityHandler.CreateActivity)
			activities.PUT("/:id", activityHandler.UpdateActivity)
			activities.DELETE("/:id", activityHandler.DeleteActivity)
		}

		// Comments (authenticated)
		comments := v1.Group("/comments")
		comments.Use(authMiddleware.Authenticate())
		{
			comments.GET("", commentHandler.GetComments)
			comments.POST("", commentHandler.CreateComment)
			comments.PUT("/:id", commentHandler.UpdateComment)
			comments.DELETE("/:id", commentHandler.DeleteComment)
		}

		// Users (authenticated)
		users := v1.Group("/users")
		users.Use(authMiddleware.Authenticate())
		{
			users.GET("/profile", userHandler.GetProfile)
			users.PUT("/profile", userHandler.UpdateProfile)
		}

		// Teacher routes
		teacher := v1.Group("/teacher")
		teacher.Use(authMiddleware.Authenticate(), authMiddleware.RequireTeacher())
		{
			teacher.GET("/students", teacherHandler.GetStudents)
			teacher.GET("/students/:id", teacherHandler.GetStudent)
			teacher.GET("/students/:id/activities", teacherHandler.GetStudentActivities)
			teacher.GET("/supervised-students", teacherHandler.GetSupervisedStudents)
			teacher.GET("/reports/daily-inactive", teacherHandler.GetDailyInactiveReport)
		}

		// Guru Wali routes
		guruwali := v1.Group("/guruwali")
		guruwali.Use(authMiddleware.Authenticate(), authMiddleware.RequireGuruWali())
		{
			guruwali.GET("/students", guruWaliHandler.GetStudents)
			guruwali.GET("/students/:id", guruWaliHandler.GetStudent)
			guruwali.GET("/students/:id/details", guruWaliHandler.GetStudentDetails)
			guruwali.GET("/reports/daily-inactive", guruWaliHandler.GetDailyInactiveReport)
		}

		// Orang Tua routes
		orangtua := v1.Group("/orangtua")
		orangtua.Use(authMiddleware.Authenticate(), authMiddleware.RequireRole("orangtua"))
		{
			orangtua.GET("/siswa", orangTuaHandler.GetChildren)
			orangtua.GET("/siswa/:id/activities", orangTuaHandler.GetChildActivities)
		}

		// Admin routes
		admin := v1.Group("/admin")
		admin.Use(authMiddleware.Authenticate(), authMiddleware.RequireAdmin())
		{
			admin.GET("/users", adminHandler.GetUsers)
			admin.POST("/users", adminHandler.CreateUser)
			admin.PUT("/users/:id", adminHandler.UpdateUser)
			admin.DELETE("/users/:id", adminHandler.DeleteUser)
			admin.POST("/users/bulk-import", adminHandler.BulkImportUsers)
			
			admin.POST("/link-parent-student", adminHandler.LinkParentStudent)
			admin.DELETE("/link-parent-student/:id", adminHandler.UnlinkParentStudent)
			
			admin.POST("/assign-guruwali", adminHandler.AssignGuruWali)
			admin.DELETE("/assign-guruwali/:id", adminHandler.UnassignGuruWali)
			admin.GET("/guruwali-assignments", adminHandler.GetGuruWaliAssignments)
			
			admin.POST("/teacher-roles", adminHandler.AssignTeacherRole)
			admin.DELETE("/teacher-roles/:id", adminHandler.UnassignTeacherRole)
			admin.GET("/teacher-roles", adminHandler.GetTeacherRoles)
			
			admin.GET("/submission-window", adminHandler.GetSubmissionWindow)
			admin.PUT("/submission-window", adminHandler.UpdateSubmissionWindow)
		}
	}

	return r
}

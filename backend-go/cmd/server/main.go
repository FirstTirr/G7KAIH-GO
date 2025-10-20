package main

import (
	"log"
	"os"

	"github.com/FirstTirr/G7KAIH-GO/internal/config"
	"github.com/FirstTirr/G7KAIH-GO/internal/database"
	"github.com/FirstTirr/G7KAIH-GO/internal/router"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// @title G7KAIH API
// @version 1.0
// @description Backend API untuk sistem manajemen kegiatan siswa G7KAIH
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@g7kaih.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.New(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize router
	r := router.Setup(db, cfg)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

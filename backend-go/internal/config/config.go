package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Environment   string
	Server        ServerConfig
	Database      DatabaseConfig
	JWT           JWTConfig
	Cloudinary    CloudinaryConfig
	CORS          CORSConfig
	RateLimit     RateLimitConfig
	Logging       LoggingConfig
	Microservices MicroservicesConfig
}

type ServerConfig struct {
	Port           string
	Host           string
	GinMode        string
	ServiceName    string
	ServiceVersion string
	BackendURL     string
	TrustedProxies []string
}

type DatabaseConfig struct {
	Host            string
	Port            string
	User            string
	Password        string
	DBName          string
	SSLMode         string
	MaxIdleConns    int
	MaxOpenConns    int
	ConnMaxLifetime time.Duration
}

type JWTConfig struct {
	Secret          string
	ExpirationHours int
}

type CloudinaryConfig struct {
	CloudName    string
	APIKey       string
	APISecret    string
	UploadFolder string
}

type CORSConfig struct {
	Mode                string
	AllowedOrigins      []string
	AllowCredentials    bool
	MaxAgeHours         int
	DevFrontendURL      string
	DevAdminURL         string
	StagingFrontendURL  string
	StagingAdminURL     string
	ProdFrontendURL     string
	ProdAdminURL        string
	CustomOrigins       []string
	AllowedFrontendIPs  []string
	AllowedBackendIPs   []string
}

type RateLimitConfig struct {
	RequestsPerMinute int
	Enabled           bool
}

type LoggingConfig struct {
	Level  string
	Format string
}

type MicroservicesConfig struct {
	Enabled              bool
	ServiceDiscovery     string
	AuthServiceURL       string
	StorageServiceURL    string
	NotificationServiceURL string
}

func Load() *Config {
	corsMode := getEnv("CORS_MODE", "development")
	
	cfg := &Config{
		Environment: getEnv("ENVIRONMENT", "development"),
		Server: ServerConfig{
			Port:           getEnv("PORT", "8080"),
			Host:           getEnv("BACKEND_HOST", "localhost"),
			GinMode:        getEnv("GIN_MODE", "debug"),
			ServiceName:    getEnv("SERVICE_NAME", "g7kaih-api"),
			ServiceVersion: getEnv("SERVICE_VERSION", "1.0.0"),
			BackendURL:     getEnv("BACKEND_URL", "http://localhost:8080"),
			TrustedProxies: getEnvAsSlice("TRUSTED_PROXIES", ","),
		},
		Database: DatabaseConfig{
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnv("DB_PORT", "5432"),
			User:            getEnv("DB_USER", "postgres"),
			Password:        getEnv("DB_PASSWORD", ""),
			DBName:          getEnv("DB_NAME", "g7kaih"),
			SSLMode:         getEnv("DB_SSLMODE", "disable"),
			MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNS", 10),
			MaxOpenConns:    getEnvAsInt("DB_MAX_OPEN_CONNS", 100),
			ConnMaxLifetime: getEnvAsDuration("DB_CONN_MAX_LIFETIME", "1h"),
		},
		JWT: JWTConfig{
			Secret:          getEnv("JWT_SECRET", "your-secret-key"),
			ExpirationHours: getEnvAsInt("JWT_EXPIRATION_HOURS", 24),
		},
		Cloudinary: CloudinaryConfig{
			CloudName:    getEnv("CLOUDINARY_CLOUD_NAME", ""),
			APIKey:       getEnv("CLOUDINARY_API_KEY", ""),
			APISecret:    getEnv("CLOUDINARY_API_SECRET", ""),
			UploadFolder: getEnv("CLOUDINARY_UPLOAD_FOLDER", "g7kaih"),
		},
		CORS: CORSConfig{
			Mode:                corsMode,
			AllowCredentials:    getEnvAsBool("CORS_ALLOW_CREDENTIALS", true),
			MaxAgeHours:         getEnvAsInt("CORS_MAX_AGE_HOURS", 12),
			DevFrontendURL:      getEnv("CORS_DEV_FRONTEND_URL", "http://localhost:3000"),
			DevAdminURL:         getEnv("CORS_DEV_ADMIN_URL", "http://localhost:3001"),
			StagingFrontendURL:  getEnv("CORS_STAGING_FRONTEND_URL", "http://staging.g7kaih.com"),
			StagingAdminURL:     getEnv("CORS_STAGING_ADMIN_URL", "http://admin-staging.g7kaih.com"),
			ProdFrontendURL:     getEnv("CORS_PROD_FRONTEND_URL", "https://g7kaih.com"),
			ProdAdminURL:        getEnv("CORS_PROD_ADMIN_URL", "https://admin.g7kaih.com"),
			CustomOrigins:       getEnvAsSlice("CORS_CUSTOM_ORIGINS", ","),
			AllowedFrontendIPs:  getEnvAsSlice("ALLOWED_FRONTEND_IPS", ","),
			AllowedBackendIPs:   getEnvAsSlice("ALLOWED_BACKEND_IPS", ","),
		},
		RateLimit: RateLimitConfig{
			RequestsPerMinute: getEnvAsInt("RATE_LIMIT_REQUESTS_PER_MINUTE", 60),
			Enabled:           getEnvAsBool("RATE_LIMIT_ENABLED", true),
		},
		Logging: LoggingConfig{
			Level:  getEnv("LOG_LEVEL", "debug"),
			Format: getEnv("LOG_FORMAT", "json"),
		},
		Microservices: MicroservicesConfig{
			Enabled:                getEnvAsBool("MICROSERVICES_ENABLED", false),
			ServiceDiscovery:       getEnv("SERVICE_DISCOVERY", "none"),
			AuthServiceURL:         getEnv("AUTH_SERVICE_URL", "http://localhost:8081"),
			StorageServiceURL:      getEnv("STORAGE_SERVICE_URL", "http://localhost:8082"),
			NotificationServiceURL: getEnv("NOTIFICATION_SERVICE_URL", "http://localhost:8083"),
		},
	}

	// Set allowed origins based on mode
	cfg.CORS.AllowedOrigins = getCORSOrigins(cfg.CORS)

	return cfg
}

// getCORSOrigins determines allowed origins based on CORS mode
func getCORSOrigins(cors CORSConfig) []string {
	var origins []string

	switch cors.Mode {
	case "development":
		origins = []string{
			cors.DevFrontendURL,
			cors.DevAdminURL,
		}
	case "staging":
		origins = []string{
			cors.StagingFrontendURL,
			cors.StagingAdminURL,
		}
	case "production":
		origins = []string{
			cors.ProdFrontendURL,
			cors.ProdAdminURL,
		}
	case "custom":
		origins = cors.CustomOrigins
	case "all":
		// Include all environments (for testing)
		origins = []string{
			cors.DevFrontendURL,
			cors.DevAdminURL,
			cors.StagingFrontendURL,
			cors.StagingAdminURL,
			cors.ProdFrontendURL,
			cors.ProdAdminURL,
		}
		origins = append(origins, cors.CustomOrigins...)
	default:
		// Default to development
		origins = []string{
			cors.DevFrontendURL,
			cors.DevAdminURL,
		}
	}

	// Add IP-based origins
	for _, ip := range cors.AllowedFrontendIPs {
		if ip != "" {
			origins = append(origins, "http://"+ip, "https://"+ip)
		}
	}

	// Filter out empty strings
	filtered := make([]string, 0)
	for _, origin := range origins {
		if origin != "" {
			filtered = append(filtered, origin)
		}
	}

	return filtered
}

func getEnvAsSlice(key, separator string) []string {
	value := os.Getenv(key)
	if value == "" {
		return []string{}
	}
	parts := strings.Split(value, separator)
	result := make([]string, 0)
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := os.Getenv(key)
	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue string) time.Duration {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		valueStr = defaultValue
	}
	duration, err := time.ParseDuration(valueStr)
	if err != nil {
		duration, _ = time.ParseDuration(defaultValue)
	}
	return duration
}

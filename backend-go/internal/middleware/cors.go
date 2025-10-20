package middleware

import (
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORSConfig for middleware
type CORSMiddlewareConfig struct {
	AllowedOrigins   []string
	AllowCredentials bool
	MaxAgeHours      int
	AllowAllOrigins  bool
	Mode             string
}

// CORS creates a CORS middleware with flexible configuration
func CORS(allowedOrigins []string, allowCredentials bool) gin.HandlerFunc {
	config := cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "X-CSRF-Token"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: allowCredentials,
		MaxAge:           12 * time.Hour,
	}

	return cors.New(config)
}

// CORSFlexible creates an advanced CORS middleware with dynamic origin validation
func CORSFlexible(cfg CORSMiddlewareConfig) gin.HandlerFunc {
	log.Printf("CORS Mode: %s", cfg.Mode)
	log.Printf("CORS Allowed Origins: %v", cfg.AllowedOrigins)

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Check if origin is allowed
		allowed := false
		if cfg.AllowAllOrigins {
			allowed = true
		} else {
			for _, allowedOrigin := range cfg.AllowedOrigins {
				if origin == allowedOrigin {
					allowed = true
					break
				}
				// Support wildcard subdomains
				if strings.Contains(allowedOrigin, "*") {
					pattern := strings.ReplaceAll(allowedOrigin, "*", ".*")
					if matched, _ := regexp.MatchString(pattern, origin); matched {
						allowed = true
						break
					}
				}
			}
		}

		if allowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With, X-CSRF-Token")
			c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Type, Authorization")
			
			if cfg.AllowCredentials {
				c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			}
			
			maxAge := cfg.MaxAgeHours * 3600
			c.Writer.Header().Set("Access-Control-Max-Age", string(rune(maxAge)))
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// CORSDynamic creates a CORS middleware with dynamic origin validation (for microservices)
func CORSDynamic(allowedOrigins []string, allowCredentials bool, maxAgeHours int) gin.HandlerFunc {
	allowedOriginsMap := make(map[string]bool)
	for _, origin := range allowedOrigins {
		allowedOriginsMap[origin] = true
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Check if origin is in allowed list
		if allowedOriginsMap[origin] || allowedOriginsMap["*"] {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			// Check if it's a valid IP-based origin
			for _, allowedOrigin := range allowedOrigins {
				if strings.HasPrefix(origin, "http://") || strings.HasPrefix(origin, "https://") {
					// Extract IP or domain
					parts := strings.Split(origin, "://")
					if len(parts) == 2 {
						hostPort := parts[1]
						host := strings.Split(hostPort, ":")[0]
						
						// Check if this IP is allowed
						for _, allowed := range allowedOrigins {
							if strings.Contains(allowed, host) {
								c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
								break
							}
						}
					}
				}
			}
		}

		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With, X-CSRF-Token, X-Service-Token")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Type, Authorization")
		
		if allowCredentials {
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		}
		
		maxAge := maxAgeHours * 3600
		c.Writer.Header().Set("Access-Control-Max-Age", string(rune(maxAge)))

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

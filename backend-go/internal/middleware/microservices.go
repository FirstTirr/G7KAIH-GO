package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// ServiceToken middleware for microservices authentication
type ServiceAuthConfig struct {
	ServiceToken string
	EnableAuth   bool
}

// NewServiceAuth creates middleware for inter-service authentication
func NewServiceAuth(config ServiceAuthConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !config.EnableAuth {
			c.Next()
			return
		}

		// Check for service token in header
		token := c.GetHeader("X-Service-Token")
		if token == "" {
			// Try Authorization header with Service prefix
			authHeader := c.GetHeader("Authorization")
			if strings.HasPrefix(authHeader, "Service ") {
				token = strings.TrimPrefix(authHeader, "Service ")
			}
		}

		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Service token required"})
			c.Abort()
			return
		}

		if token != config.ServiceToken {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid service token"})
			c.Abort()
			return
		}

		c.Set("service_authenticated", true)
		c.Next()
	}
}

// ServiceInfo middleware adds service information to request context
func ServiceInfo(serviceName, serviceVersion string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("service_name", serviceName)
		c.Set("service_version", serviceVersion)
		c.Writer.Header().Set("X-Service-Name", serviceName)
		c.Writer.Header().Set("X-Service-Version", serviceVersion)
		c.Next()
	}
}

// IPWhitelist middleware for restricting access by IP
func IPWhitelist(allowedIPs []string) gin.HandlerFunc {
	allowedIPMap := make(map[string]bool)
	for _, ip := range allowedIPs {
		if ip != "" {
			allowedIPMap[ip] = true
		}
	}

	return func(c *gin.Context) {
		if len(allowedIPMap) == 0 {
			// No whitelist configured, allow all
			c.Next()
			return
		}

		clientIP := c.ClientIP()

		// Check if IP is in whitelist
		if !allowedIPMap[clientIP] {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied from this IP"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequestID middleware adds unique request ID for tracing
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			// Generate new request ID
			requestID = generateRequestID()
		}

		c.Set("request_id", requestID)
		c.Writer.Header().Set("X-Request-ID", requestID)
		c.Next()
	}
}

func generateRequestID() string {
	// Simple implementation - in production, use UUID or similar
	return strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(
		http.TimeFormat, ":", ""), " ", "-"), ",", "")
}

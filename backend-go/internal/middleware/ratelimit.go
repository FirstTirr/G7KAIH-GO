package middleware

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type RateLimiter struct {
	visitors map[string]*rate.Limiter
	mu       sync.RWMutex
	rate     rate.Limit
	burst    int
}

func NewRateLimiter(requestsPerMinute int) *RateLimiter {
	return &RateLimiter{
		visitors: make(map[string]*rate.Limiter),
		rate:     rate.Limit(requestsPerMinute) / 60, // Convert to per second
		burst:    requestsPerMinute / 2,
	}
}

func (rl *RateLimiter) getLimiter(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	limiter, exists := rl.visitors[ip]
	if !exists {
		limiter = rate.NewLimiter(rl.rate, rl.burst)
		rl.visitors[ip] = limiter
	}

	return limiter
}

func (rl *RateLimiter) cleanupVisitors() {
	for {
		time.Sleep(time.Minute)
		rl.mu.Lock()
		for ip := range rl.visitors {
			delete(rl.visitors, ip)
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) Limit() gin.HandlerFunc {
	go rl.cleanupVisitors()

	return func(c *gin.Context) {
		limiter := rl.getLimiter(c.ClientIP())
		if !limiter.Allow() {
			c.JSON(429, gin.H{"error": "Too many requests"})
			c.Abort()
			return
		}
		c.Next()
	}
}

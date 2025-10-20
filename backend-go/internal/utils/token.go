package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

// Random4Digits returns a cryptographically-random 4-digit string (0000-9999)
func Random4Digits() (string, error) {
	b := make([]byte, 2)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	n := int(b[0])<<8 | int(b[1])
	n = n % 10000
	return fmt.Sprintf("%04d", n), nil
}

// HashToken computes the SHA-256 hash of a token string
func HashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
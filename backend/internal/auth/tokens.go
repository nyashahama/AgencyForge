package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type ContextKey string

const (
	UserIDKey   ContextKey = "user_id"
	EmailKey    ContextKey = "email"
	AgencyIDKey ContextKey = "agency_id"
	RoleKey     ContextKey = "role"
)

type Claims struct {
	Email    string `json:"email"`
	AgencyID string `json:"agency_id"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateAccessToken(userID string, email string, agencyID string, role string, secret string, expiry time.Duration) (string, error) {
	now := time.Now()
	claims := Claims{
		Email:    email,
		AgencyID: agencyID,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(expiry)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func GenerateRefreshToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func ValidateAccessToken(tokenStr string, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

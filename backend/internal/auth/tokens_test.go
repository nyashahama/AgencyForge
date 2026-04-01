package auth

import (
	"testing"
	"time"
)

func TestGenerateAndValidateAccessToken(t *testing.T) {
	token, err := GenerateAccessToken("user-1", "demo@agencyforge.test", "agency-1", "owner", "01234567890123456789012345678901", time.Hour)
	if err != nil {
		t.Fatalf("GenerateAccessToken() error = %v", err)
	}

	claims, err := ValidateAccessToken(token, "01234567890123456789012345678901")
	if err != nil {
		t.Fatalf("ValidateAccessToken() error = %v", err)
	}

	if claims.Subject != "user-1" {
		t.Fatalf("Subject = %q, want user-1", claims.Subject)
	}

	if claims.Email != "demo@agencyforge.test" {
		t.Fatalf("Email = %q, want demo@agencyforge.test", claims.Email)
	}
}

func TestGenerateRefreshToken(t *testing.T) {
	token, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("GenerateRefreshToken() error = %v", err)
	}

	if len(token) != 64 {
		t.Fatalf("len(token) = %d, want 64", len(token))
	}
}

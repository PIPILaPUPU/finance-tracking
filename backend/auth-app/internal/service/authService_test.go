package service

import (
	"context"
	"testing"
	"time"

	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/model"
	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/repository"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type stubUserRepository struct {
	userByEmail    model.User
	userByID       model.User
	createdSession model.RefreshSession
	rotatedOldHash string
	replacement    model.RefreshSession
}

func (s *stubUserRepository) CreateRefreshSession(_ context.Context, refresh model.RefreshSession) error {
	s.createdSession = refresh
	return nil
}

func (s *stubUserRepository) CreateUserWithSession(_ context.Context, user model.User, refresh model.RefreshSession) (model.User, error) {
	s.createdSession = refresh
	return user, nil
}

func (s *stubUserRepository) FindByMail(_ context.Context, email string) (model.User, error) {
	if s.userByEmail.Email == "" {
		return model.User{}, repository.ErrNotFound
	}
	return s.userByEmail, nil
}

func (s *stubUserRepository) FindUserByID(_ context.Context, id uuid.UUID) (model.User, error) {
	if s.userByID.ID == uuid.Nil {
		return model.User{}, repository.ErrNotFound
	}
	return s.userByID, nil
}

func (s *stubUserRepository) RotateRefreshSession(_ context.Context, oldHash string, replacement model.RefreshSession) (model.User, error) {
	s.rotatedOldHash = oldHash
	s.replacement = replacement
	return s.userByID, nil
}

func (s *stubUserRepository) RevokeRefreshSession(_ context.Context, tokenHash string) error {
	if tokenHash == hashToken("valid-token") {
		return nil
	}
	return repository.ErrInvalidSession
}

func TestLoginReturnsAccessAndRefreshTokens(t *testing.T) {
	hash, err := bcrypt.GenerateFromPassword([]byte("secret123"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatal(err)
	}

	repo := &stubUserRepository{
		userByEmail: model.User{
			ID:            uuid.New(),
			Username:      "alice",
			Email:         "alice@example.com",
			Password_hash: string(hash),
		},
	}

	service := AuthService{
		rep: repo,
		config: Config{
			JWTSecret:  "12345678901234567890123456789012",
			JWTIssuer:  "auth-app",
			AccessTTL:  15 * time.Minute,
			RefreshTTL: 7 * 24 * time.Hour,
		},
	}

	resp, err := service.Login(context.Background(), model.LoginRequest{Email: "alice@example.com", Password: "secret123"})
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}
	if resp.Token == "" {
		t.Fatal("access token must be present")
	}
	if resp.RefreshToken == "" {
		t.Fatal("refresh token must be returned")
	}
	if repo.createdSession.TokenHash != hashToken(resp.RefreshToken) {
		t.Fatalf("stored hash mismatch: got %q want %q", repo.createdSession.TokenHash, hashToken(resp.RefreshToken))
	}
}

func TestRefreshRotatesProvidedRefreshToken(t *testing.T) {
	oldRefresh := "refresh-token-123"
	user := model.User{ID: uuid.New(), Username: "bob"}
	repo := &stubUserRepository{userByID: user}
	service := AuthService{
		rep: repo,
		config: Config{
			JWTSecret:  "12345678901234567890123456789012",
			JWTIssuer:  "auth-app",
			AccessTTL:  15 * time.Minute,
			RefreshTTL: 7 * 24 * time.Hour,
		},
	}

	resp, err := service.Refresh(context.Background(), oldRefresh)
	if err != nil {
		t.Fatalf("refresh failed: %v", err)
	}
	if repo.rotatedOldHash != hashToken(oldRefresh) {
		t.Fatalf("old hash mismatch: got %q want %q", repo.rotatedOldHash, hashToken(oldRefresh))
	}
	if resp.AccessToken == "" {
		t.Fatal("new access token must be present")
	}
	if resp.RefreshToken == "" {
		t.Fatal("new refresh token must be present")
	}
	if repo.replacement.TokenHash != hashToken(resp.RefreshToken) {
		t.Fatalf("replacement hash mismatch: got %q want %q", repo.replacement.TokenHash, hashToken(resp.RefreshToken))
	}
}

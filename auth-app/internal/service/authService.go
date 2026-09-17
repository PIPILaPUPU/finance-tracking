package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/model"
	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// Hash for a fixed non-secret value, used to reduce username enumeration timing differences.
const dummyPasswordHash = "$2a$10$7EqJtq98hPqEX7fNZaFWoO5uF2e5.ZYRxG9rH8QqlWl1KSFMyY6e."

var (
	ErrInvalidInput       = errors.New("invalid input")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
)

var usernamePattern = regexp.MustCompile(`^[a-zA-Z0-9_]{3,32}$`)

type Config struct {
	JWTSecret  string
	JWTIssuer  string
	AccessTTL  time.Duration
	RefreshTTL time.Duration
}

type tokenClaims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

type AuthService struct {
	rep    repository.UserRepository
	config Config
}

func NewAuthService(repo repository.UserRepository, config Config) *AuthService {
	return &AuthService{rep: repo, config: config}
}

// ======================================SERVICE FUNCTION=============================================
func (s *AuthService) Register(ctx context.Context, request model.RegisterRequest) (model.RegisterResponse, error) {
	username := strings.TrimSpace(request.Username)
	email := strings.TrimSpace(request.Email)
	if err := validateRegistration(request); err != nil {
		return model.RegisterResponse{}, err
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		return model.RegisterResponse{}, fmt.Errorf("hash password: %w", err)
	}

	refreshToken, tokenHash, err := createRefreshToken()
	if err != nil {
		return model.RegisterResponse{}, err
	}

	now := time.Now()

	userReq := model.User{
		ID:            uuid.New(),
		Username:      username,
		Email:         email,
		Password_hash: string(passwordHash),
	}

	session := model.RefreshSession{
		ID:        uuid.New(),
		UserID:    userReq.ID,
		TokenHash: tokenHash,
		ExpiresAt: now.Add(s.config.RefreshTTL),
	}

	user, err := s.rep.CreateUserWithSession(ctx, userReq, session)
	if err != nil {
		return model.RegisterResponse{}, err
	}

	response, err := s.newAccessResponseRegistration(user, now)
	if err != nil {
		return model.RegisterResponse{}, err
	}
	return model.RegisterResponse{Username: response.Username, RefreshToken: refreshToken}, nil
}

func (s *AuthService) Login(ctx context.Context, request model.LoginRequest) (model.LoginResponse, error) {
	Email := request.Email
	Password := request.Password

	user, err := s.rep.FindByMail(ctx, Email)
	if errors.Is(err, repository.ErrNotFound) {
		_ = bcrypt.CompareHashAndPassword([]byte(dummyPasswordHash), []byte(Password))
		return model.LoginResponse{}, ErrInvalidCredentials
	}

	if err != nil {
		return model.LoginResponse{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password_hash), []byte(Password)); err != nil {
		return model.LoginResponse{}, ErrInvalidCredentials
	}

	return s.newSession(ctx, user)
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	if refreshToken == "" {
		return ErrInvalidToken
	}

	err := s.rep.RevokeRefreshSession(ctx, hashToken(refreshToken))
	if errors.Is(err, repository.ErrInvalidSession) {
		return ErrInvalidToken
	}
	if err != nil {
		return err
	}

	return nil
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (model.TokenResponse, error) {
	if refreshToken == "" {
		return model.TokenResponse{}, ErrInvalidToken
	}

	newRawToken, newTokenHash, err := createRefreshToken()
	if err != nil {
		return model.TokenResponse{}, err
	}

	now := time.Now()
	user, err := s.rep.RotateRefreshSession(ctx, hashToken(refreshToken), model.RefreshSession{
		ID:        uuid.New(),
		TokenHash: newTokenHash,
		ExpiresAt: now.Add(s.config.RefreshTTL),
	})
	if errors.Is(err, repository.ErrInvalidSession) {
		return model.TokenResponse{}, ErrInvalidToken
	}
	if err != nil {
		return model.TokenResponse{}, err
	}

	resp, err := s.newAccessResponseToken(user, now)
	if err != nil {
		return model.TokenResponse{}, err
	}
	resp.RefreshToken = newRawToken
	return resp, nil
}

func (s *AuthService) ParseAccessToken(rawToken string) (model.Claims, error) {
	parsed, err := jwt.ParseWithClaims(rawToken, &tokenClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, ErrInvalidToken
		}
		return []byte(s.config.JWTSecret), nil
	}, jwt.WithIssuer(s.config.JWTIssuer), jwt.WithExpirationRequired(), jwt.WithTimeFunc(time.Now))
	if err != nil || !parsed.Valid {
		return model.Claims{}, ErrInvalidToken
	}
	claims, ok := parsed.Claims.(*tokenClaims)
	if !ok {
		return model.Claims{}, ErrInvalidToken
	}
	userID, err := uuid.Parse(claims.Subject)
	if err != nil || claims.Username == "" {
		return model.Claims{}, ErrInvalidToken
	}
	return model.Claims{UserID: userID, Username: claims.Username}, nil
}

func (s *AuthService) UserByID(ctx context.Context, userID uuid.UUID) (model.User, error) {
	user, err := s.rep.FindUserByID(ctx, userID)
	if errors.Is(err, repository.ErrNotFound) {
		return model.User{}, ErrInvalidToken
	}

	return user, nil
}

// ======================================VALIDATION & TOKEN=============================================
func validateRegistration(request model.RegisterRequest) error {
	if !usernamePattern.MatchString(request.Username) {
		return fmt.Errorf("%w: username must contain 3-32 letters, digits or underscores", ErrInvalidInput)
	}
	address, err := mail.ParseAddress(request.Email)
	if err != nil || !strings.EqualFold(address.Address, request.Email) {
		return fmt.Errorf("%w: invalid email", ErrInvalidInput)
	}
	if len(request.Password) < 8 || len(request.Password) > 72 {
		return fmt.Errorf("%w: password must contain 8-72 bytes", ErrInvalidInput)
	}
	return nil
}

func createRefreshToken() (string, string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", "", fmt.Errorf("generate refresh token: %w", err)
	}

	rawToken := base64.URLEncoding.EncodeToString(bytes)
	return rawToken, hashToken(rawToken), nil
}

func hashToken(rawToken string) string {
	sum := sha256.Sum256([]byte(rawToken))
	return hex.EncodeToString(sum[:])
}

// ======================================JWT=============================================
func (s *AuthService) newAccessResponseRegistration(user model.User, now time.Time) (model.RegisterResponse, error) {
	expiresAt := now.Add(s.config.AccessTTL)
	claims := tokenClaims{
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID.String(),
			Issuer:    s.config.JWTIssuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			ID:        uuid.NewString(),
		},
	}
	return model.RegisterResponse{
		Username: claims.Username,
	}, nil
}

func (s *AuthService) newAccessResponseLogin(user model.User, now time.Time, refreshToken string) (model.LoginResponse, error) {
	expiresAt := now.Add(s.config.AccessTTL)
	claims := tokenClaims{
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID.String(),
			Issuer:    s.config.JWTIssuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			ID:        uuid.NewString(),
		},
	}
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.config.JWTSecret))
	if err != nil {
		return model.LoginResponse{}, fmt.Errorf("sign access token: %w", err)
	}
	return model.LoginResponse{
		Username:     user.Username,
		Token:        accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresAt:    expiresAt,
	}, nil
}

func (s *AuthService) newAccessResponseToken(user model.User, now time.Time) (model.TokenResponse, error) {
	expiresAt := now.Add(s.config.AccessTTL)
	claims := tokenClaims{
		Username: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID.String(),
			Issuer:    s.config.JWTIssuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			ID:        uuid.NewString(),
		},
	}
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.config.JWTSecret))
	if err != nil {
		return model.TokenResponse{}, fmt.Errorf("sign access token: %w", err)
	}
	return model.TokenResponse{
		AccessToken: accessToken,
		ExpiresIn:   expiresAt,
	}, nil
}

// ======================================SESSION=============================================
func (s *AuthService) newSession(ctx context.Context, user model.User) (model.LoginResponse, error) {
	rawRefreshToken, tokenHash, err := createRefreshToken()
	if err != nil {
		return model.LoginResponse{}, err
	}
	now := time.Now()
	if err := s.rep.CreateRefreshSession(ctx, model.RefreshSession{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: now.Add(s.config.RefreshTTL),
	}); err != nil {
		return model.LoginResponse{}, err
	}
	response, err := s.newAccessResponseLogin(user, now, rawRefreshToken)
	if err != nil {
		return model.LoginResponse{}, err
	}
	return response, nil
}

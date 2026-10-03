package service

import (
	"context"
	"errors"
	"strings"

	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/model"
	"github.com/PIPILaPUPU/finance-tracking/auth-app/internal/repository"
	"github.com/google/uuid"
)

var ErrReleaseNotFound = errors.New("release not found")

type ReleaseService struct {
	rep        repository.ReleaseRepository
	appVersion string
}

func NewReleaseService(rep repository.ReleaseRepository, appVersion string) *ReleaseService {
	return &ReleaseService{
		rep:        rep,
		appVersion: strings.TrimPrefix(strings.TrimSpace(appVersion), "v"),
	}
}

func (s *ReleaseService) Latest(ctx context.Context) (model.Release, error) {
	release, err := s.rep.FindByVersion(ctx, s.appVersion)
	if errors.Is(err, repository.ErrNotFound) {
		return model.Release{}, ErrReleaseNotFound
	}
	return release, err
}

func (s *ReleaseService) MarkSeen(ctx context.Context, userID uuid.UUID) error {
	err := s.rep.MarkSeen(ctx, userID, s.appVersion)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrReleaseNotFound
	}
	return err
}

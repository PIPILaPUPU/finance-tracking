package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/PIPILaPUPU/finance-tracking/category-app/internal/model"
	"github.com/PIPILaPUPU/finance-tracking/category-app/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	ErrCategoryNotFound = errors.New("category not found")
	ErrInvalidRequest   = errors.New("invalid request")
)

type CategoryService struct {
	rep repository.CategoryRepository
}

func NewCategoryService(repository repository.CategoryRepository) *CategoryService {
	return &CategoryService{rep: repository}
}

func (s *CategoryService) Create(ctx context.Context, userId uuid.UUID, request model.CreateUpdateCategoryRequst) (model.Category, error) {
	request.Name = strings.TrimSpace(request.Name)
	if request.Name == "" {
		return model.Category{}, fmt.Errorf("%w: name is required", ErrInvalidRequest)
	}

	c := model.Category{
		ID:   uuid.New(),
		User: userId,
		Name: request.Name,
	}

	created, err := s.rep.Create(ctx, userId, c)
	if err != nil {
		return model.Category{}, err
	}

	return created, nil
}

func (s *CategoryService) GetAll(ctx context.Context, userId uuid.UUID) ([]model.Category, error) {
	return s.rep.GetAll(ctx, userId)
}

func (s *CategoryService) GetById(ctx context.Context, userId uuid.UUID, categoryId uuid.UUID) (model.Category, error) {
	c, err := s.rep.GetById(ctx, userId, categoryId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, repository.ErrNotFound) {
			return model.Category{}, ErrCategoryNotFound
		}
		return model.Category{}, err
	}
	return c, nil
}

func (s *CategoryService) Update(ctx context.Context, userId uuid.UUID, categoryId uuid.UUID, request model.CreateUpdateCategoryRequst) (model.Category, error) {
	request.Name = strings.TrimSpace(request.Name)
	if request.Name == "" {
		return model.Category{}, fmt.Errorf("%w: name is required", ErrInvalidRequest)
	}

	c := model.Category{
		ID:   categoryId,
		User: userId,
		Name: request.Name,
	}

	updated, err := s.rep.Update(ctx, userId, categoryId, c)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, repository.ErrNotFound) {
			return model.Category{}, ErrCategoryNotFound
		}
		return model.Category{}, err
	}

	return updated, nil
}

func (s *CategoryService) Delete(ctx context.Context, userId uuid.UUID, categoryId uuid.UUID) error {
	err := s.rep.Delete(ctx, userId, categoryId)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, repository.ErrNotFound) {
			return ErrCategoryNotFound
		}
		return err
	}
	return nil
}

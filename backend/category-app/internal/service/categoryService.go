package service

import (
	"context"
	"errors"
	"fmt"
	"regexp"
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

const (
	defaultColor = "#5B4BFF"
	defaultIcon  = "tag"
	maxNameLen   = 255
)

var (
	colorPattern = regexp.MustCompile(`^#[0-9A-Fa-f]{6}$`)
	iconPattern  = regexp.MustCompile(`^[a-z][a-z0-9_-]{0,31}$`)
)

type CategoryService struct {
	rep repository.CategoryRepository
}

func NewCategoryService(repository repository.CategoryRepository) *CategoryService {
	return &CategoryService{rep: repository}
}

func (s *CategoryService) Create(ctx context.Context, userId uuid.UUID, request model.CreateUpdateCategoryRequst) (model.Category, error) {
	c, err := buildCategory(request)
	if err != nil {
		return model.Category{}, err
	}
	c.ID = uuid.New()
	c.User = userId

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
	c, err := buildCategory(request)
	if err != nil {
		return model.Category{}, err
	}
	c.ID = categoryId
	c.User = userId

	updated, err := s.rep.Update(ctx, userId, categoryId, c)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, repository.ErrNotFound) {
			return model.Category{}, ErrCategoryNotFound
		}
		return model.Category{}, err
	}

	return updated, nil
}

// buildCategory validates the request and fills in style defaults. A category
// can be used for expenses, for income, or for both, but never for neither.
func buildCategory(request model.CreateUpdateCategoryRequst) (model.Category, error) {
	name := strings.TrimSpace(request.Name)
	if name == "" {
		return model.Category{}, fmt.Errorf("%w: name is required", ErrInvalidRequest)
	}
	if len([]rune(name)) > maxNameLen {
		return model.Category{}, fmt.Errorf("%w: name is too long", ErrInvalidRequest)
	}

	isExpense, isIncome := true, true
	if request.IsExpense != nil {
		isExpense = *request.IsExpense
	}
	if request.IsIncome != nil {
		isIncome = *request.IsIncome
	}
	if !isExpense && !isIncome {
		return model.Category{}, fmt.Errorf("%w: category must be for expenses, income or both", ErrInvalidRequest)
	}

	color := defaultColor
	if request.Color != nil && strings.TrimSpace(*request.Color) != "" {
		color = strings.ToUpper(strings.TrimSpace(*request.Color))
		if !colorPattern.MatchString(color) {
			return model.Category{}, fmt.Errorf("%w: color must be a hex value like #5B4BFF", ErrInvalidRequest)
		}
	}

	icon := defaultIcon
	if request.Icon != nil && strings.TrimSpace(*request.Icon) != "" {
		icon = strings.ToLower(strings.TrimSpace(*request.Icon))
		if !iconPattern.MatchString(icon) {
			return model.Category{}, fmt.Errorf("%w: unknown icon", ErrInvalidRequest)
		}
	}

	return model.Category{
		Name:      name,
		IsExpense: isExpense,
		IsIncome:  isIncome,
		Color:     color,
		Icon:      icon,
	}, nil
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

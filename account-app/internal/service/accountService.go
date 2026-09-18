package service

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"

	"github.com/PIPILaPUPU/finance-tracking/account-app/internal/model"
	"github.com/PIPILaPUPU/finance-tracking/account-app/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	ErrAccountNotFound = errors.New("account not found")
	ErrInvalidRequest  = errors.New("invalid request")
)

type AccountService struct {
	rep repository.AccountRepository
}

func NewTransactionService(repository repository.AccountRepository) *AccountService {
	return &AccountService{rep: repository}
}

// ======================================SERVICE FUNCTION=============================================
func (s *AccountService) Create(ctx context.Context, userId uuid.UUID, request model.CreateAccountRequest) (model.Account, error) {
	request.Name = strings.TrimSpace(request.Name)
	request.Type = strings.TrimSpace(request.Type)
	request.Currency = strings.TrimSpace(request.Currency)

	err := validateDate(request)
	if err != nil {
		return model.Account{}, fmt.Errorf("%w: %s", ErrInvalidRequest, err.Error())
	}

	Account := model.Account{
		ID:       uuid.New(),
		UserId:   userId,
		Name:     request.Name,
		Type:     request.Type,
		Currency: request.Currency,
		Balance:  request.Balance,
	}

	account, err := s.rep.Create(ctx, userId, Account)
	if err != nil {
		return model.Account{}, err
	}

	return account, nil
}

func (s *AccountService) GetAll(ctx context.Context, userId uuid.UUID) ([]model.Account, error) {
	accounts, err := s.rep.GetAll(ctx, userId)
	if err != nil {
		return nil, err
	}

	return accounts, nil
}

func (s *AccountService) GetByID(ctx context.Context, userId uuid.UUID, accountID uuid.UUID) (model.Account, error) {
	account, err := s.rep.GetById(ctx, userId, accountID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, repository.ErrNotFound) {
			return model.Account{}, ErrAccountNotFound
		}

		return model.Account{}, err
	}

	return account, nil
}

func (s *AccountService) Delete(ctx context.Context, userId uuid.UUID, accountID uuid.UUID) error {
	err := s.rep.Delete(ctx, userId, accountID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, repository.ErrNotFound) {
			return ErrAccountNotFound
		}

		return err
	}

	return nil
}

// ======================================VALIDATION=============================================
func validateDate(req model.CreateAccountRequest) error {
	if req.Name == "" {
		return errors.New("name is required")
	}

	if req.Type == "" {
		return errors.New("type is required")
	}

	if !slices.Contains(AvailableCurrencies, req.Currency) {
		return errors.New("invalid currency")
	}

	if req.Balance <= 0 {
		return errors.New("balance must be greater than 0")
	}

	return nil
}

var AvailableCurrencies = []string{
	"RUB",
	"USD",
	"EUR",
	"GBP",
	"CNY",
	"JPY",
	"CHF",
	"CAD",
	"AUD",
	"NZD",
	"HKD",
	"SGD",
	"KRW",
	"INR",
	"TRY",
	"PLN",
	"CZK",
	"SEK",
	"NOK",
	"DKK",
}

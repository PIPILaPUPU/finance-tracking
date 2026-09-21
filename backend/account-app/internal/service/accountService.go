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
	request.AllocationRule = strings.TrimSpace(strings.ToLower(request.AllocationRule))

	if request.ParentID != nil {
		return s.createSubAccount(ctx, userId, request)
	}

	return s.createRootAccount(ctx, userId, request)
}

func (s *AccountService) createRootAccount(ctx context.Context, userId uuid.UUID, request model.CreateAccountRequest) (model.Account, error) {
	if err := validateRootRequest(request); err != nil {
		return model.Account{}, fmt.Errorf("%w: %s", ErrInvalidRequest, err.Error())
	}

	account := model.Account{
		ID:             uuid.New(),
		UserId:         userId,
		Name:           request.Name,
		Type:           request.Type,
		Currency:       request.Currency,
		Balance:        request.Balance,
		ParentID:       nil,
		AllocationRule: model.AllocationManual,
		Percent:        nil,
	}

	created, err := s.rep.Create(ctx, userId, account)
	if err != nil {
		return model.Account{}, err
	}

	return created, nil
}

func (s *AccountService) createSubAccount(ctx context.Context, userId uuid.UUID, request model.CreateAccountRequest) (model.Account, error) {
	parent, err := s.rep.GetById(ctx, userId, *request.ParentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, repository.ErrNotFound) {
			return model.Account{}, ErrAccountNotFound
		}
		return model.Account{}, err
	}

	if parent.ParentID != nil {
		return model.Account{}, fmt.Errorf("%w: sub-account cannot be nested under another sub-account", ErrInvalidRequest)
	}

	rule := request.AllocationRule
	if rule == "" {
		rule = model.AllocationManual
	}

	if err := validateSubRequest(request, rule); err != nil {
		return model.Account{}, fmt.Errorf("%w: %s", ErrInvalidRequest, err.Error())
	}

	balance, percent, err := resolveSubBalance(parent.Balance, rule, request)
	if err != nil {
		return model.Account{}, fmt.Errorf("%w: %s", ErrInvalidRequest, err.Error())
	}

	existing, err := s.rep.GetByParentID(ctx, userId, parent.ID)
	if err != nil {
		return model.Account{}, err
	}

	allocated := sumEffectiveBalances(existing, parent.Balance)
	if allocated+balance > parent.Balance {
		return model.Account{}, fmt.Errorf(
			"%w: sum of sub-accounts (%d) would exceed parent balance (%d)",
			ErrInvalidRequest,
			allocated+balance,
			parent.Balance,
		)
	}

	account := model.Account{
		ID:             uuid.New(),
		UserId:         userId,
		Name:           request.Name,
		Type:           "subaccount",
		Currency:       parent.Currency,
		Balance:        balance,
		ParentID:       &parent.ID,
		AllocationRule: rule,
		Percent:        percent,
	}

	created, err := s.rep.Create(ctx, userId, account)
	if err != nil {
		return model.Account{}, err
	}

	return applyEffectiveBalance(created, parent.Balance), nil
}

func (s *AccountService) GetAll(ctx context.Context, userId uuid.UUID) ([]model.Account, error) {
	accounts, err := s.rep.GetAll(ctx, userId)
	if err != nil {
		return nil, err
	}

	return applyEffectiveBalances(accounts), nil
}

func (s *AccountService) GetByID(ctx context.Context, userId uuid.UUID, accountID uuid.UUID) (model.Account, error) {
	account, err := s.rep.GetById(ctx, userId, accountID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, repository.ErrNotFound) {
			return model.Account{}, ErrAccountNotFound
		}
		return model.Account{}, err
	}

	if account.ParentID != nil && account.AllocationRule == model.AllocationPercent && account.Percent != nil {
		parent, err := s.rep.GetById(ctx, userId, *account.ParentID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, repository.ErrNotFound) {
				return model.Account{}, ErrAccountNotFound
			}
			return model.Account{}, err
		}
		account = applyEffectiveBalance(account, parent.Balance)
	}

	return account, nil
}

func (s *AccountService) GetSubAccounts(ctx context.Context, userId uuid.UUID, parentID uuid.UUID) ([]model.Account, error) {
	parent, err := s.rep.GetById(ctx, userId, parentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, repository.ErrNotFound) {
			return nil, ErrAccountNotFound
		}
		return nil, err
	}

	if parent.ParentID != nil {
		return nil, fmt.Errorf("%w: account is a sub-account", ErrInvalidRequest)
	}

	subs, err := s.rep.GetByParentID(ctx, userId, parentID)
	if err != nil {
		return nil, err
	}

	for i := range subs {
		subs[i] = applyEffectiveBalance(subs[i], parent.Balance)
	}

	return subs, nil
}

func (s *AccountService) Update(ctx context.Context, userId uuid.UUID, accountID uuid.UUID, request model.UpdateAccountRequest) (model.Account, error) {
	request.Name = strings.TrimSpace(request.Name)
	request.AllocationRule = strings.TrimSpace(strings.ToLower(request.AllocationRule))

	account, err := s.rep.GetById(ctx, userId, accountID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, repository.ErrNotFound) {
			return model.Account{}, ErrAccountNotFound
		}
		return model.Account{}, err
	}

	if request.Name == "" {
		return model.Account{}, fmt.Errorf("%w: name is required", ErrInvalidRequest)
	}

	updated, err := s.rep.UpdateName(ctx, userId, accountID, model.UpdateAccountName{Name: request.Name})
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return model.Account{}, ErrAccountNotFound
		}
		return model.Account{}, err
	}

	allocationTouched := request.AllocationRule != "" || request.Balance > 0 || request.Percent != nil

	if account.ParentID == nil {
		if allocationTouched {
			return model.Account{}, fmt.Errorf("%w: allocation fields are only allowed for sub-accounts", ErrInvalidRequest)
		}
		return updated, nil
	}

	parent, err := s.rep.GetById(ctx, userId, *account.ParentID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) || errors.Is(err, repository.ErrNotFound) {
			return model.Account{}, ErrAccountNotFound
		}
		return model.Account{}, err
	}

	if !allocationTouched {
		return applyEffectiveBalance(updated, parent.Balance), nil
	}

	rule := request.AllocationRule
	if rule == "" {
		rule = updated.AllocationRule
	}

	subReq := model.CreateAccountRequest{
		Name:           request.Name,
		Balance:        request.Balance,
		AllocationRule: rule,
		Percent:        request.Percent,
	}
	if err := validateSubRequest(subReq, rule); err != nil {
		return model.Account{}, fmt.Errorf("%w: %s", ErrInvalidRequest, err.Error())
	}

	balance, percent, err := resolveSubBalance(parent.Balance, rule, subReq)
	if err != nil {
		return model.Account{}, fmt.Errorf("%w: %s", ErrInvalidRequest, err.Error())
	}

	siblings, err := s.rep.GetByParentID(ctx, userId, parent.ID)
	if err != nil {
		return model.Account{}, err
	}

	var allocated int64
	for _, sibling := range siblings {
		if sibling.ID == accountID {
			continue
		}
		allocated += effectiveBalance(sibling, parent.Balance)
	}
	if allocated+balance > parent.Balance {
		return model.Account{}, fmt.Errorf(
			"%w: sum of sub-accounts (%d) would exceed parent balance (%d)",
			ErrInvalidRequest,
			allocated+balance,
			parent.Balance,
		)
	}

	updated, err = s.rep.UpdateSubAccount(ctx, userId, accountID, balance, rule, percent)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return model.Account{}, ErrAccountNotFound
		}
		return model.Account{}, err
	}

	return applyEffectiveBalance(updated, parent.Balance), nil
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
func validateRootRequest(req model.CreateAccountRequest) error {
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

	if req.AllocationRule != "" && req.AllocationRule != model.AllocationManual {
		return errors.New("allocation_rule is only allowed for sub-accounts")
	}

	if req.Percent != nil {
		return errors.New("percent is only allowed for sub-accounts")
	}

	return nil
}

func validateSubRequest(req model.CreateAccountRequest, rule string) error {
	if req.Name == "" {
		return errors.New("name is required")
	}

	switch rule {
	case model.AllocationManual:
		if req.Balance <= 0 {
			return errors.New("balance must be greater than 0")
		}
		if req.Percent != nil {
			return errors.New("percent must be empty for manual allocation")
		}
	case model.AllocationPercent:
		if req.Percent == nil {
			return errors.New("percent is required for percent allocation")
		}
		if *req.Percent < 1 || *req.Percent > 100 {
			return errors.New("percent must be between 1 and 100")
		}
	default:
		return errors.New("allocation_rule must be manual or percent")
	}

	return nil
}

func resolveSubBalance(parentBalance int64, rule string, req model.CreateAccountRequest) (int64, *int, error) {
	switch rule {
	case model.AllocationManual:
		return req.Balance, nil, nil
	case model.AllocationPercent:
		balance := parentBalance * int64(*req.Percent) / 100
		if balance <= 0 {
			return 0, nil, errors.New("percent of parent balance must be greater than 0")
		}
		percent := *req.Percent
		return balance, &percent, nil
	default:
		return 0, nil, errors.New("allocation_rule must be manual or percent")
	}
}

func effectiveBalance(account model.Account, parentBalance int64) int64 {
	if account.AllocationRule == model.AllocationPercent && account.Percent != nil {
		return parentBalance * int64(*account.Percent) / 100
	}
	return account.Balance
}

func applyEffectiveBalance(account model.Account, parentBalance int64) model.Account {
	account.Balance = effectiveBalance(account, parentBalance)
	return account
}

func applyEffectiveBalances(accounts []model.Account) []model.Account {
	byID := make(map[uuid.UUID]model.Account, len(accounts))
	for _, account := range accounts {
		byID[account.ID] = account
	}

	result := make([]model.Account, len(accounts))
	for i, account := range accounts {
		if account.ParentID != nil {
			if parent, ok := byID[*account.ParentID]; ok {
				account = applyEffectiveBalance(account, parent.Balance)
			}
		}
		result[i] = account
	}

	return result
}

func sumEffectiveBalances(subs []model.Account, parentBalance int64) int64 {
	var total int64
	for _, sub := range subs {
		total += effectiveBalance(sub, parentBalance)
	}
	return total
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

package service

import (
	"context"
	"errors"

	"github.com/PIPILaPUPU/finance-tracking/transaction-app/internal/model"
	"github.com/google/uuid"
)

var (
	ErrInvalidTransactionType = errors.New("invalid transaction type")
	ErrInvalidAmount          = errors.New("amount must be greater than zero")
	ErrInvalidTransaction     = errors.New("invalid transaction")
	ErrTransactionNotFound    = errors.New("transaction not found")
)

type TransactionRepository interface {
	Create(context.Context, model.Transaction) (model.Transaction, error)
	GetAll(context.Context, uuid.UUID) ([]model.Transaction, error)
	GetById(context.Context, uuid.UUID, uuid.UUID) (model.Transaction, error)
}

type TransactionService struct {
	repository TransactionRepository
}

func NewTransactionService(rep TransactionRepository) *TransactionService {
	return &TransactionService{repository: rep}
}

// =================================SERVICE FUNCTION=======================================
func (s *TransactionService) Create(ctx context.Context, userID uuid.UUID, req model.CreateTransactionRequest) (model.Transaction, error) {
	if req.Amount <= 0 {
		return model.Transaction{}, ErrInvalidAmount
	}

	switch req.Type {
	case "expanse":
		if req.FromAccountID == nil {
			return model.Transaction{}, ErrInvalidTransaction
		}
	case "income":
		if req.ToAccountID == nil {
			return model.Transaction{}, ErrInvalidTransaction
		}
	case "transfer":
		if req.FromAccountID == nil || req.ToAccountID == nil {
			return model.Transaction{}, ErrInvalidTransaction
		}
		if *req.FromAccountID == *req.ToAccountID {
			return model.Transaction{}, ErrInvalidTransaction
		}
	default:
		return model.Transaction{}, ErrInvalidTransactionType
	}

	transaction := model.Transaction{
		Id:              uuid.New(),
		User_id:         userID,
		Type:            req.Type,
		From_account_id: derefUUID(req.FromAccountID),
		To_account_id:   derefUUID(req.ToAccountID),
		Category_id:     derefUUID(req.CategoryID),
		Amount:          req.Amount,
		Description:     req.Description,
	}

	return s.repository.Create(ctx, transaction)
}

func (s *TransactionService) GetAll(ctx context.Context, userID uuid.UUID) ([]model.Transaction, error) {
	return s.repository.GetAll(ctx, userID)
}

func (s *TransactionService) GetById(ctx context.Context, userID uuid.UUID, transactionID uuid.UUID) (model.Transaction, error) {
	return s.repository.GetById(ctx, userID, transactionID)
}

func derefUUID(id *uuid.UUID) uuid.UUID {
	if id == nil {
		return uuid.Nil
	}
	return *id
}

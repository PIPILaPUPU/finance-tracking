package model

import (
	"time"

	"github.com/google/uuid"
)

type Transaction struct {
	Id              uuid.UUID `json:"id"`
	User_id         uuid.UUID `json:"user_id"`
	Type            string    `json:"type"`
	From_account_id uuid.UUID `json:"from_account_id"`
	To_account_id   uuid.UUID `json:"to_account_id"`
	Category_id     uuid.UUID `json:"category_id"`
	Amount          int64     `json:"amount"`
	Description     string    `json:"description"`
	Created_at      time.Time `json:"created_at"`
}

type CreateTransactionRequest struct {
	Type          string     `json:"type"`
	FromAccountID *uuid.UUID `json:"from_account_id"`
	ToAccountID   *uuid.UUID `json:"to_account_id"`
	CategoryID    *uuid.UUID `json:"category_id"`
	Amount        int64      `json:"amount"`
	Description   string     `json:"description"`
}

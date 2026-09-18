package model

import (
	"time"

	"github.com/google/uuid"
)

type Account struct {
	ID         uuid.UUID `json:"id"`
	UserId     uuid.UUID `json:"userid"`
	Name       string    `json:"name"`
	Type       string    `json:"type"`
	Currency   string    `json:"currency"`
	Balance    int64     `json:"balance"`
	Created_at time.Time `json:"created_at"`
	Updated_at time.Time `json:"updated_at"`
}

type CreateAccountRequest struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	Currency string `json:"currency"`
	Balance  int64  `json:"balance"`
}

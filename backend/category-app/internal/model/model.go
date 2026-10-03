package model

import (
	"time"

	"github.com/google/uuid"
)

type Category struct {
	ID         uuid.UUID `json:"id"`
	User       uuid.UUID `json:"userid"`
	Name       string    `json:"name"`
	IsExpense  bool      `json:"is_expense"`
	IsIncome   bool      `json:"is_income"`
	Color      string    `json:"color"`
	Icon       string    `json:"icon"`
	Created_at time.Time `json:"created_at"`
	Updated_at time.Time `json:"updated_at"`
}

// Flags and style are pointers so an omitted field keeps its default instead of
// being read as "expense only" / empty style.
type CreateUpdateCategoryRequst struct {
	Name      string  `json:"name"`
	IsExpense *bool   `json:"is_expense"`
	IsIncome  *bool   `json:"is_income"`
	Color     *string `json:"color"`
	Icon      *string `json:"icon"`
}

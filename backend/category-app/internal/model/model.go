package model

import (
	"time"

	"github.com/google/uuid"
)

type Category struct {
	ID         uuid.UUID `json:"id"`
	User       uuid.UUID `json:"userid"`
	Name       string    `json:"name"`
	Created_at time.Time `json:"created_at"`
	Updated_at time.Time `json:"updated_at"`
}

type CreateUpdateCategoryRequst struct {
	Name string `json:"name"`
}

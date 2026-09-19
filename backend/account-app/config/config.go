package config

import (
	"errors"
	"os"
	"strings"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig `yaml:"server"`
	Database DBConfig     `yaml:"database"`
	JWT      JWTConfig    `yaml:"jwt"`
}

type ServerConfig struct {
	Port string `yaml:"portAccounts"`
}

type DBConfig struct {
	URL string `yaml:"url"`
}

type JWTConfig struct {
	Secret string `yaml:"secret"`
	Issuer string `yaml:"issuer"`
}

func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg Config

	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	cfg.applyEnvOverrides()

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return &cfg, nil
}

func (c *Config) applyEnvOverrides() {
	if value := strings.TrimSpace(os.Getenv("SERVER_PORT")); value != "" {
		c.Server.Port = value
	}

	if value := strings.TrimSpace(os.Getenv("DATABASE_URL")); value != "" {
		c.Database.URL = value
	}

	if value := strings.TrimSpace(os.Getenv("JWT_SECRET")); value != "" {
		c.JWT.Secret = value
	}

	if value := strings.TrimSpace(os.Getenv("JWT_ISSUER")); value != "" {
		c.JWT.Issuer = value
	}
}

func (c *Config) validate() error {
	if c.Database.URL == "" {
		return errors.New("database url is required")
	}

	if c.JWT.Secret == "" {
		return errors.New("jwt secret is required")
	}

	if len(c.JWT.Secret) < 32 {
		return errors.New("jwt secret must be >= 32 characters")
	}

	if c.JWT.Issuer == "" {
		c.JWT.Issuer = "auth-app"
	}

	if c.Server.Port == "" {
		c.Server.Port = "8080"
	}

	return nil
}

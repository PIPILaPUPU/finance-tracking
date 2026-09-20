package config

import (
	"fmt"
	"os"
	"strings"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	JWT      JWTConfig      `yaml:"jwt"`
}

type ServerConfig struct {
	Port string `yaml:"portTransaction"`
}

type DatabaseConfig struct {
	URL string `yaml:"url"`
}

type JWTConfig struct {
	Secret string `yaml:"secret"`
	Issuer string `yaml:"issuer"`
}

func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config file: %w", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parse config file: %w", err)
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
		return fmt.Errorf("database.url is required")
	}
	if len(c.JWT.Secret) < 32 {
		return fmt.Errorf("jwt.secret must be at least 32 characters long")
	}
	if c.JWT.Issuer == "" {
		c.JWT.Issuer = "auth-app"
	}
	if c.Server.Port == "" {
		c.Server.Port = "8082"
	}
	return nil
}

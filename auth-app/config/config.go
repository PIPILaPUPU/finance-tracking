package config

import (
	"errors"
	"os"
	"strconv"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig `yaml:"server"`
	Database DBconfig     `yaml:"database"`
	JWT      JWTconfig    `yaml:"jwt"`
}

type ServerConfig struct {
	Port string `yaml:"port"`
}

type DBconfig struct {
	Url string `yaml:"url"`
}

type JWTconfig struct {
	Secret     string        `yaml:"secret"`
	Issuer     string        `yaml:"issuer"`
	AccessTTL  time.Duration `yaml:"access_ttl"`
	RefreshTTL time.Duration `yaml:"refresh_ttl"`
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
		c.Database.Url = value
	}
	if value := strings.TrimSpace(os.Getenv("JWT_SECRET")); value != "" {
		c.JWT.Secret = value
	}
	if value := strings.TrimSpace(os.Getenv("JWT_ISSUER")); value != "" {
		c.JWT.Issuer = value
	}
	if value := strings.TrimSpace(os.Getenv("JWT_ACCESS_TTL")); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			c.JWT.AccessTTL = d
		}
	}
	if value := strings.TrimSpace(os.Getenv("JWT_REFRESH_TTL")); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			c.JWT.RefreshTTL = d
		}
	}
}

func (c *Config) validate() error {
	if c.Database.Url == "" {
		return errors.New("need database url")
	}

	if c.JWT.Secret == "" {
		return errors.New("jwt secret is required")
	}
	if len(c.JWT.Secret) < 32 {
		return errors.New("jwt secret must be >= 32")
	}

	if c.JWT.Issuer == "" {
		c.JWT.Issuer = "auth-app"
	}

	if c.Server.Port == "" {
		c.Server.Port = "8080"
	}

	if c.JWT.AccessTTL <= 0 {
		c.JWT.AccessTTL = 15 * time.Minute
	}
	if c.JWT.RefreshTTL <= 0 {
		c.JWT.RefreshTTL = 7 * 24 * time.Hour
	}

	return nil
}

func parseDurationOrZero(value string) time.Duration {
	if value == "" {
		return 0
	}

	if d, err := time.ParseDuration(value); err == nil {
		return d
	}

	if seconds, err := strconv.Atoi(value); err == nil {
		return time.Duration(seconds) * time.Second
	}

	return 0
}

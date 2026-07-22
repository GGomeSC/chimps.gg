package chimps

import (
	"errors"
	"fmt"
	"os"
	"strings"
)

const minimumSecretBytes = 32

type Config struct {
	DatabaseURL           string
	InternalServiceSecret string
	NKAPIRoot             string
}

func ConfigFromEnvironment() Config {
	return Config{
		DatabaseURL:           strings.TrimSpace(os.Getenv("DATABASE_URL")),
		InternalServiceSecret: os.Getenv("INTERNAL_SERVICE_SECRET"),
		NKAPIRoot:             strings.TrimRight(strings.TrimSpace(os.Getenv("NK_API_ROOT")), "/"),
	}
}

func (c Config) validateNKAPI() error {
	if c.NKAPIRoot == "" {
		return errors.New("NK_API_ROOT is required")
	}
	if !strings.HasPrefix(c.NKAPIRoot, "https://") {
		return errors.New("NK_API_ROOT must use HTTPS")
	}
	return nil
}

func (c Config) validateSecret() error {
	if len([]byte(c.InternalServiceSecret)) < minimumSecretBytes {
		return fmt.Errorf("INTERNAL_SERVICE_SECRET must contain at least %d bytes", minimumSecretBytes)
	}

	return nil
}

func (c Config) validateDatabase() error {
	if c.DatabaseURL == "" {
		return errors.New("DATABASE_URL is required")
	}

	return nil
}

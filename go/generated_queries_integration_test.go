package chimps

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/GGomeSC/chimps.gg/go/generated/db"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestGeneratedHealthQueryAgainstPostgres(t *testing.T) {
	databaseURL := os.Getenv("INTEGRATION_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("INTEGRATION_DATABASE_URL is not configured")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatalf("create integration pool: %v", err)
	}
	defer pool.Close()

	ok, err := db.New(pool).Health(ctx)
	if err != nil {
		t.Fatalf("execute generated health query: %v", err)
	}
	if ok != 1 {
		t.Fatalf("health query returned %d, want 1", ok)
	}
}

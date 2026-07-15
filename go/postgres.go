package chimps

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/GGomeSC/chimps.gg/go/generated/db"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	acquireTimeout   = 2 * time.Second
	statementTimeout = 5 * time.Second
)

type databaseMetrics struct {
	AcquireDuration time.Duration
	QueryCount      int
}

type healthChecker interface {
	Check(context.Context) (databaseMetrics, error)
}

type postgresStore struct {
	pool *pgxpool.Pool
}

func newPostgresStore(ctx context.Context, databaseURL string) (*postgresStore, error) {
	poolConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, errors.New("invalid database configuration")
	}

	if poolConfig.ConnConfig.Port != 6543 {
		return nil, fmt.Errorf("DATABASE_URL must use Supavisor transaction mode on port 6543")
	}
	if poolConfig.ConnConfig.TLSConfig == nil {
		return nil, errors.New("DATABASE_URL must enable TLS")
	}

	poolConfig.MinConns = 0
	poolConfig.MaxConns = 2
	poolConfig.MaxConnLifetime = 10 * time.Minute
	poolConfig.MaxConnLifetimeJitter = time.Minute
	poolConfig.MaxConnIdleTime = time.Minute
	poolConfig.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeExec
	poolConfig.ConnConfig.StatementCacheCapacity = 0
	poolConfig.ConnConfig.DescriptionCacheCapacity = 0
	poolConfig.ConnConfig.RuntimeParams["statement_timeout"] = "5000"

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, errors.New("could not initialize database pool")
	}

	return &postgresStore{pool: pool}, nil
}

func (s *postgresStore) Check(ctx context.Context) (databaseMetrics, error) {
	metrics := databaseMetrics{}
	acquireContext, cancelAcquire := context.WithTimeout(ctx, acquireTimeout)
	defer cancelAcquire()

	acquireStarted := time.Now()
	connection, err := s.pool.Acquire(acquireContext)
	metrics.AcquireDuration = time.Since(acquireStarted)
	if err != nil {
		return metrics, errors.New("database unavailable")
	}
	defer connection.Release()

	queryContext, cancelQuery := context.WithTimeout(ctx, statementTimeout)
	defer cancelQuery()

	metrics.QueryCount = 1
	ok, err := db.New(connection).Health(queryContext)
	if err != nil || ok != 1 {
		return metrics, errors.New("database health check failed")
	}

	return metrics, nil
}

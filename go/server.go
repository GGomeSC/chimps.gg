package chimps

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	chimpsapi "github.com/GGomeSC/chimps.gg/go/generated/api"
)

type server struct {
	stubServer
	health         healthChecker
	databaseErr    error
	internalSecret []byte
	logger         *slog.Logger
}

type requestMetricsKey struct{}

type requestMetrics struct {
	acquireDuration time.Duration
	queryCount      int
}

type responseRecorder struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (r *responseRecorder) WriteHeader(status int) {
	if r.status != 0 {
		return
	}
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func (r *responseRecorder) Write(body []byte) (int, error) {
	if r.status == 0 {
		r.WriteHeader(http.StatusOK)
	}
	written, err := r.ResponseWriter.Write(body)
	r.bytes += written
	return written, err
}

func NewHandlerFromEnvironment() http.Handler {
	config := ConfigFromEnvironment()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	if err := config.validateSecret(); err != nil {
		return unavailableHandler(logger, err)
	}

	var checker healthChecker
	var databaseErr error
	if err := config.validateDatabase(); err != nil {
		databaseErr = err
	} else {
		checker, databaseErr = newPostgresStore(context.Background(), config.DatabaseURL)
	}

	return newHandler(config.InternalServiceSecret, checker, databaseErr, logger)
}

func newHandler(secret string, checker healthChecker, databaseErr error, logger *slog.Logger) http.Handler {
	service := &server{
		health:         checker,
		databaseErr:    databaseErr,
		internalSecret: []byte(secret),
		logger:         logger,
	}

	return chimpsapi.HandlerWithOptions(service, chimpsapi.StdHTTPServerOptions{
		Middlewares: []chimpsapi.MiddlewareFunc{
			service.authorizationMiddleware,
			service.loggingMiddleware,
		},
		ErrorHandlerFunc: func(w http.ResponseWriter, _ *http.Request, _ error) {
			writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request.")
		},
	})
}

func unavailableHandler(logger *slog.Logger, configurationErr error) http.Handler {
	logger.Error("chimps service configuration is invalid", "error", configurationErr.Error())
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		writeError(w, http.StatusServiceUnavailable, "service_unavailable", "Service unavailable.")
	})
}

func (s *server) GetHealth(w http.ResponseWriter, r *http.Request) {
	if s.databaseErr != nil || s.health == nil {
		writeError(w, http.StatusServiceUnavailable, "database_unavailable", "Database unavailable.")
		return
	}

	metrics, err := s.health.Check(r.Context())
	if requestData, ok := r.Context().Value(requestMetricsKey{}).(*requestMetrics); ok {
		requestData.acquireDuration = metrics.AcquireDuration
		requestData.queryCount = metrics.QueryCount
	}
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, "database_unavailable", "Database unavailable.")
		return
	}

	writeJSON(w, http.StatusOK, chimpsapi.HealthResponse{Ok: true})
}

func (s *server) authorizationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		const prefix = "Bearer "
		authorization := r.Header.Get("Authorization")
		if !strings.HasPrefix(authorization, prefix) || !constantTimeEqual([]byte(strings.TrimPrefix(authorization, prefix)), s.internalSecret) {
			writeError(w, http.StatusUnauthorized, "unauthorized", "Unauthorized.")
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *server) loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		metrics := &requestMetrics{}
		recorder := &responseRecorder{ResponseWriter: w}

		next.ServeHTTP(recorder, r.WithContext(context.WithValue(r.Context(), requestMetricsKey{}, metrics)))

		s.logger.Info("chimps request",
			"operation", r.Method+" "+r.URL.Path,
			"duration_ms", time.Since(started).Milliseconds(),
			"acquire_ms", metrics.acquireDuration.Milliseconds(),
			"query_count", metrics.queryCount,
			"response_bytes", recorder.bytes,
			"status", recorder.status,
		)
	})
}

func constantTimeEqual(provided []byte, expected []byte) bool {
	providedHash := sha256.Sum256(provided)
	expectedHash := sha256.Sum256(expected)
	return subtle.ConstantTimeCompare(providedHash[:], expectedHash[:]) == 1
}

func writeError(w http.ResponseWriter, status int, code string, message string) {
	writeJSON(w, status, chimpsapi.ErrorResponse{Code: code, Message: message})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

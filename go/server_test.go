package chimps

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

const testSecret = "0123456789abcdef0123456789abcdef"

type fakeHealthChecker struct {
	metrics databaseMetrics
	err     error
}

func (f fakeHealthChecker) Check(context.Context) (databaseMetrics, error) {
	return f.metrics, f.err
}

func TestHandlerRequiresBearerSecret(t *testing.T) {
	t.Parallel()

	handler := testHandler(fakeHealthChecker{}, nil)
	for _, authorization := range []string{"", "Bearer wrong-secret"} {
		request := httptest.NewRequest(http.MethodGet, "/health", nil)
		request.Header.Set("Authorization", authorization)
		response := httptest.NewRecorder()

		handler.ServeHTTP(response, request)

		if response.Code != http.StatusUnauthorized {
			t.Fatalf("authorization %q returned %d, want %d", authorization, response.Code, http.StatusUnauthorized)
		}
		if body := response.Body.String(); body != "{\"code\":\"unauthorized\",\"message\":\"Unauthorized.\"}\n" {
			t.Fatalf("unexpected response body: %s", body)
		}
	}
}

func TestHealthChecksDatabase(t *testing.T) {
	t.Parallel()

	handler := testHandler(fakeHealthChecker{
		metrics: databaseMetrics{AcquireDuration: 25 * time.Millisecond, QueryCount: 1},
	}, nil)
	request := authorizedRequest(http.MethodGet, "/health")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("health returned %d, want %d", response.Code, http.StatusOK)
	}
	if body := response.Body.String(); body != "{\"ok\":true}\n" {
		t.Fatalf("unexpected response body: %s", body)
	}
}

func TestHealthDoesNotExposeDatabaseErrors(t *testing.T) {
	t.Parallel()

	handler := testHandler(fakeHealthChecker{err: errors.New("password authentication failed for user admin")}, nil)
	request := authorizedRequest(http.MethodGet, "/health")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("health returned %d, want %d", response.Code, http.StatusServiceUnavailable)
	}
	if strings.Contains(response.Body.String(), "password") {
		t.Fatalf("database error leaked in response: %s", response.Body.String())
	}
}

func TestUnportedOperationReturnsAuthenticatedStub(t *testing.T) {
	t.Parallel()

	handler := testHandler(fakeHealthChecker{}, nil)
	request := authorizedRequest(http.MethodGet, "/public/maps")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusNotImplemented {
		t.Fatalf("stub returned %d, want %d", response.Code, http.StatusNotImplemented)
	}
	if body := response.Body.String(); body != "{\"code\":\"not_implemented\",\"message\":\"Operation not implemented.\"}\n" {
		t.Fatalf("unexpected response body: %s", body)
	}
}

func TestConfigurationRequiresLongSecret(t *testing.T) {
	t.Parallel()

	if err := (Config{InternalServiceSecret: "short"}).validateSecret(); err == nil {
		t.Fatal("short secret was accepted")
	}
	if err := (Config{InternalServiceSecret: testSecret}).validateSecret(); err != nil {
		t.Fatalf("valid secret was rejected: %v", err)
	}
}

func testHandler(checker healthChecker, databaseErr error) http.Handler {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	return newHandler(testSecret, checker, databaseErr, logger)
}

func authorizedRequest(method string, path string) *http.Request {
	request := httptest.NewRequest(method, path, nil)
	request.Header.Set("Authorization", "Bearer "+testSecret)
	return request
}

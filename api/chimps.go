package handler

import (
	"net/http"
	"sync"

	chimps "github.com/GGomeSC/chimps.gg/go"
)

var (
	service     http.Handler
	serviceOnce sync.Once
)

func Handler(w http.ResponseWriter, r *http.Request) {
	serviceOnce.Do(func() {
		service = chimps.NewHandlerFromEnvironment()
	})

	route := r.URL.Query().Get("route")
	if route != "" {
		request := r.Clone(r.Context())
		request.URL.Path = route
		query := request.URL.Query()
		query.Del("route")
		request.URL.RawQuery = query.Encode()
		r = request
	}

	service.ServeHTTP(w, r)
}

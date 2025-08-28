package main

import (
	"crypto/tls"
	_ "embed"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "embed"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/ztkent/dev-tools/internal/routes"
	"github.com/ztkent/replay"
)

//go:embed certs/tools_cert.pem
var certPEM []byte

//go:embed certs/tools_key.pem
var keyPEM []byte

func main() {
	// Initialize router and middleware
	r := chi.NewRouter()
	// Log request and recover from panics
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Define routes
	DefineRoutes(r, replay.NewCache(
		replay.WithMaxSize(100),
		replay.WithMaxMemory(1024*1024*1024*100),
		replay.WithEvictionPolicy("LRU"),
		replay.WithTTL(6*time.Hour),
		replay.WithMaxTTL(24*time.Hour),
		replay.WithCacheFilters([]string{"URL", "Method"}),
		replay.WithLogger(log.New(os.Stdout, "replay: ", log.LstdFlags)),
	))

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8087" // Default port
	}

	fmt.Println("Starting server on port", port)
	if os.Getenv("ENV") == "dev" {
		// Development mode - serve HTTP only
		log.Fatal(http.ListenAndServe(":"+port, r))
	} else {
		// Production mode - serve HTTPS with embedded certificates
		cert, err := tls.X509KeyPair(certPEM, keyPEM)
		if err != nil {
			log.Fatal("Failed to load embedded certificates:", err)
		}
		tlsConfig := &tls.Config{
			Certificates: []tls.Certificate{cert},
		}
		server := &http.Server{
			Addr:      ":" + port,
			Handler:   r,
			TLSConfig: tlsConfig,
		}
		log.Fatal(server.ListenAndServeTLS("", ""))
	}
}

func DefineRoutes(r *chi.Mux, cache *replay.Cache) {
	// Apply visitor tracking middleware
	r.Use(routes.TagVistorsMiddleware)

	// Static routes
	r.Get("/", routes.HomePageHandler())
	r.Get("/static/*", routes.StaticFileHandler())

	// Tool page routes (for direct URL access)
	r.Get("/unix-time", routes.ToolPageHandler("unix-time"))
	r.Get("/json-validator", routes.ToolPageHandler("json-validator"))
	r.Get("/ip", routes.ToolPageHandler("ip"))
	r.Get("/css-linter", routes.ToolPageHandler("css-linter"))
	r.Get("/dns-leak", routes.ToolPageHandler("dns-leak"))

	// Dynamically load tool content
	r.Get("/tools/unix-time", routes.ToolContentHandler("unix-time"))
	r.Get("/tools/json-validator", routes.ToolContentHandler("json-validator"))
	r.Get("/tools/ip", routes.ToolContentHandler("ip"))
	r.Get("/tools/css-linter", routes.ToolContentHandler("css-linter"))
	r.Get("/tools/dns-leak", routes.ToolContentHandler("dns-leak"))
	r.Get("/tools/index", routes.ToolContentHandler("index"))

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Register IP/DNS API routes
		routes.RegisterIPAPIRoutes(r, cache)
	})
}

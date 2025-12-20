// Package server provides the HTTP server for the web UI.
package server

import (
	"embed"
	"fmt"
	"html/template"
	"io/fs"
	"log/slog"
	"net/http"

	"github.com/rmrfslashbin/manuals-webui/internal/client"
)

//go:embed templates/*.html templates/**/*.html
var templatesFS embed.FS

//go:embed static/*
var staticFS embed.FS

// Config holds the server configuration.
type Config struct {
	Client *client.Client
	Logger *slog.Logger
}

// Server is the web UI server.
type Server struct {
	client       *client.Client
	logger       *slog.Logger
	baseTemplate *template.Template
	funcMap      template.FuncMap
	mdRenderer   *MarkdownRenderer
}

// New creates a new server instance.
func New(cfg Config) *Server {
	// Initialize markdown renderer
	mdRenderer := newMarkdownRenderer()

	// Create function map for templates
	funcMap := template.FuncMap{
		"formatBytes":    formatBytes,
		"truncate":       truncate,
		"add":            func(a, b int) int { return a + b },
		"multiply":       func(a, b interface{}) float64 {
			// Handle different numeric types for template multiplication
			var af, bf float64
			switch v := a.(type) {
			case float32:
				af = float64(v)
			case float64:
				af = v
			case int:
				af = float64(v)
			default:
				af = 0
			}
			switch v := b.(type) {
			case float32:
				bf = float64(v)
			case float64:
				bf = v
			case int:
				bf = float64(v)
			default:
				bf = 0
			}
			return af * bf
		},
		"markdown":       mdRenderer.RenderMarkdown,
		"markdownInline": mdRenderer.RenderMarkdownInline,
	}

	// Parse base template only
	baseTemplate := template.Must(template.New("").Funcs(funcMap).ParseFS(templatesFS, "templates/base.html"))

	return &Server{
		client:       cfg.Client,
		logger:       cfg.Logger,
		baseTemplate: baseTemplate,
		funcMap:      funcMap,
		mdRenderer:   mdRenderer,
	}
}

// Handler returns the HTTP handler for the server.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()

	// Static files
	staticContent, _ := fs.Sub(staticFS, "static")
	mux.Handle("GET /static/", http.StripPrefix("/static/", http.FileServer(http.FS(staticContent))))

	// Health check proxy (no auth required)
	mux.HandleFunc("GET /health", s.handleHealth)

	// Configuration pages
	mux.HandleFunc("GET /setup", s.handleSetup)
	mux.HandleFunc("GET /settings", s.handleSettings)

	// Pages
	mux.HandleFunc("GET /", s.handleHome)
	mux.HandleFunc("GET /devices", s.handleDevices)
	mux.HandleFunc("GET /devices/{id}", s.handleDevice)
	mux.HandleFunc("GET /search", s.handleSearch)
	mux.HandleFunc("GET /documents", s.handleDocuments)

	// htmx partials
	mux.HandleFunc("GET /partials/devices", s.handleDevicesPartial)
	mux.HandleFunc("GET /partials/search-results", s.handleSearchResultsPartial)

	// Document proxy (to add auth header)
	mux.HandleFunc("GET /download/{id}", s.handleDownload)

	// Admin pages
	mux.HandleFunc("GET /admin", s.handleAdmin)
	mux.HandleFunc("GET /admin/users", s.handleAdminUsers)
	mux.HandleFunc("POST /admin/users", s.handleAdminCreateUser)
	mux.HandleFunc("DELETE /admin/users/{id}", s.handleAdminDeleteUser)
	mux.HandleFunc("POST /admin/users/{id}/rotate-key", s.handleAdminRotateKey)
	mux.HandleFunc("GET /admin/settings", s.handleAdminSettings)
	mux.HandleFunc("PUT /admin/settings/{key}", s.handleAdminUpdateSetting)
	mux.HandleFunc("GET /admin/reindex", s.handleAdminReindex)
	mux.HandleFunc("POST /admin/reindex", s.handleAdminTriggerReindex)
	mux.HandleFunc("GET /admin/reindex/status", s.handleAdminReindexStatus)

	return s.loggingMiddleware(mux)
}

func (s *Server) loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		s.logger.Debug("request", "method", r.Method, "path", r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

// Helper functions for templates
func formatBytes(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	units := []string{"KB", "MB", "GB", "TB"}
	return fmt.Sprintf("%.1f %s", float64(b)/float64(div), units[exp])
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-3] + "..."
}


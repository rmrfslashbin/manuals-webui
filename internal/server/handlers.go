package server

import (
	"fmt"
	"html/template"
	"io"
	"net/http"
	"strconv"

	"github.com/rmrfslashbin/manuals-webui/internal/client"
)

// Page data structures
type pageData struct {
	Title   string
	Content interface{}
}


type homeData struct {
	Status interface{}
}

type devicesData struct {
	Devices interface{}
	Domain  string
	Type    string
	Page    int
	Total   int
}

type deviceData struct {
	Device    interface{}
	Pinout    interface{}
	Specs     interface{}
	Documents interface{}
}

// UnifiedSearchResult is a common format for both keyword and semantic search results
type UnifiedSearchResult struct {
	DeviceID string
	Name     string
	Domain   string
	Type     string
	Score    float64
	Snippet  string // Content preview (from Snippet or Content field)
}

type searchData struct {
	Query          string
	Mode           string // "keyword" or "semantic"
	Results        []UnifiedSearchResult
	SemanticError  string // Set if semantic search fails (e.g., not enabled)
}

type documentsData struct {
	Documents interface{}
	Page      int
	Total     int
}

type adminData struct {
	Status interface{}
}

type usersData struct {
	Users     interface{}
	NewAPIKey string
}

type settingsData struct {
	Settings interface{}
}

// Page handlers

// Configuration pages
func (s *Server) handleSetup(w http.ResponseWriter, r *http.Request) {
	s.render(w, "setup.html", pageData{
		Title: "Setup - Manuals",
	})
}

func (s *Server) handleSettings(w http.ResponseWriter, r *http.Request) {
	s.render(w, "settings.html", pageData{
		Title: "Settings - Manuals",
	})
}

func (s *Server) handleHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	status, err := s.client.GetStatus()
	if err != nil {
		s.renderError(w, "Failed to get status", err)
		return
	}

	s.render(w, "home.html", pageData{
		Title:   "Home",
		Content: homeData{Status: status},
	})
}

func (s *Server) handleDevices(w http.ResponseWriter, r *http.Request) {
	domain := r.URL.Query().Get("domain")
	deviceType := r.URL.Query().Get("type")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit := 20
	offset := (page - 1) * limit

	devices, err := s.client.ListDevices(limit, offset, domain, deviceType)
	if err != nil {
		s.renderError(w, "Failed to list devices", err)
		return
	}

	s.render(w, "devices.html", pageData{
		Title: "Devices",
		Content: devicesData{
			Devices: devices.Data,
			Domain:  domain,
			Type:    deviceType,
			Page:    page,
			Total:   devices.Total,
		},
	})
}

func (s *Server) handleDevice(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	device, err := s.client.GetDevice(id, true)
	if err != nil {
		s.renderError(w, "Failed to get device", err)
		return
	}

	pinout, _ := s.client.GetDevicePinout(id)
	specs, _ := s.client.GetDeviceSpecs(id)
	docs, _ := s.client.ListDocuments(50, 0, id)

	var documents interface{}
	if docs != nil {
		documents = docs.Data
	}

	s.render(w, "device.html", pageData{
		Title: device.Name,
		Content: deviceData{
			Device:    device,
			Pinout:    pinout,
			Specs:     specs,
			Documents: documents,
		},
	})
}

func (s *Server) handleSearch(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	mode := r.URL.Query().Get("mode")
	if mode == "" {
		mode = "semantic" // Default to semantic search
	}

	var results []UnifiedSearchResult
	var semanticError string

	if query != "" {
		if mode == "semantic" {
			resp, err := s.client.SemanticSearch(query, 50, "", "")
			if err != nil {
				// If semantic search fails, fall back to keyword search with a notice
				semanticError = err.Error()
				keywordResp, keywordErr := s.client.Search(query, 50, "", "")
				if keywordErr != nil {
					s.renderError(w, "Search failed", keywordErr)
					return
				}
				results = convertKeywordResults(keywordResp.Results)
				mode = "keyword" // Reset mode since we fell back
			} else {
				results = convertSemanticResults(resp.Results)
			}
		} else {
			resp, err := s.client.Search(query, 50, "", "")
			if err != nil {
				s.renderError(w, "Search failed", err)
				return
			}
			results = convertKeywordResults(resp.Results)
		}
	}

	s.render(w, "search.html", pageData{
		Title: "Search",
		Content: searchData{
			Query:         query,
			Mode:          mode,
			Results:       results,
			SemanticError: semanticError,
		},
	})
}

// convertKeywordResults converts keyword search results to unified format
func convertKeywordResults(results []client.SearchResult) []UnifiedSearchResult {
	unified := make([]UnifiedSearchResult, len(results))
	for i, r := range results {
		unified[i] = UnifiedSearchResult{
			DeviceID: r.DeviceID,
			Name:     r.Name,
			Domain:   r.Domain,
			Type:     r.Type,
			Score:    r.Score,
			Snippet:  r.Snippet,
		}
	}
	return unified
}

// convertSemanticResults converts semantic search results to unified format
func convertSemanticResults(results []client.SemanticSearchResult) []UnifiedSearchResult {
	unified := make([]UnifiedSearchResult, len(results))
	for i, r := range results {
		unified[i] = UnifiedSearchResult{
			DeviceID: r.DeviceID,
			Name:     r.Name,
			Domain:   r.Domain,
			Type:     r.Type,
			Score:    float64(r.Score),
			Snippet:  r.Content,
		}
	}
	return unified
}

func (s *Server) handleDocuments(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit := 20
	offset := (page - 1) * limit

	docs, err := s.client.ListDocuments(limit, offset, "")
	if err != nil {
		s.renderError(w, "Failed to list documents", err)
		return
	}

	s.render(w, "documents.html", pageData{
		Title: "Documents",
		Content: documentsData{
			Documents: docs.Data,
			Page:      page,
			Total:     docs.Total,
		},
	})
}

// htmx partial handlers

func (s *Server) handleDevicesPartial(w http.ResponseWriter, r *http.Request) {
	domain := r.URL.Query().Get("domain")
	deviceType := r.URL.Query().Get("type")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit := 20
	offset := (page - 1) * limit

	devices, err := s.client.ListDevices(limit, offset, domain, deviceType)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	s.renderPartial(w, "partials/device-list.html", devicesData{
		Devices: devices.Data,
		Domain:  domain,
		Type:    deviceType,
		Page:    page,
		Total:   devices.Total,
	})
}

func (s *Server) handleSearchResultsPartial(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	mode := r.URL.Query().Get("mode")
	if mode == "" {
		mode = "semantic"
	}

	if query == "" {
		w.Write([]byte(""))
		return
	}

	var results []UnifiedSearchResult
	var semanticError string

	if mode == "semantic" {
		resp, err := s.client.SemanticSearch(query, 50, "", "")
		if err != nil {
			// Fall back to keyword search with error message
			semanticError = err.Error()
			keywordResp, keywordErr := s.client.Search(query, 50, "", "")
			if keywordErr != nil {
				http.Error(w, keywordErr.Error(), http.StatusInternalServerError)
				return
			}
			results = convertKeywordResults(keywordResp.Results)
			mode = "keyword"
		} else {
			results = convertSemanticResults(resp.Results)
		}
	} else {
		resp, err := s.client.Search(query, 50, "", "")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		results = convertKeywordResults(resp.Results)
	}

	s.renderPartial(w, "partials/search-results.html", searchData{
		Query:         query,
		Mode:          mode,
		Results:       results,
		SemanticError: semanticError,
	})
}

// Document proxy handler
func (s *Server) handleDownload(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	// Get document metadata
	doc, err := s.client.GetDocument(id)
	if err != nil {
		http.Error(w, "Document not found", http.StatusNotFound)
		return
	}

	// Create request to API
	downloadURL := s.client.GetDocumentDownloadURL(id)
	req, err := http.NewRequest("GET", downloadURL, nil)
	if err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}
	req.Header.Set("X-API-Key", s.client.APIKey())

	// Make request
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, "Failed to download document", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Set headers
	w.Header().Set("Content-Type", doc.MimeType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", doc.Filename))
	w.Header().Set("Content-Length", strconv.FormatInt(doc.SizeBytes, 10))

	// Stream response
	io.Copy(w, resp.Body)
}

// Template rendering helpers

func (s *Server) render(w http.ResponseWriter, name string, data interface{}) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// Clone base template and parse the specific page template
	tmpl, err := s.baseTemplate.Clone()
	if err != nil {
		s.logger.Error("template clone error", "template", name, "error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Parse the specific template file
	tmpl, err = tmpl.ParseFS(templatesFS, "templates/"+name)
	if err != nil {
		s.logger.Error("template parse error", "template", name, "error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Execute the template
	if err := tmpl.ExecuteTemplate(w, name, data); err != nil {
		s.logger.Error("template execute error", "template", name, "error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

func (s *Server) renderPartial(w http.ResponseWriter, name string, data interface{}) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// Create a new template with function map
	tmpl := template.New("").Funcs(s.funcMap)

	// Parse the partial template
	tmpl, err := tmpl.ParseFS(templatesFS, "templates/"+name)
	if err != nil {
		s.logger.Error("partial template parse error", "template", name, "error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Execute the partial template
	if err := tmpl.ExecuteTemplate(w, name, data); err != nil {
		s.logger.Error("partial template execute error", "template", name, "error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

func (s *Server) renderError(w http.ResponseWriter, message string, err error) {
	s.logger.Error(message, "error", err)
	s.render(w, "error.html", pageData{
		Title:   "Error",
		Content: message + ": " + err.Error(),
	})
}

// Admin handlers

func (s *Server) handleAdmin(w http.ResponseWriter, r *http.Request) {
	status, err := s.client.GetStatus()
	if err != nil {
		s.renderError(w, "Failed to get status", err)
		return
	}

	s.render(w, "admin.html", pageData{
		Title:   "Admin",
		Content: adminData{Status: status},
	})
}

func (s *Server) handleAdminUsers(w http.ResponseWriter, r *http.Request) {
	users, err := s.client.ListUsers()
	if err != nil {
		s.renderError(w, "Failed to list users", err)
		return
	}

	s.render(w, "admin-users.html", pageData{
		Title:   "User Management",
		Content: usersData{Users: users.Users},
	})
}

func (s *Server) handleAdminCreateUser(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	name := r.FormValue("name")
	preset := r.FormValue("preset")

	if name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}

	if preset == "" {
		preset = "readonly" // Default to readonly preset
	}

	resp, err := s.client.CreateUser(name, preset)
	if err != nil {
		http.Error(w, "Failed to create user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Get updated user list
	users, err := s.client.ListUsers()
	if err != nil {
		http.Error(w, "Failed to list users", http.StatusInternalServerError)
		return
	}

	s.renderPartial(w, "partials/user-list.html", usersData{
		Users:     users.Users,
		NewAPIKey: resp.APIKey,
	})
}

func (s *Server) handleAdminDeleteUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	if err := s.client.DeleteUser(id); err != nil {
		http.Error(w, "Failed to delete user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Get updated user list
	users, err := s.client.ListUsers()
	if err != nil {
		http.Error(w, "Failed to list users", http.StatusInternalServerError)
		return
	}

	s.renderPartial(w, "partials/user-list.html", usersData{Users: users.Users})
}

func (s *Server) handleAdminRotateKey(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	apiKey, err := s.client.RotateAPIKey(id)
	if err != nil {
		http.Error(w, "Failed to rotate API key: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Get updated user list
	users, err := s.client.ListUsers()
	if err != nil {
		http.Error(w, "Failed to list users", http.StatusInternalServerError)
		return
	}

	s.renderPartial(w, "partials/user-list.html", usersData{
		Users:     users.Users,
		NewAPIKey: apiKey,
	})
}

func (s *Server) handleAdminSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := s.client.ListSettings()
	if err != nil {
		s.renderError(w, "Failed to list settings", err)
		return
	}

	s.render(w, "admin-settings.html", pageData{
		Title:   "Settings",
		Content: settingsData{Settings: settings.Settings},
	})
}

func (s *Server) handleAdminUpdateSetting(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")

	if err := r.ParseForm(); err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	value := r.FormValue("value")

	if err := s.client.UpdateSetting(key, value); err != nil {
		http.Error(w, "Failed to update setting: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Get updated settings list
	settings, err := s.client.ListSettings()
	if err != nil {
		http.Error(w, "Failed to list settings", http.StatusInternalServerError)
		return
	}

	s.renderPartial(w, "partials/settings-list.html", settingsData{Settings: settings.Settings})
}

func (s *Server) handleAdminReindex(w http.ResponseWriter, r *http.Request) {
	status, err := s.client.GetReindexStatus()
	if err != nil {
		s.renderError(w, "Failed to get reindex status", err)
		return
	}

	s.render(w, "admin-reindex.html", pageData{
		Title:   "Reindex",
		Content: status,
	})
}

func (s *Server) handleAdminTriggerReindex(w http.ResponseWriter, r *http.Request) {
	if err := s.client.TriggerReindex(); err != nil {
		http.Error(w, "Failed to trigger reindex: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Get updated status
	status, err := s.client.GetReindexStatus()
	if err != nil {
		http.Error(w, "Failed to get reindex status", http.StatusInternalServerError)
		return
	}

	s.renderPartial(w, "partials/reindex-status.html", status)
}

func (s *Server) handleAdminReindexStatus(w http.ResponseWriter, r *http.Request) {
	status, err := s.client.GetReindexStatus()
	if err != nil {
		http.Error(w, "Failed to get reindex status", http.StatusInternalServerError)
		return
	}

	s.renderPartial(w, "partials/reindex-status.html", status)
}

// handleHealth proxies health check requests to the API server
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	// Get health status from API
	health, err := s.client.GetHealth()
	if err != nil {
		s.logger.Error("health check failed", "error", err)
		http.Error(w, "Health check failed", http.StatusServiceUnavailable)
		return
	}

	// Return health status as JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(health)
}

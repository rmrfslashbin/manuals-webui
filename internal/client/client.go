// Package client provides an HTTP client for the Manuals REST API.
package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

const (
	// APIVersion is the API version to use.
	APIVersion = "2025.12"
)

// Client is an HTTP client for the Manuals API.
type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

// New creates a new API client.
func New(baseURL, apiKey string) *Client {
	return &Client{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// SearchResult represents a search result.
type SearchResult struct {
	DeviceID string  `json:"device_id"`
	Name     string  `json:"name"`
	Domain   string  `json:"domain"`
	Type     string  `json:"type"`
	Path     string  `json:"path"`
	Score    float64 `json:"score"`
	Snippet  string  `json:"snippet"`
}

// SearchResponse is the response from the search endpoint.
type SearchResponse struct {
	Results []SearchResult `json:"results"`
	Total   int            `json:"total"`
	Query   string         `json:"query"`
}

// Device represents a device.
type Device struct {
	ID        string                 `json:"id"`
	Domain    string                 `json:"domain"`
	Type      string                 `json:"type"`
	Name      string                 `json:"name"`
	Path      string                 `json:"path"`
	Content   string                 `json:"content,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	IndexedAt string                 `json:"indexed_at"`
}

// DevicesResponse is the response from the devices list endpoint.
type DevicesResponse struct {
	Data   []Device `json:"data"`
	Total  int      `json:"total"`
	Limit  int      `json:"limit"`
	Offset int      `json:"offset"`
}

// Document represents a document.
type Document struct {
	ID        string `json:"id"`
	DeviceID  string `json:"device_id"`
	Path      string `json:"path"`
	Filename  string `json:"filename"`
	MimeType  string `json:"mime_type"`
	SizeBytes int64  `json:"size_bytes"`
	Checksum  string `json:"checksum"`
	IndexedAt string `json:"indexed_at"`
}

// DocumentsResponse is the response from the documents list endpoint.
type DocumentsResponse struct {
	Data   []Document `json:"data"`
	Total  int        `json:"total"`
	Limit  int        `json:"limit"`
	Offset int        `json:"offset"`
}

// PinoutPin represents a single pin in a pinout.
type PinoutPin struct {
	PhysicalPin  int      `json:"physical_pin"`
	GPIONum      *int     `json:"gpio_num,omitempty"`
	Name         string   `json:"name"`
	DefaultPull  string   `json:"default_pull,omitempty"`
	AltFunctions []string `json:"alt_functions,omitempty"`
	Description  string   `json:"description,omitempty"`
}

// PinoutResponse is the response from the pinout endpoint.
type PinoutResponse struct {
	DeviceID string      `json:"device_id"`
	Name     string      `json:"name"`
	Pins     []PinoutPin `json:"pins"`
}

// SpecsResponse is the response from the specs endpoint.
type SpecsResponse struct {
	DeviceID string            `json:"device_id"`
	Name     string            `json:"name"`
	Specs    map[string]string `json:"specs"`
}

// StatusResponse is the response from the status endpoint.
type StatusResponse struct {
	Status      string `json:"status"`
	APIVersion  string `json:"api_version"`
	Version     string `json:"version"`
	DBPath      string `json:"db_path"`
	LastReindex string `json:"last_reindex,omitempty"`
	Counts      struct {
		Devices   int `json:"devices"`
		Documents int `json:"documents"`
		Users     int `json:"users"`
	} `json:"counts"`
}

// ErrorResponse is an API error response.
type ErrorResponse struct {
	Error string `json:"error"`
}

// Search searches for devices.
func (c *Client) Search(query string, limit int, domain, deviceType string) (*SearchResponse, error) {
	params := url.Values{}
	params.Set("q", query)
	if limit > 0 {
		params.Set("limit", fmt.Sprintf("%d", limit))
	}
	if domain != "" {
		params.Set("domain", domain)
	}
	if deviceType != "" {
		params.Set("type", deviceType)
	}

	var resp SearchResponse
	if err := c.get("/search?"+params.Encode(), &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// ListDevices lists devices with pagination.
func (c *Client) ListDevices(limit, offset int, domain, deviceType string) (*DevicesResponse, error) {
	params := url.Values{}
	if limit > 0 {
		params.Set("limit", fmt.Sprintf("%d", limit))
	}
	if offset > 0 {
		params.Set("offset", fmt.Sprintf("%d", offset))
	}
	if domain != "" {
		params.Set("domain", domain)
	}
	if deviceType != "" {
		params.Set("type", deviceType)
	}

	path := "/devices"
	if len(params) > 0 {
		path += "?" + params.Encode()
	}

	var resp DevicesResponse
	if err := c.get(path, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetDevice gets a device by ID.
func (c *Client) GetDevice(id string, includeContent bool) (*Device, error) {
	path := "/devices/" + id
	if includeContent {
		path += "?content=true"
	}
	var resp Device
	if err := c.get(path, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetDevicePinout gets the pinout for a device.
func (c *Client) GetDevicePinout(id string) (*PinoutResponse, error) {
	var resp PinoutResponse
	if err := c.get("/devices/"+id+"/pinout", &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetDeviceSpecs gets the specifications for a device.
func (c *Client) GetDeviceSpecs(id string) (*SpecsResponse, error) {
	var resp SpecsResponse
	if err := c.get("/devices/"+id+"/specs", &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// ListDocuments lists documents with pagination.
func (c *Client) ListDocuments(limit, offset int, deviceID string) (*DocumentsResponse, error) {
	params := url.Values{}
	if limit > 0 {
		params.Set("limit", fmt.Sprintf("%d", limit))
	}
	if offset > 0 {
		params.Set("offset", fmt.Sprintf("%d", offset))
	}
	if deviceID != "" {
		params.Set("device_id", deviceID)
	}

	path := "/documents"
	if len(params) > 0 {
		path += "?" + params.Encode()
	}

	var resp DocumentsResponse
	if err := c.get(path, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetDocument gets a document by ID.
func (c *Client) GetDocument(id string) (*Document, error) {
	var resp Document
	if err := c.get("/documents/"+id, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetDocumentDownloadURL returns the download URL for a document.
func (c *Client) GetDocumentDownloadURL(id string) string {
	return c.baseURL + "/api/" + APIVersion + "/documents/" + id + "/download"
}

// GetStatus gets the API status.
func (c *Client) GetStatus() (*StatusResponse, error) {
	var resp StatusResponse
	if err := c.get("/status", &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// MeResponse is the response from the /me endpoint.
type MeResponse struct {
	User User `json:"user"`
}

// GetCurrentUser gets the currently authenticated user.
func (c *Client) GetCurrentUser() (*User, error) {
	var resp MeResponse
	if err := c.get("/me", &resp); err != nil {
		return nil, err
	}
	return &resp.User, nil
}

// GetHealth gets the API health check (no auth required, returns raw JSON).
func (c *Client) GetHealth() ([]byte, error) {
	req, err := http.NewRequest("GET", c.baseURL+"/health", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	// Note: No API key header - health endpoint doesn't require auth

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("health check failed with status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	return body, nil
}

// get performs a GET request and decodes the JSON response.
func (c *Client) get(path string, result interface{}) error {
	req, err := http.NewRequest("GET", c.baseURL+"/api/"+APIVersion+path, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	// Only add API key header if configured (allows anonymous access)
	if c.apiKey != "" {
		req.Header.Set("X-API-Key", c.apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResp ErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
			body, _ := io.ReadAll(resp.Body)
			return fmt.Errorf("API error (%d): %s", resp.StatusCode, string(body))
		}
		return fmt.Errorf("API error (%d): %s", resp.StatusCode, errResp.Error)
	}

	if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
		return fmt.Errorf("failed to decode response: %w", err)
	}

	return nil
}

// post performs a POST request with JSON body.
func (c *Client) post(path string, body interface{}, result interface{}) error {
	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal request: %w", err)
		}
		reqBody = bytes.NewReader(jsonBody)
	}

	req, err := http.NewRequest("POST", c.baseURL+"/api/"+APIVersion+path, reqBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	// Only add API key header if configured (allows anonymous access)
	if c.apiKey != "" {
		req.Header.Set("X-API-Key", c.apiKey)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		var errResp ErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
			respBody, _ := io.ReadAll(resp.Body)
			return fmt.Errorf("API error (%d): %s", resp.StatusCode, string(respBody))
		}
		return fmt.Errorf("API error (%d): %s", resp.StatusCode, errResp.Error)
	}

	if result != nil {
		if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
			return fmt.Errorf("failed to decode response: %w", err)
		}
	}

	return nil
}

// put performs a PUT request with JSON body.
func (c *Client) put(path string, body interface{}) error {
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("PUT", c.baseURL+"/api/"+APIVersion+path, bytes.NewReader(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	// Only add API key header if configured (allows anonymous access)
	if c.apiKey != "" {
		req.Header.Set("X-API-Key", c.apiKey)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		var errResp ErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
			respBody, _ := io.ReadAll(resp.Body)
			return fmt.Errorf("API error (%d): %s", resp.StatusCode, string(respBody))
		}
		return fmt.Errorf("API error (%d): %s", resp.StatusCode, errResp.Error)
	}

	return nil
}

// delete performs a DELETE request.
func (c *Client) delete(path string) error {
	req, err := http.NewRequest("DELETE", c.baseURL+"/api/"+APIVersion+path, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	// Only add API key header if configured (allows anonymous access)
	if c.apiKey != "" {
		req.Header.Set("X-API-Key", c.apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		var errResp ErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
			respBody, _ := io.ReadAll(resp.Body)
			return fmt.Errorf("API error (%d): %s", resp.StatusCode, string(respBody))
		}
		return fmt.Errorf("API error (%d): %s", resp.StatusCode, errResp.Error)
	}

	return nil
}

// Admin types

// User represents an API user.
type User struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Role       string `json:"role"`
	CreatedAt  string `json:"created_at"`
	LastSeenAt string `json:"last_seen_at,omitempty"`
	IsActive   bool   `json:"is_active"`
}

// UsersResponse is the response from the users list endpoint.
type UsersResponse struct {
	Users []User `json:"users"`
}

// CreateUserRequest is the request body for creating a user.
type CreateUserRequest struct {
	Name string `json:"name"`
	Role string `json:"role"`
}

// CreateUserResponse is the response from creating a user.
type CreateUserResponse struct {
	User   User   `json:"user"`
	APIKey string `json:"api_key"`
}

// Setting represents a configuration setting.
type Setting struct {
	Key       string `json:"key"`
	Value     string `json:"value"`
	UpdatedAt string `json:"updated_at"`
}

// SettingsResponse is the response from the settings endpoint.
type SettingsResponse struct {
	Settings []Setting `json:"settings"`
}

// ReindexStatus represents the reindex operation status.
type ReindexStatus struct {
	Running     bool   `json:"running"`
	LastRun     string `json:"last_run,omitempty"`
	LastStatus  string `json:"last_status,omitempty"`
	DevicesFound int   `json:"devices_found,omitempty"`
	DocsFound    int   `json:"documents_found,omitempty"`
}

// Admin methods

// ListUsers lists all users (admin only).
func (c *Client) ListUsers() (*UsersResponse, error) {
	var resp UsersResponse
	if err := c.get("/admin/users", &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// CreateUser creates a new user (admin only).
func (c *Client) CreateUser(name, role string) (*CreateUserResponse, error) {
	var resp CreateUserResponse
	if err := c.post("/admin/users", CreateUserRequest{Name: name, Role: role}, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// DeleteUser deletes a user (admin only).
func (c *Client) DeleteUser(id string) error {
	return c.delete("/admin/users/" + id)
}

// RotateAPIKey rotates a user's API key (admin only).
func (c *Client) RotateAPIKey(id string) (string, error) {
	var resp struct {
		APIKey string `json:"api_key"`
	}
	if err := c.post("/admin/users/"+id+"/rotate-key", nil, &resp); err != nil {
		return "", err
	}
	return resp.APIKey, nil
}

// ListSettings lists all settings (admin only).
func (c *Client) ListSettings() (*SettingsResponse, error) {
	var resp SettingsResponse
	if err := c.get("/admin/settings", &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// UpdateSetting updates a setting (admin only).
func (c *Client) UpdateSetting(key, value string) error {
	return c.put("/admin/settings/"+key, map[string]string{"value": value})
}

// TriggerReindex triggers a reindex operation (admin only).
func (c *Client) TriggerReindex() error {
	return c.post("/admin/reindex", nil, nil)
}

// GetReindexStatus gets the reindex status (admin only).
func (c *Client) GetReindexStatus() (*ReindexStatus, error) {
	var resp ReindexStatus
	if err := c.get("/admin/reindex/status", &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// APIKey returns the API key for use in proxied requests.
func (c *Client) APIKey() string {
	return c.apiKey
}

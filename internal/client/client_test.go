package client

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestNew(t *testing.T) {
	client := New("http://localhost:8080", "test-key")
	if client == nil {
		t.Fatal("expected non-nil client")
	}
	if client.baseURL != "http://localhost:8080" {
		t.Errorf("expected baseURL http://localhost:8080, got %s", client.baseURL)
	}
	if client.apiKey != "test-key" {
		t.Errorf("expected apiKey test-key, got %s", client.apiKey)
	}
	if client.httpClient == nil {
		t.Error("expected non-nil httpClient")
	}
}

func TestAPIKey(t *testing.T) {
	client := New("http://localhost:8080", "my-secret-key")
	if got := client.APIKey(); got != "my-secret-key" {
		t.Errorf("expected APIKey my-secret-key, got %s", got)
	}
}

func TestSearch(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request
		if r.Method != "GET" {
			t.Errorf("expected GET, got %s", r.Method)
		}
		if !strings.HasPrefix(r.URL.Path, "/api/"+APIVersion+"/search") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		if r.URL.Query().Get("q") != "arduino" {
			t.Errorf("expected q=arduino, got %s", r.URL.Query().Get("q"))
		}
		if r.URL.Query().Get("limit") != "10" {
			t.Errorf("expected limit=10, got %s", r.URL.Query().Get("limit"))
		}
		if r.Header.Get("X-API-Key") != "test-key" {
			t.Errorf("expected X-API-Key header")
		}

		json.NewEncoder(w).Encode(SearchResponse{
			Query: "arduino",
			Total: 1,
			Results: []SearchResult{
				{DeviceID: "arduino-uno", Name: "Arduino Uno", Score: 0.95},
			},
		})
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	resp, err := client.Search("arduino", 10, "", "")
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}
	if resp.Query != "arduino" {
		t.Errorf("expected query arduino, got %s", resp.Query)
	}
	if resp.Total != 1 {
		t.Errorf("expected total 1, got %d", resp.Total)
	}
	if len(resp.Results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(resp.Results))
	}
	if resp.Results[0].DeviceID != "arduino-uno" {
		t.Errorf("expected device_id arduino-uno, got %s", resp.Results[0].DeviceID)
	}
}

func TestSearchWithFilters(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("domain") != "hardware" {
			t.Errorf("expected domain=hardware, got %s", r.URL.Query().Get("domain"))
		}
		if r.URL.Query().Get("type") != "mcu-boards" {
			t.Errorf("expected type=mcu-boards, got %s", r.URL.Query().Get("type"))
		}
		json.NewEncoder(w).Encode(SearchResponse{Query: "test", Total: 0})
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	_, err := client.Search("test", 0, "hardware", "mcu-boards")
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}
}

func TestSearchError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "search failed"})
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	_, err := client.Search("test", 10, "", "")
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "search failed") {
		t.Errorf("expected error to contain 'search failed', got: %v", err)
	}
}

func TestListDevices(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "GET" {
			t.Errorf("expected GET, got %s", r.Method)
		}
		if !strings.HasPrefix(r.URL.Path, "/api/"+APIVersion+"/devices") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}

		json.NewEncoder(w).Encode(DevicesResponse{
			Data: []Device{
				{ID: "device-1", Name: "Device One", Domain: "hardware", Type: "sensors"},
				{ID: "device-2", Name: "Device Two", Domain: "hardware", Type: "mcu-boards"},
			},
			Total:  2,
			Limit:  50,
			Offset: 0,
		})
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	resp, err := client.ListDevices(0, 0, "", "")
	if err != nil {
		t.Fatalf("ListDevices failed: %v", err)
	}
	if resp.Total != 2 {
		t.Errorf("expected total 2, got %d", resp.Total)
	}
	if len(resp.Data) != 2 {
		t.Errorf("expected 2 devices, got %d", len(resp.Data))
	}
}

func TestListDevicesWithFilters(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("limit") != "10" {
			t.Errorf("expected limit=10, got %s", r.URL.Query().Get("limit"))
		}
		if r.URL.Query().Get("offset") != "5" {
			t.Errorf("expected offset=5, got %s", r.URL.Query().Get("offset"))
		}
		if r.URL.Query().Get("domain") != "hardware" {
			t.Errorf("expected domain=hardware, got %s", r.URL.Query().Get("domain"))
		}
		if r.URL.Query().Get("type") != "sensors" {
			t.Errorf("expected type=sensors, got %s", r.URL.Query().Get("type"))
		}
		json.NewEncoder(w).Encode(DevicesResponse{Total: 0})
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	_, err := client.ListDevices(10, 5, "hardware", "sensors")
	if err != nil {
		t.Fatalf("ListDevices failed: %v", err)
	}
}

func TestGetDevice(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "/devices/test-device") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		json.NewEncoder(w).Encode(Device{
			ID:     "test-device",
			Name:   "Test Device",
			Domain: "hardware",
			Type:   "sensors",
		})
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	device, err := client.GetDevice("test-device", false)
	if err != nil {
		t.Fatalf("GetDevice failed: %v", err)
	}
	if device.ID != "test-device" {
		t.Errorf("expected ID test-device, got %s", device.ID)
	}
}

func TestGetDeviceWithContent(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("content") != "true" {
			t.Errorf("expected content=true, got %s", r.URL.Query().Get("content"))
		}
		json.NewEncoder(w).Encode(Device{
			ID:      "test-device",
			Name:    "Test Device",
			Content: "# Full documentation content",
		})
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	device, err := client.GetDevice("test-device", true)
	if err != nil {
		t.Fatalf("GetDevice failed: %v", err)
	}
	if device.Content == "" {
		t.Error("expected content to be set")
	}
}

func TestGetDeviceNotFound(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "device not found"})
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	_, err := client.GetDevice("nonexistent", false)
	if err == nil {
		t.Fatal("expected error for nonexistent device")
	}
	if !strings.Contains(err.Error(), "device not found") {
		t.Errorf("expected 'device not found' error, got: %v", err)
	}
}

func TestGetDevicePinout(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "/pinout") {
			t.Errorf("expected path to contain /pinout, got %s", r.URL.Path)
		}
		gpioNum := 2
		json.NewEncoder(w).Encode(PinoutResponse{
			DeviceID: "rpi-5",
			Name:     "Raspberry Pi 5",
			Pins: []PinoutPin{
				{PhysicalPin: 1, Name: "3.3V", Description: "Power"},
				{PhysicalPin: 3, GPIONum: &gpioNum, Name: "GPIO2", AltFunctions: []string{"SDA1", "I2C"}},
			},
		})
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	resp, err := client.GetDevicePinout("rpi-5")
	if err != nil {
		t.Fatalf("GetDevicePinout failed: %v", err)
	}
	if resp.DeviceID != "rpi-5" {
		t.Errorf("expected device_id rpi-5, got %s", resp.DeviceID)
	}
	if len(resp.Pins) != 2 {
		t.Errorf("expected 2 pins, got %d", len(resp.Pins))
	}
}

func TestGetDeviceSpecs(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "/specs") {
			t.Errorf("expected path to contain /specs, got %s", r.URL.Path)
		}
		json.NewEncoder(w).Encode(SpecsResponse{
			DeviceID: "esp32",
			Name:     "ESP32",
			Specs: map[string]string{
				"cpu":   "Dual-core Xtensa LX6",
				"flash": "4MB",
				"ram":   "520KB",
			},
		})
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	resp, err := client.GetDeviceSpecs("esp32")
	if err != nil {
		t.Fatalf("GetDeviceSpecs failed: %v", err)
	}
	if resp.DeviceID != "esp32" {
		t.Errorf("expected device_id esp32, got %s", resp.DeviceID)
	}
	if resp.Specs["cpu"] != "Dual-core Xtensa LX6" {
		t.Errorf("unexpected cpu spec: %s", resp.Specs["cpu"])
	}
}

func TestListDocuments(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/api/"+APIVersion+"/documents") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		json.NewEncoder(w).Encode(DocumentsResponse{
			Data: []Document{
				{ID: "doc-1", Filename: "datasheet.pdf", MimeType: "application/pdf", SizeBytes: 1024},
			},
			Total:  1,
			Limit:  50,
			Offset: 0,
		})
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	resp, err := client.ListDocuments(0, 0, "")
	if err != nil {
		t.Fatalf("ListDocuments failed: %v", err)
	}
	if resp.Total != 1 {
		t.Errorf("expected total 1, got %d", resp.Total)
	}
	if len(resp.Data) != 1 {
		t.Errorf("expected 1 document, got %d", len(resp.Data))
	}
}

func TestListDocumentsWithFilters(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("limit") != "20" {
			t.Errorf("expected limit=20, got %s", r.URL.Query().Get("limit"))
		}
		if r.URL.Query().Get("offset") != "10" {
			t.Errorf("expected offset=10, got %s", r.URL.Query().Get("offset"))
		}
		if r.URL.Query().Get("device_id") != "arduino-uno" {
			t.Errorf("expected device_id=arduino-uno, got %s", r.URL.Query().Get("device_id"))
		}
		json.NewEncoder(w).Encode(DocumentsResponse{Total: 0})
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	_, err := client.ListDocuments(20, 10, "arduino-uno")
	if err != nil {
		t.Fatalf("ListDocuments failed: %v", err)
	}
}

func TestGetDocument(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "/documents/doc-123") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		json.NewEncoder(w).Encode(Document{
			ID:        "doc-123",
			DeviceID:  "arduino-uno",
			Filename:  "Arduino_Uno_Rev3.pdf",
			MimeType:  "application/pdf",
			SizeBytes: 2048,
			Checksum:  "abc123",
		})
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	doc, err := client.GetDocument("doc-123")
	if err != nil {
		t.Fatalf("GetDocument failed: %v", err)
	}
	if doc.ID != "doc-123" {
		t.Errorf("expected ID doc-123, got %s", doc.ID)
	}
	if doc.Filename != "Arduino_Uno_Rev3.pdf" {
		t.Errorf("expected filename Arduino_Uno_Rev3.pdf, got %s", doc.Filename)
	}
}

func TestGetDocumentDownloadURL(t *testing.T) {
	client := New("http://localhost:8080", "test-key")
	url := client.GetDocumentDownloadURL("doc-123")
	expected := "http://localhost:8080/api/" + APIVersion + "/documents/doc-123/download"
	if url != expected {
		t.Errorf("expected %s, got %s", expected, url)
	}
}

func TestGetStatus(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "/status") {
			t.Errorf("expected path to contain /status, got %s", r.URL.Path)
		}
		resp := StatusResponse{
			Status:     "ok",
			APIVersion: APIVersion,
			Version:    "1.0.0",
			DBPath:     "/data/manuals.db",
		}
		resp.Counts.Devices = 100
		resp.Counts.Documents = 50
		resp.Counts.Users = 3
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	resp, err := client.GetStatus()
	if err != nil {
		t.Fatalf("GetStatus failed: %v", err)
	}
	if resp.Status != "ok" {
		t.Errorf("expected status ok, got %s", resp.Status)
	}
	if resp.Counts.Devices != 100 {
		t.Errorf("expected 100 devices, got %d", resp.Counts.Devices)
	}
}

func TestGetHealth(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/health" {
			t.Errorf("expected path /health, got %s", r.URL.Path)
		}
		// Health endpoint should NOT have API key header (it's public)
		if r.Header.Get("X-API-Key") != "" {
			t.Error("expected no X-API-Key header for health endpoint")
		}
		w.Write([]byte(`{"status":"healthy","checks":{"database":"ok"}}`))
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	body, err := client.GetHealth()
	if err != nil {
		t.Fatalf("GetHealth failed: %v", err)
	}
	if !strings.Contains(string(body), "healthy") {
		t.Errorf("expected response to contain 'healthy', got %s", string(body))
	}
}

func TestGetHealthError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	_, err := client.GetHealth()
	if err == nil {
		t.Fatal("expected error for unhealthy status")
	}
	if !strings.Contains(err.Error(), "503") {
		t.Errorf("expected error to mention 503, got: %v", err)
	}
}

// Admin endpoint tests

func TestListUsers(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "/admin/users") {
			t.Errorf("expected path to contain /admin/users, got %s", r.URL.Path)
		}
		json.NewEncoder(w).Encode(UsersResponse{
			Users: []User{
				{ID: "user-1", Name: "admin", Role: "admin", IsActive: true},
				{ID: "user-2", Name: "reader", Role: "ro", IsActive: true},
			},
		})
	}))
	defer server.Close()

	client := New(server.URL, "admin-key")
	resp, err := client.ListUsers()
	if err != nil {
		t.Fatalf("ListUsers failed: %v", err)
	}
	if len(resp.Users) != 2 {
		t.Errorf("expected 2 users, got %d", len(resp.Users))
	}
}

func TestCreateUser(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if !strings.Contains(r.URL.Path, "/admin/users") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}

		var req CreateUserRequest
		json.NewDecoder(r.Body).Decode(&req)
		if req.Name != "newuser" {
			t.Errorf("expected name newuser, got %s", req.Name)
		}
		if req.Role != "rw" {
			t.Errorf("expected role rw, got %s", req.Role)
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(CreateUserResponse{
			User:   User{ID: "user-new", Name: "newuser", Role: "rw", IsActive: true},
			APIKey: "mapi_newkey123",
		})
	}))
	defer server.Close()

	client := New(server.URL, "admin-key")
	resp, err := client.CreateUser("newuser", "rw")
	if err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}
	if resp.User.Name != "newuser" {
		t.Errorf("expected name newuser, got %s", resp.User.Name)
	}
	if resp.APIKey != "mapi_newkey123" {
		t.Errorf("expected api key mapi_newkey123, got %s", resp.APIKey)
	}
}

func TestDeleteUser(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "DELETE" {
			t.Errorf("expected DELETE, got %s", r.Method)
		}
		if !strings.Contains(r.URL.Path, "/admin/users/user-123") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	client := New(server.URL, "admin-key")
	err := client.DeleteUser("user-123")
	if err != nil {
		t.Fatalf("DeleteUser failed: %v", err)
	}
}

func TestDeleteUserError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "cannot delete self"})
	}))
	defer server.Close()

	client := New(server.URL, "admin-key")
	err := client.DeleteUser("self-id")
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "cannot delete self") {
		t.Errorf("expected 'cannot delete self' error, got: %v", err)
	}
}

func TestRotateAPIKey(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if !strings.Contains(r.URL.Path, "/rotate-key") {
			t.Errorf("expected path to contain /rotate-key, got %s", r.URL.Path)
		}
		json.NewEncoder(w).Encode(map[string]string{"api_key": "mapi_rotatedkey"})
	}))
	defer server.Close()

	client := New(server.URL, "admin-key")
	newKey, err := client.RotateAPIKey("user-123")
	if err != nil {
		t.Fatalf("RotateAPIKey failed: %v", err)
	}
	if newKey != "mapi_rotatedkey" {
		t.Errorf("expected mapi_rotatedkey, got %s", newKey)
	}
}

func TestListSettings(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "/admin/settings") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		json.NewEncoder(w).Encode(SettingsResponse{
			Settings: []Setting{
				{Key: "allow_anonymous", Value: "true", UpdatedAt: "2024-01-01T00:00:00Z"},
			},
		})
	}))
	defer server.Close()

	client := New(server.URL, "admin-key")
	resp, err := client.ListSettings()
	if err != nil {
		t.Fatalf("ListSettings failed: %v", err)
	}
	if len(resp.Settings) != 1 {
		t.Errorf("expected 1 setting, got %d", len(resp.Settings))
	}
	if resp.Settings[0].Key != "allow_anonymous" {
		t.Errorf("expected key allow_anonymous, got %s", resp.Settings[0].Key)
	}
}

func TestUpdateSetting(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "PUT" {
			t.Errorf("expected PUT, got %s", r.Method)
		}
		if !strings.Contains(r.URL.Path, "/admin/settings/allow_anonymous") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}

		var body map[string]string
		json.NewDecoder(r.Body).Decode(&body)
		if body["value"] != "false" {
			t.Errorf("expected value false, got %s", body["value"])
		}

		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	client := New(server.URL, "admin-key")
	err := client.UpdateSetting("allow_anonymous", "false")
	if err != nil {
		t.Fatalf("UpdateSetting failed: %v", err)
	}
}

func TestTriggerReindex(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if !strings.Contains(r.URL.Path, "/admin/reindex") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	client := New(server.URL, "admin-key")
	err := client.TriggerReindex()
	if err != nil {
		t.Fatalf("TriggerReindex failed: %v", err)
	}
}

func TestGetReindexStatus(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "/admin/reindex/status") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		json.NewEncoder(w).Encode(ReindexStatus{
			Running:      false,
			LastRun:      "2024-01-01T12:00:00Z",
			LastStatus:   "completed",
			DevicesFound: 150,
			DocsFound:    75,
		})
	}))
	defer server.Close()

	client := New(server.URL, "admin-key")
	resp, err := client.GetReindexStatus()
	if err != nil {
		t.Fatalf("GetReindexStatus failed: %v", err)
	}
	if resp.Running {
		t.Error("expected running to be false")
	}
	if resp.DevicesFound != 150 {
		t.Errorf("expected 150 devices found, got %d", resp.DevicesFound)
	}
}

// Error handling tests

func TestGetErrorWithNonJSONResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Internal Server Error"))
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	_, err := client.GetStatus()
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "500") {
		t.Errorf("expected error to mention status code, got: %v", err)
	}
}

func TestPostErrorWithNonJSONResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Bad Request"))
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	_, err := client.CreateUser("test", "invalid-role")
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "400") {
		t.Errorf("expected error to mention 400, got: %v", err)
	}
}

func TestPutErrorWithNonJSONResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		w.Write([]byte("Forbidden"))
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	err := client.UpdateSetting("key", "value")
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "403") {
		t.Errorf("expected error to mention 403, got: %v", err)
	}
}

func TestDeleteErrorWithNonJSONResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte("Unauthorized"))
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	err := client.DeleteUser("user-123")
	if err == nil {
		t.Fatal("expected error")
	}
	if !strings.Contains(err.Error(), "401") {
		t.Errorf("expected error to mention 401, got: %v", err)
	}
}

func TestNetworkError(t *testing.T) {
	// Use a non-routable address to simulate network error
	client := New("http://192.0.2.1:9999", "test-key")
	client.httpClient.Timeout = 1 // Very short timeout

	_, err := client.GetStatus()
	if err == nil {
		t.Fatal("expected network error")
	}
	if !strings.Contains(err.Error(), "request failed") {
		t.Errorf("expected 'request failed' error, got: %v", err)
	}
}

func TestAnonymousAccess(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify NO API key header is sent
		if r.Header.Get("X-API-Key") != "" {
			t.Error("expected no X-API-Key header for anonymous client")
		}
		json.NewEncoder(w).Encode(DevicesResponse{Total: 0})
	}))
	defer server.Close()

	// Create client with empty API key (anonymous)
	client := New(server.URL, "")
	_, err := client.ListDevices(0, 0, "", "")
	if err != nil {
		t.Fatalf("anonymous access failed: %v", err)
	}
}

func TestInvalidJSONResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("not valid json"))
	}))
	defer server.Close()

	client := New(server.URL, "test-key")
	_, err := client.GetStatus()
	if err == nil {
		t.Fatal("expected error for invalid JSON")
	}
	if !strings.Contains(err.Error(), "failed to decode") {
		t.Errorf("expected 'failed to decode' error, got: %v", err)
	}
}

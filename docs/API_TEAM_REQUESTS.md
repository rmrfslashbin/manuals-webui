# API Team Requests for manuals-webui

## 🔴 Critical Priority

### Request #1: Restrict CORS Origins
**Current State:** API server allows `Access-Control-Allow-Origin: *`

**Security Issue:** Any website can make requests to the API, potential for credential theft

**Requested Change:**
```go
// Current (UNSAFE):
w.Header().Set("Access-Control-Allow-Origin", "*")

// Requested (SAFE):
allowedOrigins := []string{
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    // Add production domains here
}

origin := r.Header.Get("Origin")
for _, allowed := range allowedOrigins {
    if origin == allowed {
        w.Header().Set("Access-Control-Allow-Origin", origin)
        break
    }
}
```

**Impact:** Production security requirement

**Priority:** Critical - blocks production deployment

---

### Request #2: Add API Response Schema Validation
**Current State:** API responses have inconsistent or undocumented schemas

**Issue:** Frontend crashes if API returns unexpected format

**Requested Change:**
1. Document API response schemas (OpenAPI/Swagger)
2. Ensure consistent error response format:
   ```json
   {
     "error": "human readable message",
     "code": "ERROR_CODE",
     "details": {}
   }
   ```
3. Consistent success response format
4. Version API endpoints properly (`/api/2025.12/...`)

**Impact:** Stability and error handling

**Priority:** High

---

## 🟡 High Priority

### Request #3: Add API Health Check Endpoint
**Current State:** `/api/2025.12/status` exists but unclear if it's suitable for health checks

**Requested Feature:**
- Endpoint: `GET /api/2025.12/health`
- No authentication required
- Fast response (< 100ms)
- Returns service health status:
  ```json
  {
    "status": "healthy|degraded|unhealthy",
    "version": "2025.12",
    "uptime_seconds": 12345,
    "database": "connected",
    "checks": {
      "database": "ok",
      "filesystem": "ok"
    }
  }
  ```

**Use Case:** Frontend can periodically check if API is reachable without authentication

**Priority:** High - enables better error detection

---

### Request #4: Add Rate Limiting Headers
**Current State:** No rate limiting information in responses

**Requested Change:**
Add standard rate limit headers to all API responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

**Use Case:** Frontend can show warnings before hitting rate limits

**Priority:** Medium - nice to have for UX

---

### Request #5: Fix Status Endpoint Device/Document Counts
**Current State:** `/api/2025.12/status` returns incorrect counts

**Issue:** Status endpoint reports only 1 device and 1 document:
```json
{
  "counts": {
    "devices": 1,
    "documents": 1,
    "guides": 0
  }
}
```

However, search functionality returns 37+ devices (e.g., searching "ESP32" returns 37+ results).

**Impact:** Homepage displays incorrect statistics, misleading users about available data

**Root Cause:** Status endpoint not accurately counting devices in database

**Requested Fix:**
- Verify database counting logic in status endpoint
- Ensure counts match actual indexed devices/documents
- Consider adding debug endpoint to show count methodology

**Priority:** High - data accuracy issue

**Discovered:** 2025-12-12 during Playwright testing

---

## 🔵 Low Priority

### Request #6: Add WebSocket/SSE Support for Real-Time Updates
**Current State:** Must poll or refresh to see new data

**Requested Feature:**
- WebSocket endpoint or Server-Sent Events
- Push notifications for:
  - New devices indexed
  - Reindex completion
  - Data updates

**Use Case:** Live updates without polling

**Priority:** Low - future enhancement

---

### Request #7: Add Pagination Metadata
**Current State:** Pagination works but metadata could be richer

**Current Response:**
```json
{
  "devices": [...],
  "page": 1,
  "total": 61
}
```

**Requested Enhancement:**
```json
{
  "devices": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_pages": 4,
    "total_items": 61,
    "has_next": true,
    "has_prev": false
  }
}
```

**Use Case:** Better pagination UI

**Priority:** Low - current implementation works

---

## 📝 Notes

### API Server Repository
- Repository: `manuals` (parent repo)
- Current CORS implementation added: 2025-12-12
- Contact: @rmrfslashbin

### Testing Endpoints
```bash
# Current API URL
http://manuals.local:8080

# Current API Key Format
mapi_d4tjdq7gf1ms73e6jg4gd4tjdq7gf1ms73e6jg50
```

### Questions for API Team
1. Is there a formal API versioning strategy?
2. Are there plans for API documentation (OpenAPI spec)?
3. What's the expected API stability/breaking change policy?
4. Are there existing rate limits we should be aware of?

---

## Implementation Priority for API Team

**Phase 1 (Critical):**
- Request #1: CORS restriction

**Phase 2 (High):**
- Request #2: Response schema validation
- Request #3: Health check endpoint
- Request #5: Fix status endpoint counts

**Phase 3 (Nice to Have):**
- Request #4: Rate limiting headers
- Request #6: Real-time updates
- Request #7: Pagination metadata

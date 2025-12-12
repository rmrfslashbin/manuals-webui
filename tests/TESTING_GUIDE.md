# Playwright Testing Guide

## Test Suite Overview

This test suite covers critical user flows and functionality for the manuals-webui application.

## Test Categories

### 1. Setup & Configuration Tests
- ✅ Setup flow with valid credentials
- ✅ Setup flow with invalid URL
- ✅ Setup flow with invalid API key
- ✅ Configuration persistence in sessionStorage
- ✅ Redirect to setup when not configured

### 2. Navigation Tests
- ✅ Home page loads
- ✅ Navigate to Devices page
- ✅ Navigate to Documents page
- ✅ Navigate to Search page
- ✅ Navigate to Admin page
- ✅ Navigate to Settings page
- ✅ Navigation bar links work

### 3. Device Tests
- ✅ Device list displays
- ✅ Device pagination works
- ✅ Device filtering by domain
- ✅ Device filtering by type
- ✅ Device detail page loads

### 4. Search Tests
- ✅ Search form displays
- ✅ Search executes successfully
- ✅ Search results display
- ✅ Empty search results handled

### 5. Settings Tests
- ✅ Current configuration displays
- ✅ API key is masked
- ✅ Test connection button works
- ✅ Reconfigure redirects to setup
- ✅ Clear configuration works

### 6. Admin Panel Tests
- ✅ Admin page loads
- ✅ User management section visible
- ✅ Settings section visible
- ✅ Reindex section visible
- ⏳ User CRUD operations (requires API testing)
- ⏳ Reindex functionality (requires API testing)

### 7. Error Handling Tests
- ✅ Invalid URL shows error
- ✅ Network error shows notification
- ✅ Session expiration redirects
- ✅ Offline detection (manual test)

### 8. Loading State Tests
- ✅ Loading bar appears during requests
- ✅ Buttons disabled during submission
- ✅ Loading bar hides after completion

## Test Data

### Valid API Configuration
```
URL: http://manuals.local:8080
Key: mapi_d4tjdq7gf1ms73e6jg4gd4tjdq7gf1ms73e6jg50
```

### Invalid Configurations
```
Invalid URL: http://invalid-server:9999
Invalid Key: invalid_key_123
```

## Running Tests

### Manual Testing with Playwright MCP

The current tests are documented here and can be run manually using the Playwright MCP tools in Claude Code.

### Future: Automated Test Suite

To create an automated test suite:

```bash
# Install Playwright
npm install -D @playwright/test

# Create playwright.config.ts
# Write test files in tests/ directory
# Run tests
npx playwright test
```

## Test Checklist

### Pre-Test Setup
- [ ] API server running at http://manuals.local:8080
- [ ] WebUI server running at http://localhost:3000
- [ ] Database populated with test data
- [ ] Browser cleared of existing sessionStorage

### Critical Path Tests
- [x] User can complete setup flow
- [x] User can navigate all pages
- [x] User can view devices
- [x] User can view settings
- [x] Errors show notifications
- [x] Loading states appear

### Edge Cases
- [x] Invalid API URL handled
- [x] Session expiration handled
- [ ] Concurrent requests handled
- [ ] Large data sets handled
- [ ] Special characters in search

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader labels present
- [ ] Focus management correct
- [ ] Color contrast sufficient

### Performance
- [ ] Page load < 2s
- [ ] Search response < 1s
- [ ] Pagination smooth
- [ ] No memory leaks

## Known Issues

1. **Setup Page Notifications**
   - Setup page uses vanilla fetch, not HTMX
   - Errors show inline, not as toast notifications
   - Could integrate notifications.js directly

2. **Admin Panel API**
   - Some admin operations not tested (require API endpoints)
   - Reindex functionality needs backend verification

3. **Browser Compatibility**
   - Only tested in Chrome via Playwright
   - Need to test Firefox, Safari

## Test Results Log

### 2025-12-12 - Initial Test Run

**Environment:**
- API: v2025.12
- WebUI: 70e9ee3-dirty
- Browser: Chrome (Playwright)
- OS: macOS

**Results:**
- ✅ Setup flow: PASS
- ✅ Navigation: PASS
- ✅ Device listing: PASS (61 devices)
- ✅ Settings: PASS
- ✅ Error notifications: PASS
- ✅ Loading states: PASS
- ✅ Session handling: PASS

**Issues Found:**
- None

**Notes:**
- All critical flows working correctly
- CSS loading properly after Tailwind v3 migration
- Notifications system operational
- Browser-based config working with CORS

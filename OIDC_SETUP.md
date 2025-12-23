# OIDC Authentication Setup Guide

This guide explains how to configure OIDC (OpenID Connect) authentication for the Manuals Vue WebUI.

## Overview

The Vue POC supports OIDC authentication using industry-standard providers like:
- Google
- Auth0
- Keycloak
- Okta
- Azure AD
- Any OIDC-compliant provider

When OIDC is configured, users can sign in with their OIDC provider, and the app will send JWT Bearer tokens to the manuals-api for authentication. When OIDC is not configured, the app works in anonymous/public mode.

## Prerequisites

### 1. OIDC Provider Setup

You need an OIDC provider configured with:
- **Client ID** - Your application's client identifier
- **Redirect URI** - `http://localhost:5173/callback.html` (dev) or `https://your-domain.com/callback.html` (prod)
- **Allowed Scopes** - At minimum: `openid`, `profile`, `email`

### 2. Manuals API Configuration

The manuals-api backend must be configured with OIDC support. See manuals-api [PR #2](https://github.com/rmrfslashbin/manuals-api/pull/2) for backend setup.

Required environment variables for manuals-api:
```bash
MANUALS_OIDC_ISSUER=https://your-oidc-provider.com
MANUALS_OIDC_AUDIENCE=your-client-id
MANUALS_OIDC_JWKS_URL=https://your-oidc-provider.com/.well-known/jwks.json
```

### 3. User Provisioning

Users must be created in the manuals-api database with their OIDC subject mapped:

```sql
-- Example: Create user with OIDC subject
INSERT INTO users (id, name, email, oidc_subject, capabilities, created_at, is_active)
VALUES (
  'user123',
  'John Doe',
  'john@example.com',
  'google-oauth2|123456789',  -- OIDC sub claim
  'read:*',  -- Capabilities
  strftime('%s', 'now'),
  1
);
```

Or via API (requires admin capabilities):
```bash
curl -X POST http://localhost:8080/api/2025.12/admin/users \
  -H "X-API-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "oidc_subject": "google-oauth2|123456789",
    "capabilities": ["read:*"]
  }'
```

## Configuration

### Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
# API Configuration
VITE_API_URL=http://localhost:8080

# OIDC Configuration
VITE_OIDC_AUTHORITY=https://accounts.google.com
VITE_OIDC_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Provider-Specific Examples

#### Google

1. Create OAuth 2.0 Client ID at https://console.cloud.google.com/apis/credentials
2. Add authorized redirect URI: `http://localhost:5173/callback.html`
3. Configure:

```bash
VITE_OIDC_AUTHORITY=https://accounts.google.com
VITE_OIDC_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

Backend (manuals-api):
```bash
MANUALS_OIDC_ISSUER=https://accounts.google.com
MANUALS_OIDC_AUDIENCE=123456789-abc.apps.googleusercontent.com
MANUALS_OIDC_JWKS_URL=https://www.googleapis.com/oauth2/v3/certs
```

#### Auth0

1. Create application at https://manage.auth0.com/
2. Set Application Type: Single Page Application
3. Add Allowed Callback URL: `http://localhost:5173/callback.html`
4. Configure:

```bash
VITE_OIDC_AUTHORITY=https://your-tenant.auth0.com
VITE_OIDC_CLIENT_ID=your-client-id
```

Backend (manuals-api):
```bash
MANUALS_OIDC_ISSUER=https://your-tenant.auth0.com/
MANUALS_OIDC_AUDIENCE=your-client-id
MANUALS_OIDC_JWKS_URL=https://your-tenant.auth0.com/.well-known/jwks.json
```

#### Keycloak

1. Create client in Keycloak admin console
2. Set Access Type: public
3. Add Valid Redirect URI: `http://localhost:5173/callback.html`
4. Configure:

```bash
VITE_OIDC_AUTHORITY=https://your-keycloak.com/realms/your-realm
VITE_OIDC_CLIENT_ID=your-client-id
```

Backend (manuals-api):
```bash
MANUALS_OIDC_ISSUER=https://your-keycloak.com/realms/your-realm
MANUALS_OIDC_AUDIENCE=your-client-id
MANUALS_OIDC_JWKS_URL=https://your-keycloak.com/realms/your-realm/protocol/openid-connect/certs
```

## Development

### Running with OIDC

```bash
# Install dependencies
npm install

# Create .env with OIDC config
cp .env.example .env
# Edit .env with your OIDC provider details

# Start dev server
npm run dev
```

The app will be available at http://localhost:5173

### Testing OIDC Flow

1. Open http://localhost:5173
2. Click "Sign In" button in top right
3. You'll be redirected to your OIDC provider
4. Sign in with your credentials
5. You'll be redirected back to the app
6. Your name and email should appear in the top right
7. The app will send Bearer tokens to the API

### Debugging

#### Check Auth State

Open browser console and run:
```javascript
// Check if OIDC is configured
console.log('OIDC configured:', !!import.meta.env.VITE_OIDC_AUTHORITY)

// Check current user
console.log('User:', localStorage.getItem('oidc.user:' + import.meta.env.VITE_OIDC_AUTHORITY))
```

#### Check API Requests

Open Network tab in DevTools and look for API requests:
- Should have `Authorization: Bearer <token>` header
- Token should be a JWT (3 parts separated by dots)
- Backend should respond with 200 for valid tokens
- Backend should respond with 401 for invalid/expired tokens

#### Common Issues

**Sign in redirects but user not authenticated:**
- Check redirect URI matches exactly (including trailing slash)
- Check OIDC provider allows the redirect URI
- Check browser console for errors
- Verify OIDC subject exists in manuals-api database

**API returns 401 Unauthorized:**
- Verify OIDC issuer matches between frontend and backend
- Verify audience matches your client ID
- Check backend logs for JWT validation errors
- Verify user's OIDC subject in database matches JWT `sub` claim

**Infinite redirect loop:**
- Clear browser localStorage: `localStorage.clear()`
- Check callback.html is accessible
- Verify OIDC provider configuration

## Production Deployment

### Update Redirect URIs

Update redirect URIs in:
1. OIDC provider configuration
2. `.env` file (if using environment-specific builds)

```bash
# Production
VITE_OIDC_AUTHORITY=https://accounts.google.com
VITE_OIDC_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Remember to add production redirect URI to your OIDC provider:
# https://manuals.example.com/callback.html
```

### Build for Production

```bash
# Build static files
npm run build

# Files will be in internal/server/static/dist/
```

### Serve with Static File Server

The built Vue app is static and can be served by any web server:

```bash
# Example with Python
python3 -m http.server 3000 -d internal/server/static/dist

# Example with nginx
# Point nginx to /path/to/manuals-webui/internal/server/static/dist
```

## Security Considerations

### Token Storage

- Access tokens are stored in browser `localStorage`
- Tokens persist across browser sessions
- Tokens are visible in DevTools (not encrypted)
- **Recommendation:** Only use on trusted devices

### Token Expiration

- Tokens expire based on OIDC provider settings (typically 1 hour)
- Automatic silent renewal is enabled
- User will be prompted to sign in again if renewal fails

### HTTPS

- **Always use HTTPS in production** to protect tokens in transit
- OIDC providers may require HTTPS for production redirect URIs

### CORS

- manuals-api must have CORS enabled for browser requests
- Only allow specific origins (not `*` in production)

Example nginx config for Vue app:
```nginx
server {
    listen 443 ssl;
    server_name manuals.example.com;

    root /var/www/manuals-webui/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Anonymous Mode

If OIDC is not configured (environment variables empty), the app works in anonymous mode:
- No sign-in button shown
- "Anonymous Mode" indicator displayed
- Requests sent without authentication headers
- Only works if manuals-api allows anonymous access to public endpoints

## Troubleshooting

### User mapping not found

**Error:** "user not found or inactive"

**Cause:** OIDC subject in JWT doesn't match any user in database

**Solution:**
1. Sign in and check JWT `sub` claim in browser DevTools
2. Update user record in database with correct `oidc_subject`
3. Or create new user with the OIDC subject

### Token validation fails

**Error:** "invalid token"

**Causes:**
- Issuer mismatch between frontend and backend
- Audience mismatch
- Token expired
- JWKS endpoint unreachable

**Solution:**
- Verify environment variables match on frontend and backend
- Check backend logs for specific validation error
- Test JWKS endpoint is accessible: `curl https://your-provider/.well-known/jwks.json`

---

**Generated with [Claude Code](https://claude.com/claude-code)**

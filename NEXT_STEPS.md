# Production Implementation Guide - OIDC Authentication

This document provides step-by-step instructions for deploying OIDC authentication to production.

## Overview

This implementation adds OIDC authentication to the Manuals platform:
- **Backend (manuals-api)**: PR #2 - Already merged and deployed
- **Frontend (manuals-webui)**: This PR - Vue 3 POC with OIDC integration

## Prerequisites

- [ ] manuals-api backend with OIDC support deployed (PR #2)
- [ ] Database migration #8 applied (adds email and oidc_subject columns)
- [ ] OIDC provider account (Google, Auth0, Keycloak, etc.)
- [ ] SSL/TLS certificate for production domain
- [ ] Access to production servers and configuration

## Phase 1: OIDC Provider Setup

### Option A: Google OAuth

1. **Create OAuth 2.0 Client**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "Manuals Production"

2. **Configure Redirect URIs**
   ```
   Authorized redirect URIs:
   - https://manuals.example.com/callback.html
   - https://manuals.example.com/callback
   ```

3. **Note Credentials**
   ```
   Client ID: 123456789-abc.apps.googleusercontent.com
   Client Secret: (not needed for public client)
   ```

4. **Backend Environment Variables**
   ```bash
   MANUALS_OIDC_ISSUER=https://accounts.google.com
   MANUALS_OIDC_AUDIENCE=123456789-abc.apps.googleusercontent.com
   MANUALS_OIDC_JWKS_URL=https://www.googleapis.com/oauth2/v3/certs
   ```

### Option B: Auth0

1. **Create Application**
   - Visit: https://manage.auth0.com/
   - Applications → Create Application
   - Name: "Manuals Production"
   - Type: Single Page Application

2. **Configure Settings**
   ```
   Allowed Callback URLs:
   - https://manuals.example.com/callback.html

   Allowed Logout URLs:
   - https://manuals.example.com

   Allowed Web Origins:
   - https://manuals.example.com
   ```

3. **Backend Environment Variables**
   ```bash
   MANUALS_OIDC_ISSUER=https://your-tenant.auth0.com/
   MANUALS_OIDC_AUDIENCE=your-client-id
   MANUALS_OIDC_JWKS_URL=https://your-tenant.auth0.com/.well-known/jwks.json
   ```

### Option C: Keycloak

1. **Create Client**
   - Realm → Clients → Create
   - Client ID: manuals-production
   - Client Protocol: openid-connect
   - Access Type: public

2. **Configure Client**
   ```
   Valid Redirect URIs:
   - https://manuals.example.com/callback.html
   - https://manuals.example.com/callback

   Web Origins:
   - https://manuals.example.com
   ```

3. **Backend Environment Variables**
   ```bash
   MANUALS_OIDC_ISSUER=https://keycloak.example.com/realms/production
   MANUALS_OIDC_AUDIENCE=manuals-production
   MANUALS_OIDC_JWKS_URL=https://keycloak.example.com/realms/production/protocol/openid-connect/certs
   ```

## Phase 2: Backend Deployment

### 2.1 Verify Database Migration

The backend should already have migration #8 applied. Verify:

```bash
# Connect to production database
sqlite3 /data/manuals.db

# Check schema
.schema users

# Should show:
# - email TEXT
# - oidc_subject TEXT
# - UNIQUE INDEX idx_users_oidc_subject

# Check migration status
SELECT * FROM schema_migrations ORDER BY version;
# Should show version 8: "add oidc support to users"
```

### 2.2 Configure Backend Environment

Update production environment variables:

```bash
# manuals-api .env or systemd service file
MANUALS_OIDC_ISSUER=https://accounts.google.com
MANUALS_OIDC_AUDIENCE=your-client-id.apps.googleusercontent.com
MANUALS_OIDC_JWKS_URL=https://www.googleapis.com/oauth2/v3/certs
```

### 2.3 Restart Backend Service

```bash
# Systemd
sudo systemctl restart manuals-api

# Docker
docker restart manuals-api

# Verify logs
sudo journalctl -u manuals-api -f
# Look for: "OIDC authentication enabled"
```

### 2.4 Test Backend OIDC Validation

```bash
# Get a test JWT token from your OIDC provider
# Use it to test the API:

curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://api.manuals.example.com/api/2025.12/status

# Should return 401 if user not provisioned
# Should return 200 if user exists with matching oidc_subject
```

## Phase 3: User Provisioning

### 3.1 Identify OIDC Subjects

Users need their OIDC subject (`sub` claim) mapped in the database.

**Get OIDC subject from JWT:**

1. Sign in to OIDC provider
2. Copy JWT access token
3. Decode at https://jwt.io
4. Note the `sub` claim (e.g., `google-oauth2|123456789` or `auth0|abc123`)

### 3.2 Provision Users

**Option A: SQL (Direct Database Access)**

```sql
-- Update existing user with OIDC subject
UPDATE users
SET email = 'john@example.com',
    oidc_subject = 'google-oauth2|123456789'
WHERE id = 'existing-user-id';

-- Or create new user with OIDC
INSERT INTO users (
  id,
  name,
  email,
  oidc_subject,
  capabilities,
  created_at,
  is_active
) VALUES (
  'user_' || hex(randomblob(8)),
  'John Doe',
  'john@example.com',
  'google-oauth2|123456789',
  'read:*,write:publish',
  strftime('%s', 'now'),
  1
);
```

**Option B: API (Using Admin Capabilities)**

```bash
# Requires existing admin user with admin:users capability

# Create user with OIDC
curl -X POST https://api.manuals.example.com/api/2025.12/admin/users \
  -H "X-API-Key: your-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "oidc_subject": "google-oauth2|123456789",
    "capabilities": ["read:*", "write:publish"]
  }'

# Update existing user's OIDC subject
curl -X PUT https://api.manuals.example.com/api/2025.12/admin/users/USER_ID \
  -H "X-API-Key: your-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "oidc_subject": "google-oauth2|123456789"
  }'
```

### 3.3 Verify User Provisioning

```sql
-- Check users with OIDC configured
SELECT id, name, email, oidc_subject, capabilities
FROM users
WHERE oidc_subject IS NOT NULL;

-- Verify OIDC subject is unique
SELECT oidc_subject, COUNT(*)
FROM users
WHERE oidc_subject IS NOT NULL
GROUP BY oidc_subject
HAVING COUNT(*) > 1;
-- Should return no rows
```

## Phase 4: Frontend Deployment

### 4.1 Build Vue Application

```bash
cd manuals-webui

# Create production .env
cat > .env <<EOF
VITE_API_URL=https://api.manuals.example.com
VITE_OIDC_AUTHORITY=https://accounts.google.com
VITE_OIDC_CLIENT_ID=123456789-abc.apps.googleusercontent.com
EOF

# Install dependencies
npm install

# Build for production
npm run build

# Built files will be in: internal/server/static/dist/
```

### 4.2 Deploy Static Files

The Vue app is a static SPA. Deploy using your preferred method:

**Option A: Nginx**

```nginx
server {
    listen 443 ssl http2;
    server_name manuals.example.com;

    ssl_certificate /etc/letsencrypt/live/manuals.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/manuals.example.com/privkey.pem;

    root /var/www/manuals-webui/dist;
    index index.html;

    # SPA routing - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Callback page
    location /callback.html {
        try_files /callback.html =404;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass https://api.manuals.example.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

**Option B: Caddy**

```
manuals.example.com {
    root * /var/www/manuals-webui/dist
    file_server
    try_files {path} /index.html

    reverse_proxy /api/* https://api.manuals.example.com
}
```

**Option C: Static File Server (Vercel, Netlify, Cloudflare Pages)**

```bash
# Deploy dist/ directory
# Configure environment variables in platform:
VITE_API_URL=https://api.manuals.example.com
VITE_OIDC_AUTHORITY=https://accounts.google.com
VITE_OIDC_CLIENT_ID=your-client-id

# Add redirect rules for SPA routing
# Netlify (_redirects):
/*    /index.html   200

# Vercel (vercel.json):
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 4.3 Update CORS Configuration

Backend must allow frontend domain:

```bash
# manuals-api environment
MANUALS_CORS_ORIGINS=https://manuals.example.com

# Or multiple origins (comma-separated)
MANUALS_CORS_ORIGINS=https://manuals.example.com,https://staging.manuals.example.com
```

Restart backend after CORS change:
```bash
sudo systemctl restart manuals-api
```

## Phase 5: Testing

### 5.1 Pre-Deployment Checklist

- [ ] Backend OIDC environment variables configured
- [ ] Database migration #8 applied
- [ ] At least one test user provisioned with OIDC subject
- [ ] Frontend built with production environment variables
- [ ] CORS configured to allow frontend domain
- [ ] HTTPS certificates valid
- [ ] OIDC provider redirect URIs configured

### 5.2 Test OIDC Flow

1. **Anonymous Access (Before Login)**
   ```bash
   curl https://api.manuals.example.com/api/2025.12/devices
   # Should return data (anonymous access allowed for read endpoints)
   ```

2. **Frontend Login Flow**
   - Visit https://manuals.example.com
   - Should see "Sign In" button in top right
   - Click "Sign In"
   - Redirected to OIDC provider
   - Sign in with provisioned user credentials
   - Redirected back to app
   - Should see user name/email in top right
   - Check browser DevTools → Application → localStorage
     - Should see `oidc.user:` key with JWT token

3. **Authenticated API Requests**
   ```bash
   # Get JWT token from browser localStorage
   TOKEN="your-jwt-token-from-browser"

   # Test authenticated endpoint
   curl -H "Authorization: Bearer $TOKEN" \
        https://api.manuals.example.com/api/2025.12/me

   # Should return user info:
   # {
   #   "id": "user123",
   #   "name": "John Doe",
   #   "email": "john@example.com",
   #   "oidc_subject": "google-oauth2|123456789",
   #   "capabilities": ["read:*", "write:publish"],
   #   ...
   # }
   ```

4. **Test Protected Endpoints**
   ```bash
   # Test write endpoint (requires write:publish capability)
   curl -X POST https://api.manuals.example.com/api/2025.12/rw/upload \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"file": "test.pdf"}'

   # Should return 200 if user has write:publish capability
   # Should return 403 if user lacks capability
   ```

5. **Test Token Expiration**
   - Wait for token to expire (typically 1 hour)
   - App should automatically renew token (check DevTools console)
   - If renewal fails, should redirect to login

6. **Test Sign Out**
   - Click "Sign Out" button
   - Should clear localStorage
   - Should redirect to OIDC provider logout
   - Should redirect back to app
   - Should show "Sign In" button again

### 5.3 Backward Compatibility Test

Verify existing API key authentication still works:

```bash
# Test with existing API key
curl -H "X-API-Key: existing-api-key" \
     https://api.manuals.example.com/api/2025.12/me

# Should return user info (API key auth still works)
```

### 5.4 Load Testing

```bash
# Test concurrent OIDC requests
for i in {1..100}; do
  curl -H "Authorization: Bearer $TOKEN" \
       https://api.manuals.example.com/api/2025.12/devices &
done
wait

# Monitor backend logs for errors
sudo journalctl -u manuals-api -n 100
```

## Phase 6: Monitoring & Observability

### 6.1 Backend Metrics to Monitor

- JWT validation success/failure rate
- JWKS fetch latency and cache hit rate
- OIDC user lookup latency
- Token expiration events
- Failed authentication attempts

### 6.2 Log Patterns to Watch

```bash
# Successful OIDC authentication
grep "OIDC.*success" /var/log/manuals-api/app.log

# Failed JWT validation
grep "invalid token" /var/log/manuals-api/app.log

# JWKS fetch failures
grep "failed to fetch JWKS" /var/log/manuals-api/app.log

# Missing user mapping
grep "user not found.*oidc_subject" /var/log/manuals-api/app.log
```

### 6.3 Frontend Monitoring

Check browser console for:
- OIDC initialization errors
- Token refresh failures
- API request failures (401, 403)
- Callback processing errors

### 6.4 Alerts to Configure

- [ ] JWKS endpoint unreachable for > 5 minutes
- [ ] JWT validation failure rate > 5%
- [ ] OIDC user not found errors > 10/hour
- [ ] Token refresh failure rate > 10%

## Phase 7: Rollback Plan

If issues arise, rollback procedure:

### 7.1 Frontend Rollback

```bash
# Option A: Revert to previous build
cd manuals-webui
git checkout previous-working-commit
npm run build
# Redeploy dist/

# Option B: Disable OIDC in frontend
# Set empty OIDC variables in .env
VITE_OIDC_AUTHORITY=
VITE_OIDC_CLIENT_ID=
npm run build
# App will work in anonymous mode
```

### 7.2 Backend Rollback

```bash
# Option A: Disable OIDC validation
# Remove OIDC environment variables
unset MANUALS_OIDC_ISSUER
unset MANUALS_OIDC_AUDIENCE
unset MANUALS_OIDC_JWKS_URL

sudo systemctl restart manuals-api
# Backend will only accept API key authentication

# Option B: Redeploy previous version
git checkout previous-working-tag
go build ./cmd/manualsd
sudo systemctl restart manuals-api
```

### 7.3 Database Rollback

Migration #8 added columns but didn't change existing data. Rollback not required unless issues with the schema.

```sql
-- If needed, remove OIDC columns (not recommended unless necessary)
ALTER TABLE users DROP COLUMN email;
ALTER TABLE users DROP COLUMN oidc_subject;
DROP INDEX idx_users_oidc_subject;

-- Update schema_migrations to mark as rolled back
DELETE FROM schema_migrations WHERE version = 8;
```

## Phase 8: User Communication

### 8.1 Announcement Email Template

```
Subject: New Sign-In Method Available - OIDC Authentication

Dear Manuals Users,

We've enhanced the Manuals platform with OIDC authentication support.

What's New:
- Sign in with your Google/Auth0/[Provider] account
- Automatic token renewal (no need to re-enter credentials hourly)
- More secure authentication flow
- Existing API keys continue to work

How to Get Started:
1. Visit https://manuals.example.com
2. Click "Sign In" in the top right
3. Sign in with your [Provider] account
4. Contact your administrator to link your account

Your existing API keys will continue to work as before.

Questions? Contact [support email]

Best regards,
Manuals Team
```

### 8.2 Documentation Updates

Update the following docs:
- [ ] API authentication documentation
- [ ] User onboarding guide
- [ ] Admin user management guide
- [ ] Troubleshooting guide

## Phase 9: Post-Deployment Tasks

### Week 1:
- [ ] Monitor authentication success rates
- [ ] Verify no JWKS fetch failures
- [ ] Check user feedback for login issues
- [ ] Review backend logs for errors
- [ ] Verify token renewal working correctly

### Week 2-4:
- [ ] Analyze authentication metrics
- [ ] Identify users still using API keys (can migrate to OIDC)
- [ ] Document any issues encountered
- [ ] Plan improvements based on user feedback

### Month 2+:
- [ ] Consider deprecating API key auth for end users
- [ ] Keep API keys for service accounts and CLI tools
- [ ] Implement additional OIDC features (multi-factor, custom claims)

## Troubleshooting Guide

### Issue: "User not found or inactive" Error

**Cause:** OIDC subject in JWT doesn't match database

**Solution:**
1. Decode JWT at jwt.io - note `sub` claim
2. Check database: `SELECT * FROM users WHERE oidc_subject = 'the-sub-claim';`
3. If missing, provision user with correct `oidc_subject`
4. If exists but wrong, update user record

### Issue: "Invalid token" Error

**Possible Causes:**
- Issuer mismatch between frontend and backend
- Audience mismatch
- Token expired
- JWKS endpoint unreachable

**Solution:**
1. Verify environment variables match
2. Check backend logs for specific error
3. Test JWKS endpoint: `curl https://your-provider/.well-known/jwks.json`
4. Verify token not expired (check `exp` claim)

### Issue: Infinite Redirect Loop

**Cause:** Callback misconfiguration

**Solution:**
1. Clear browser localStorage
2. Verify callback URL matches exactly in OIDC provider
3. Check browser console for errors
4. Verify callback.html is accessible

### Issue: CORS Errors

**Cause:** Backend CORS not configured for frontend domain

**Solution:**
1. Add frontend domain to `MANUALS_CORS_ORIGINS`
2. Restart backend
3. Verify with: `curl -H "Origin: https://manuals.example.com" -I https://api.manuals.example.com/api/2025.12/status`
4. Should see `Access-Control-Allow-Origin` header

## Support Contacts

- **Backend Issues:** [backend team contact]
- **Frontend Issues:** [frontend team contact]
- **OIDC Provider Issues:** [identity team contact]
- **Database Issues:** [database team contact]

## References

- manuals-api PR #2: https://github.com/rmrfslashbin/manuals-api/pull/2
- manuals-webui OIDC Setup: `OIDC_SETUP.md`
- OIDC Specification: https://openid.net/connect/
- JWT Debugger: https://jwt.io

---

**Document Version:** 1.0
**Last Updated:** 2025-12-22
**Generated with [Claude Code](https://claude.com/claude-code)**

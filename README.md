# manuals-webui

Web UI for the Manuals documentation platform.

## Overview

A Go-based web application using HTMX and Tailwind CSS that provides a browser interface for the Manuals REST API. Features include:

- **Device Browser** - Browse devices with domain/type filtering and pagination
- **Full-Text Search** - Live search results with highlighting
- **Document Browser** - View and download documentation files
- **Admin Panel** - User management, settings, and reindex controls
- **Responsive Design** - Mobile-friendly interface
- **Browser-Based Config** - No server-side API credentials required
- **Smart Error Handling** - Toast notifications and auto-retry
- **Offline Detection** - Network status awareness

## Architecture

### Browser-Based Configuration

This application uses a **browser-based configuration model** for API credentials:

- API URL and API Key are stored in browser `sessionStorage`
- No credentials stored on the server
- Users configure on first visit via `/setup` page
- Configuration cleared when browser tab closes
- Each user brings their own API key

**Benefits:**
- No server-side credential management
- Multi-user friendly (each user uses their own key)
- More secure (credentials not in server logs/env)
- Simpler deployment (no .env files required)

**Trade-offs:**
- Users must reconfigure each browser session
- Requires CORS enabled on API server

### Tech Stack

- **Go 1.21+** - Backend server with embedded static files
- **HTMX 1.9** - Dynamic HTML updates without complex JavaScript
- **Tailwind CSS 3** - Utility-first CSS framework (local build)
- **html/template** - Go's standard templating engine
- **SessionStorage** - Client-side credential storage

## Requirements

### Runtime Requirements

- Go 1.21+ (for building)
- Access to a running Manuals API instance with CORS enabled

### Build Requirements

- Go 1.21+
- Node.js 18+ and npm (for Tailwind CSS build)
- Make (optional, for convenience commands)

## Installation

### Option 1: Install from Source

```bash
# Clone repository
git clone https://github.com/rmrfslashbin/manuals-webui.git
cd manuals-webui

# Install Node dependencies (for Tailwind CSS)
npm install

# Build CSS
make build-css

# Build Go binary
make build

# Binary will be at: ./bin/manuals-webui
```

### Option 2: Quick Build

```bash
# Clone and build in one go
git clone https://github.com/rmrfslashbin/manuals-webui.git
cd manuals-webui
npm install && make build-css && make build
```

### Option 3: Go Install (if published)

```bash
go install github.com/rmrfslashbin/manuals-webui/cmd/manuals-webui@latest
```

## Usage

### Starting the Server

```bash
# Basic usage (listens on :3000)
./bin/manuals-webui serve

# Custom port
./bin/manuals-webui serve --port 8080

# Custom host
./bin/manuals-webui serve --host 127.0.0.1 --port 3000

# With logging
./bin/manuals-webui serve --log-level debug
```

The web UI will be available at `http://localhost:3000`.

### First-Time Setup

1. Start the server: `./bin/manuals-webui serve`
2. Open browser to `http://localhost:3000`
3. You'll be redirected to `/setup`
4. Enter your API URL (e.g., `http://manuals.local:8080`)
5. Enter your API key (e.g., `mapi_...`)
6. Click "Test Connection & Save"
7. On success, you'll be redirected to the dashboard

### Reconfiguring

- Navigate to **Settings** page (`/settings`)
- Click **Reconfigure** to change API URL/key
- Click **Clear Configuration** to remove stored credentials
- Click **Test Connection** to verify current settings

## Configuration

### Command-Line Flags

| Flag | Environment Variable | Default | Description |
|------|---------------------|---------|-------------|
| `--host` | `MANUALS_SERVER_HOST` | `0.0.0.0` | Host to bind to |
| `--port` | `--port` | `3000` | Port to listen on |
| `--log-level` | `MANUALS_LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |

### Optional: Environment File

The application supports `.env` files via [godotenv](https://github.com/joho/godotenv) for convenience:

```bash
# .env file (optional)
MANUALS_SERVER_HOST=0.0.0.0
MANUALS_SERVER_PORT=3000
MANUALS_LOG_LEVEL=info
```

**Note:** API credentials (URL and key) are NOT configured via environment variables. Users configure these in the browser.

## Deployment

### Local Development

```bash
# Install dependencies
npm install

# Build CSS (watch mode during development)
npx tailwindcss -i ./input.css -o ./internal/server/static/output.css --watch

# Run server (in another terminal)
go run ./cmd/manuals-webui serve --log-level debug
```

### Production Deployment

#### 1. Build for Production

```bash
# Build CSS (minified)
make build-css

# Build Go binary
make build

# Binary with embedded static files at: ./bin/manuals-webui
```

#### 2. Deploy Binary

**Option A: Direct Execution**
```bash
# Copy binary to server
scp ./bin/manuals-webui user@server:/opt/manuals-webui/

# Run on server
ssh user@server
/opt/manuals-webui/manuals-webui serve --host 0.0.0.0 --port 3000
```

**Option B: Systemd Service**
```ini
# /etc/systemd/system/manuals-webui.service
[Unit]
Description=Manuals Web UI
After=network.target

[Service]
Type=simple
User=manuals
WorkingDirectory=/opt/manuals-webui
ExecStart=/opt/manuals-webui/manuals-webui serve --host 0.0.0.0 --port 3000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable manuals-webui
sudo systemctl start manuals-webui
sudo systemctl status manuals-webui
```

**Option C: Docker**
```dockerfile
# Dockerfile
FROM golang:1.21-alpine AS builder
RUN apk add --no-cache make nodejs npm
WORKDIR /app
COPY . .
RUN npm install && make build-css && make build

FROM alpine:latest
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/bin/manuals-webui /usr/local/bin/
EXPOSE 3000
ENTRYPOINT ["manuals-webui", "serve", "--host", "0.0.0.0"]
```

```bash
docker build -t manuals-webui .
docker run -p 3000:3000 manuals-webui
```

#### 3. Reverse Proxy (Recommended)

**Nginx:**
```nginx
server {
    listen 80;
    server_name manuals.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Caddy:**
```
manuals.example.com {
    reverse_proxy localhost:3000
}
```

#### 4. CORS Configuration

Ensure your Manuals API server has CORS enabled for browser-based requests:

```go
// Example Go CORS configuration
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:3000", "https://manuals.example.com"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders:     []string{"Origin", "Content-Type", "X-API-Key"},
    AllowCredentials: false,
}))
```

### Security Considerations

#### Browser-Based Config

- API keys stored in `sessionStorage` (cleared on tab close)
- Not encrypted (visible in DevTools)
- Vulnerable to XSS attacks
- **Recommendation:** Only use on trusted devices/networks

#### Content Security Policy (CSP)

The application is CSP-ready with all scripts in external files:

```nginx
# Example CSP header (if using reverse proxy)
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:;";
```

#### HTTPS

Always use HTTPS in production to protect API keys in transit:

```bash
# Example with Caddy (auto-HTTPS)
caddy reverse-proxy --from manuals.example.com --to localhost:3000
```

## Development

### Project Structure

```
manuals-webui/
├── cmd/manuals-webui/      # Main application entry point
│   └── main.go
├── internal/
│   └── server/             # Web server implementation
│       ├── static/         # Static files (CSS, JS)
│       │   ├── output.css          # Tailwind CSS build output
│       │   ├── notifications.js    # Toast notification system
│       │   ├── retry.js            # Request retry logic
│       │   ├── setup.js            # Setup page functionality
│       │   ├── settings.js         # Settings page functionality
│       │   └── favicon.svg         # Favicon
│       └── templates/      # Go HTML templates
│           ├── base.html           # Base layout
│           ├── setup.html          # Setup page
│           ├── home.html           # Dashboard
│           ├── devices.html        # Device listing
│           ├── search.html         # Search page
│           ├── settings.html       # Settings page
│           └── admin/              # Admin panel templates
├── tests/                  # Test documentation
│   └── TESTING_GUIDE.md
├── input.css              # Tailwind CSS input
├── tailwind.config.js     # Tailwind configuration
├── package.json           # Node.js dependencies
├── Makefile              # Build commands
└── README.md             # This file
```

### Build Commands

```bash
# Build CSS (development)
make build-css

# Build CSS (watch mode)
npx tailwindcss -i ./input.css -o ./internal/server/static/output.css --watch

# Build Go binary
make build

# Run locally
make run

# Run tests
make test

# Run linters
make lint

# Clean build artifacts
make clean
```

### Adding New Pages

1. Create template in `internal/server/templates/`
2. Add route in `internal/server/server.go`
3. Add navigation link in `base.html` (if needed)
4. Rebuild and test

### Modifying Styles

1. Edit `input.css` or add Tailwind classes to templates
2. Rebuild CSS: `make build-css`
3. Rebuild binary: `make build` (embeds CSS)
4. Restart server

## Testing

### Manual Testing

See `tests/TESTING_GUIDE.md` for comprehensive test procedures.

**Quick Test:**
```bash
# Start server
./bin/manuals-webui serve

# Navigate to http://localhost:3000
# Follow setup flow
# Test device listing, search, settings
```

### Playwright Testing

The application has been tested with Playwright MCP for E2E testing:

- Setup flow validation
- Navigation testing
- Device listing and filtering
- Search functionality
- Settings management
- Admin panel verification
- Error handling
- Loading states

See `tests/TESTING_GUIDE.md` for detailed test cases.

## Troubleshooting

### CSS Not Loading

**Symptom:** Pages appear unstyled

**Solution:**
```bash
# Rebuild CSS
make build-css

# Rebuild binary (embeds CSS)
make build

# Restart server
```

### 404 Errors for Static Files

**Symptom:** Console shows 404 for `/static/notifications.js`, etc.

**Cause:** Binary built without static files embedded

**Solution:**
```bash
# Ensure all files exist
ls internal/server/static/

# Rebuild binary
make build
```

### CORS Errors

**Symptom:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause:** API server doesn't allow browser-based requests

**Solution:**
- Configure CORS on Manuals API server
- Allow origins: your WebUI URL
- Allow headers: `X-API-Key`, `Content-Type`
- Allow methods: `GET`, `POST`, `PUT`, `DELETE`

### Session Lost on Page Refresh

**Symptom:** Redirected to `/setup` unexpectedly

**Cause:** Normal behavior - `sessionStorage` clears on tab close

**Workaround:**
- Keep tab open
- Or reconfigure each session (takes 10 seconds)

**Future Enhancement:**
- Consider encrypted `localStorage` option
- Or server-side session with HTTP-only cookies

### API Connection Test Fails

**Symptom:** Setup page shows "Connection failed"

**Possible Causes:**
1. API server not running
2. Wrong API URL
3. Invalid API key
4. CORS not enabled
5. Network/firewall issue

**Debugging:**
```bash
# Test API directly
curl -H "X-API-Key: your-key" http://manuals.local:8080/api/2025.12/status

# Check server logs
./bin/manuals-webui serve --log-level debug

# Check browser console (F12) for errors
```

### Build Errors

**Error:** `tailwindcss: command not found`

**Solution:**
```bash
npm install
```

**Error:** `cannot find package "github.com/joho/godotenv"`

**Solution:**
```bash
go mod download
go mod tidy
```

## Features

### Implemented

- ✅ Device browsing with filters
- ✅ Full-text search
- ✅ Document downloads
- ✅ Admin panel (UI)
- ✅ Browser-based configuration
- ✅ Toast notifications
- ✅ Loading states
- ✅ Session expiration handling
- ✅ Offline detection
- ✅ Request retry logic
- ✅ Mobile responsive
- ✅ Keyboard shortcuts

### Planned

- ⏳ Automated Playwright test suite
- ⏳ Dark mode
- ⏳ Search history
- ⏳ Print stylesheets
- ⏳ Remember me (encrypted localStorage)
- ⏳ Advanced admin operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test`
5. Run linters: `make lint`
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Issues:** https://github.com/rmrfslashbin/manuals-webui/issues
- **Documentation:** See `tests/TESTING_GUIDE.md`
- **API Documentation:** See Manuals API repository

---

Generated with [Claude Code](https://claude.com/claude-code)

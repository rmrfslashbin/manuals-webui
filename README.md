# manuals-webui

Web UI for the Manuals documentation platform.

## Overview

A Go-based web application using htmx and Tailwind CSS that provides a browser interface for the Manuals REST API. Features include:

- Device browser with domain/type filtering
- Full-text search with live results
- Document browser and downloads
- Responsive design

## Requirements

- Go 1.21+
- Access to a running Manuals API instance

## Installation

```bash
go install github.com/rmrfslashbin/manuals-webui/cmd/manuals-webui@latest
```

Or build from source:

```bash
git clone https://github.com/rmrfslashbin/manuals-webui.git
cd manuals-webui
make build
```

## Usage

```bash
# Set required environment variables
export MANUALS_API_URL="http://manuals.local:8080"
export MANUALS_API_KEY="your-api-key"

# Start the server
./manuals-webui serve

# Or with flags
./manuals-webui serve --port 3000 --api-url http://localhost:8080
```

The web UI will be available at `http://localhost:3000`.

## Configuration

| Environment Variable | Flag | Default | Description |
|---------------------|------|---------|-------------|
| `MANUALS_API_URL` | `--api-url` | `http://localhost:8080` | Manuals API URL |
| `MANUALS_API_KEY` | `--api-key` | (required) | API key for authentication |
| `MANUALS_SERVER_HOST` | `--host` | `0.0.0.0` | Host to bind to |
| `MANUALS_SERVER_PORT` | `--port` | `3000` | Port to listen on |
| `MANUALS_LOG_LEVEL` | `--log-level` | `info` | Log level |

## Development

```bash
# Run locally
make run

# Run tests
make test

# Run linters
make lint

# Build binary
make build
```

## Tech Stack

- **Go** - Backend server
- **htmx** - Dynamic HTML updates without JavaScript
- **Tailwind CSS** - Utility-first CSS framework (via CDN)
- **html/template** - Go's standard templating

## License

MIT License - see [LICENSE](LICENSE) for details.

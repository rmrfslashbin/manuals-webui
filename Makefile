# Makefile for manuals-webui

BINARY_NAME=manuals-webui
VERSION?=$(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
GIT_COMMIT=$(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIME=$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS=-ldflags "-X main.version=$(VERSION) -X main.gitCommit=$(GIT_COMMIT) -X main.buildTime=$(BUILD_TIME)"

.PHONY: all build clean test coverage vet staticcheck deadcode lint check install-tools help

all: check build

## Build targets

build: build-css ## Build the binary
	@mkdir -p bin
	go build $(LDFLAGS) -o bin/$(BINARY_NAME) ./cmd/manuals-webui

build-css: ## Build Tailwind CSS
	@./node_modules/.bin/tailwindcss -i ./input.css -o ./internal/server/static/output.css --minify

build-linux: ## Build for Linux amd64
	@mkdir -p bin
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-linux-amd64 ./cmd/manuals-webui

build-darwin: ## Build for macOS amd64
	@mkdir -p bin
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-darwin-amd64 ./cmd/manuals-webui

build-darwin-arm64: ## Build for macOS arm64
	@mkdir -p bin
	GOOS=darwin GOARCH=arm64 go build $(LDFLAGS) -o bin/$(BINARY_NAME)-darwin-arm64 ./cmd/manuals-webui

build-all: build-linux build-darwin build-darwin-arm64 ## Build for all platforms

clean: ## Remove build artifacts
	rm -rf bin coverage.out coverage.html

## Test targets

test: ## Run tests
	go test -v ./...

coverage: ## Run tests with coverage
	go test -coverprofile=coverage.out ./...
	go tool cover -func=coverage.out

coverage-html: coverage ## Generate HTML coverage report
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

## Analysis targets

vet: ## Run go vet
	go vet ./...

staticcheck: ## Run staticcheck
	@which staticcheck > /dev/null 2>&1 || (echo "Installing staticcheck..." && go install honnef.co/go/tools/cmd/staticcheck@latest)
	staticcheck ./...

deadcode: ## Run deadcode analysis
	@which deadcode > /dev/null 2>&1 || (echo "Installing deadcode..." && go install golang.org/x/tools/cmd/deadcode@latest)
	deadcode ./...

lint: vet staticcheck deadcode ## Run all linters

check: lint test ## Run all checks (lint + test)

## Dependency targets

tidy: ## Tidy go modules
	go mod tidy

deps: ## Download dependencies
	go mod download

install-tools: ## Install analysis tools
	go install honnef.co/go/tools/cmd/staticcheck@latest
	go install golang.org/x/tools/cmd/deadcode@latest

## Development

run: ## Run locally
	go run ./cmd/manuals-webui serve

## Help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

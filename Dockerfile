# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /build

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build - no CGO needed, templates/static are embedded
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags "-s -w" \
    -o manuals-webui \
    ./cmd/manuals-webui

# Runtime stage
FROM alpine:3.20

# Install CA certificates for HTTPS API calls
RUN apk add --no-cache ca-certificates wget

# Create non-root user
RUN addgroup -g 1000 manuals && \
    adduser -u 1000 -G manuals -s /bin/sh -D manuals

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/manuals-webui /app/manuals-webui

# Use non-root user
USER manuals

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:3000/health || exit 1

# Run the binary
ENTRYPOINT ["/app/manuals-webui"]
CMD ["serve"]

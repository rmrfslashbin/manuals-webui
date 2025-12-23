# Build stage - compile Vue app with Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for OIDC configuration (embedded at build time)
ARG VITE_API_URL=https://api.manuals.local
ARG VITE_OIDC_AUTHORITY=
ARG VITE_OIDC_CLIENT_ID=

# Build the Vue app
RUN npm run build

# Runtime stage - serve with nginx
FROM nginx:alpine

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built Vue app from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Install wget for healthcheck
RUN apk add --no-cache wget

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

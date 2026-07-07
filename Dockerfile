# Multi-stage Dockerfile for building and serving the Vite app with nginx
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Install system build dependencies required for native modules (node-gyp)
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 build-essential g++ make python3-dev ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Ensure `python` points to `python3`
RUN ln -sf /usr/bin/python3 /usr/bin/python || true

# Optional build args for injecting environment at build time
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_APP_URL
ARG VITE_TERMINAL_WS_URL

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY:-}
ENV VITE_APP_URL=${VITE_APP_URL:-}
ENV VITE_TERMINAL_WS_URL=${VITE_TERMINAL_WS_URL:-}

# Install dependencies
COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

FROM nginx:stable-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf || true
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ============================================================
# FinTrack Pro — Frontend Dockerfile
# Stage 1: Build with Node.js + Vite
# Stage 2: Serve with Nginx
# ============================================================

# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ---- Runtime Stage (Nginx) ----
FROM nginx:alpine AS runtime

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our config
COPY nginx.conf /etc/nginx/conf.d/

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy SPA redirect file
COPY public/_redirects /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

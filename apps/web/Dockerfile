FROM node:22-alpine AS builder
RUN npm install -g pnpm

WORKDIR /app

# Copy monorepo configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web

# Install dependencies and build frontend
RUN pnpm install --frozen-lockfile
WORKDIR /app/apps/web
RUN pnpm run build

# Runner stage using Nginx
FROM nginx:alpine

# Copy built frontend assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Write a simple Nginx configuration to support SPA routing (React Router)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

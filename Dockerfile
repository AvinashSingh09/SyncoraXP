FROM node:22-slim AS builder
WORKDIR /app
RUN npm install -g pnpm

# Copy monorepo configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api

# Install dependencies and build API
RUN pnpm install --frozen-lockfile
WORKDIR /app/apps/api
RUN pnpm run build

# Prune devDependencies to keep image small
WORKDIR /app
RUN CI=true pnpm install --prod --frozen-lockfile

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts and production node_modules
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Copy database migrations for schema updates
COPY database/migrations ./database/migrations

# Set working directory to the API application
WORKDIR /app/apps/api
EXPOSE 3000

CMD ["node", "dist/server.js"]

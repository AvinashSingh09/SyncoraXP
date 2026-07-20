FROM node:22 AS builder
# Install build essentials for compiling native C++ addons (@livekit/rtc-node)
RUN apt-get update && apt-get install -y build-essential python3 && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm

WORKDIR /app

# Copy monorepo configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/translation-worker apps/translation-worker

# Install dependencies and build translation worker
RUN pnpm install --frozen-lockfile
WORKDIR /app/apps/translation-worker
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
COPY --from=builder /app/apps/translation-worker/dist ./apps/translation-worker/dist
COPY --from=builder /app/apps/translation-worker/package.json ./apps/translation-worker/package.json
COPY --from=builder /app/apps/translation-worker/node_modules ./apps/translation-worker/node_modules

# Set working directory to the translation-worker application
WORKDIR /app/apps/translation-worker

CMD ["node", "dist/main.js"]

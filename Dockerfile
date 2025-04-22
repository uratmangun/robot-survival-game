# ---- Build Stage ----
FROM node:lts-alpine AS builder
WORKDIR /app

# Copy project files
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Enable pnpm & install all deps
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install
# Build the Next.js app
RUN pnpm run build

# ---- Runtime Image ----
FROM node:lts-alpine AS runner
WORKDIR /app

# Runtime env vars
ENV NODE_ENV=production

# Copy manifest for pnpm
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Runtime uses dependencies from builder; no install step needed
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies and build output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env* ./

# No port exposed – accessed internally by Cloudflare tunnel
CMD ["pnpm", "run", "start"]

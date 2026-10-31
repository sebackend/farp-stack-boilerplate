# ─── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Copy manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/tsconfig ./packages/tsconfig
COPY packages/shared ./packages/shared

# Copy web app files
COPY apps/web/package.json ./apps/web/package.json
COPY apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY apps/web/tsconfig.build.json ./apps/web/tsconfig.build.json
COPY apps/web/vite.config.ts ./apps/web/vite.config.ts
COPY apps/web/index.html ./apps/web/index.html

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/shared build
COPY apps/web/src ./apps/web/src
RUN pnpm --filter web build

# ─── Stage 2: nginx ───────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Copy Vite build output
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Nginx configuration for the SPA (React Router)
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

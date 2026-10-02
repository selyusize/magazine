# syntax=docker/dockerfile:1
# Medusa: один образ для migrate / server / worker (режим задаёт MEDUSA_WORKER_MODE).
# Контекст сборки — корень репозитория.

ARG NODE_VERSION=24
ARG PNPM_VERSION=11.25.0

FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

# --- сборка: зависимости + medusa build (backend + админка) → .medusa/server
FROM base AS build
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-backend,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY backend/ ./
RUN pnpm build

# --- рантайм: только собранный сервер и prod-зависимости
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/.medusa/server ./
COPY backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./
# static — загрузки file-local; на проде туда монтируется volume, он наследует владельца node
RUN --mount=type=cache,id=pnpm-backend,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile \
 && mkdir -p /app/static \
 && chown -R node:node /app
USER node
EXPOSE 9000
CMD ["pnpm", "start"]

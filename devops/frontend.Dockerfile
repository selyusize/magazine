# syntax=docker/dockerfile:1
# Next.js (standalone). Контекст сборки — корень репозитория:
# нужен backend/openapi/store.oas.json для генерации клиента Orval.

ARG NODE_VERSION=24
ARG PNPM_VERSION=11.25.0

FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /repo/frontend

FROM base AS deps
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-frontend,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /repo/frontend/node_modules ./node_modules
COPY frontend/ ./
COPY backend/openapi/ /repo/backend/openapi/
# NEXT_PUBLIC_* вшиваются в клиентский бандл на этапе сборки
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY} \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /repo/frontend/.next/standalone ./
COPY --from=build --chown=node:node /repo/frontend/.next/static ./.next/static
COPY --from=build --chown=node:node /repo/frontend/public ./public
# Кеш Next (ISR / data cache / images) — монтируется volume, чтобы переживать редеплой
RUN mkdir -p .next/cache && chown node:node .next/cache
USER node
EXPOSE 3000
CMD ["node", "server.js"]

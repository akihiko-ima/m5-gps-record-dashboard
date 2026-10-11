# syntax=docker/dockerfile:1

# better-sqlite3 はネイティブモジュールのため、動かすマシンでビルドする（docker compose up -d が自動でビルドする）
ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# better-sqlite3 は同梱のビルド済みバイナリ（prebuilds/）を使うため、ソースからのビルド（install script）は行わない
RUN npm ci --no-audit --no-fund --ignore-scripts \
 && node -e "new (require('better-sqlite3'))(':memory:').close()"

FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* はビルド時に埋め込まれる
ARG NEXT_PUBLIC_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
ENV NEXT_PUBLIC_TILE_URL=${NEXT_PUBLIC_TILE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# postbuild で public・.next/static を .next/standalone にコピーする
RUN npm run build

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATA_DIR=/data
COPY --from=build --chown=node:node /app/.next/standalone ./
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "server.js"]

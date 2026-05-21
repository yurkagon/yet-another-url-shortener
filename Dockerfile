# ─── Gathering all dependencies ──────────────────────────────────────────────────────────────
FROM node:24-slim AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

# ─── Gathering only production dependencies ───────────────────────────────────────────────────
FROM node:24-slim AS deps-prod
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts --omit=dev

# ─── Taking all dependencies and building the application ─────────────────────────────────────────────────────────────────
FROM node:24-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run db:generate
RUN npm run build

# ─── Running using production dependencies ──────────────────────────────────────────────────────────────────
FROM node:24-slim AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && apt-get upgrade -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

RUN groupadd -r app && useradd -r -g app app

COPY --chown=app:app --from=deps-prod /app/node_modules ./node_modules
COPY --chown=app:app --from=builder /app/dist ./dist
COPY --chown=app:app --from=builder /app/generated ./generated
COPY --chown=app:app --from=builder /app/package.json ./package.json

USER app

EXPOSE 3000

CMD ["node", "dist/src/main"]

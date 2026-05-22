# ─── deps ────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

# ─── builder ─────────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run db:generate
RUN npm run build:api

# ─── runner ──────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER app

EXPOSE 3000

CMD ["node", "dist/src/main"]

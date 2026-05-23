# AGENTS.md — Yet Another URL Shortener

Project overview and conventions for AI agents and contributors.

---

## Stack

| Layer      | Technology                                     |
| ---------- | ---------------------------------------------- |
| API        | NestJS 11, TypeScript, Express                 |
| Frontend   | Next.js (App Router), React, TanStack Query v5 |
| Database   | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| Cache      | Redis via ioredis                              |
| Auth       | JWT (access + refresh), httpOnly cookies       |
| Passwords  | argon2                                         |
| Validation | class-validator + class-transformer            |
| Testing    | Jest, Supertest (unit + e2e)                   |

Node ≥ 24 is required (`engines` field in `package.json`).

---

## Repository layout

```
/
├── src/                      # NestJS API
│   ├── api/
│   │   ├── auth/             # register, login, logout, refresh, /me
│   │   ├── link/             # CRUD + redirect + QR + CSV export
│   │   ├── statistics/       # browser / country / timeline breakdowns
│   │   └── user/             # internal user service only
│   ├── common/
│   │   └── decorators/       # @Authorization, @AuthorizedUser, @ClientIp, @UserAgent, @Cookies
│   ├── config/               # env constants, IS_DEV_ENV
│   ├── infra/
│   │   ├── prisma/           # PrismaService
│   │   └── redis/            # RedisService (get / save / retrieve / del)
│   └── bootstrap/            # Swagger/Scalar setup
├── prisma/
│   ├── schema/               # split schema: schema.prisma, user.prisma, link.prisma, click.prisma
│   └── seed.ts               # dev seed: 1 user, 30 links, 150 clicks
├── test/
│   └── e2e/                  # in-memory store mocks (no real DB/Redis in tests)
│       ├── mocks/            # prisma.mock.ts, redis.mock.ts, e2e-store.ts
│       └── helpers/          # createE2eApp, registerUser
└── web/                      # Next.js frontend
    └── src/
        ├── app/              # App Router pages
        ├── components/       # UI components (paper design system)
        ├── hooks/            # TanStack Query hooks
        └── services/         # API client (class-based, see below)
```

---

## Running the project

```bash
# Infrastructure (Postgres + Redis)
npm run dev:db

# API + frontend together
npm run dev

# API only
npm run dev:api

# Frontend only
npm run dev:web

# Seed dev data (1 user: dev@example.com / password123, 30 links, 150 clicks)
npm run db:seed
```

### Tests

```bash
npm test                  # unit tests (Jest)
npm run test:e2e          # e2e tests (in-memory, no DB required)
npm run test:all          # both, sequentially
```

### Database

```bash
npm run db:push           # apply schema to DB (no migrations)
npm run db:generate       # regenerate Prisma client after schema changes
npm run db:view           # Prisma Studio
```

---

## Architecture decisions

### `id` vs `code` split

`Link` has two identifiers:

- `id` (UUID) — database PK, FK target for `Click`, used for all **mutations** (`PATCH`, `DELETE`)
- `code` (nanoid 8) — short slug for public URLs (`/l/:code`, QR, stats, `GET /link/:code`), user-editable

Changing a slug does not break DB relations. Redis cache is keyed by `code`; invalidate on update/delete via `redisService.del('link:short-code:<code>')`.

### Auth flow

Two httpOnly cookies: `access_token` (short-lived) + `refresh_token` (long-lived).  
`POST /v1/auth/refresh` rotates both tokens.  
`@Authorization()` guard on protected routes; user injected via `@AuthorizedUser()`.

### Redis `retrieve` pattern

```typescript
await redisService.retrieve<T>({ key, ttl, strategy: async () => fetchFromDB() });
```

Cache-aside: checks Redis first, calls `strategy()` on miss, stores result.  
Use `redisService.del(key)` to invalidate manually.

### IP detection (`@ClientIp`)

Priority order:

1. `cf-connecting-ip` (Cloudflare)
2. `req.ip` (Express, requires `trust proxy`)
3. `req.socket.remoteAddress`
4. `'unknown'`

In `NODE_ENV !== 'production'` returns `''` (stored as `'unknown'` in DB).

### Controller routing order

`GET /link/export/csv` must be registered **before** `GET /link/:code` to avoid NestJS matching the literal `export` as a code param. Same pattern for any literal segment before a wildcard.

### Statistics

Each breakdown (`browser`, `country`, `timeline`) is a separate endpoint.  
Stats use Prisma relation filter: `where: { link: { code } }` — no extra lookup round-trip.  
GeoIP via `geoip-country`. Browser parsing via `ua-parser-js`.

---

## API routes

All API routes are versioned under `/v1`.

| Method | Path                               | Auth | Description                          |
| ------ | ---------------------------------- | ---- | ------------------------------------ |
| POST   | /v1/auth/register                  | —    | Register + set cookies               |
| POST   | /v1/auth/login                     | —    | Login + set cookies                  |
| POST   | /v1/auth/logout                    | ✓    | Clear cookies                        |
| POST   | /v1/auth/refresh                   | —    | Rotate access + refresh tokens       |
| GET    | /v1/auth/me                        | ✓    | Current user                         |
| GET    | /v1/link                           | ✓    | Paginated links (search/status/sort) |
| POST   | /v1/link                           | ✓    | Create link → returns short URL      |
| PATCH  | /v1/link/:id                       | ✓    | Update by `id` (url/slug/archived)   |
| DELETE | /v1/link/:id                       | ✓    | Delete by `id`                       |
| GET    | /v1/link/export/csv                | ✓    | Download all links as CSV            |
| GET    | /v1/link/:code                     | ✓    | Get link by `code`                   |
| GET    | /v1/link/:code/qr                  | ✓    | PNG QR code                          |
| GET    | /l/:code                           | —    | Redirect (302), records click        |
| GET    | /v1/statistics/link/:code/browser  | ✓    | Browser breakdown                    |
| GET    | /v1/statistics/link/:code/country  | ✓    | Country breakdown                    |
| GET    | /v1/statistics/link/:code/timeline | ✓    | Daily clicks (last N days)           |

---

## Database schema

```
User        id (uuid PK), name, email (unique), password (argon2)
Link        id (uuid PK), code (unique), originalUrl, isArchived, userId (FK→User)
Click       id (uuid PK), linkId (FK→Link), ipAddress, userAgent
```

Cascade deletes: User→Links, Link→Clicks.  
`Click` has `@@index([linkId])`.

---

## Frontend services (`web/src/services/`)

Abstract base class pattern:

```
ApiService (abstract)          — protected request<T>(), protected baseUrl
  ├── AuthService              — register / login / logout / me
  │   └── User, AuthResponse
  ├── LinkService              — list / create / getByCode / update / delete / exportCsv / qrUrl
  │   └── Link, LinkListParams, PaginatedLinks
  └── StatisticsService        — browser / country / timeline
      └── DailyClick
```

Singleton instances exported from `index.ts`: `authService`, `linkService`, `statisticsService`.  
Interfaces live in the same file as their class, **below** the class declaration.

---

## Coding conventions

- **Access modifiers**: always explicit — `public`, `protected`, or `private` on every class member.
- **Interfaces**: declared at the **bottom** of the file, after the class.
- **Mutations use `id`**: PATCH/DELETE always take `id` (UUID). `code` is only for read/public routes.
- **DTO validation**: all input via class-validator DTOs; `whitelist: true` + `forbidNonWhitelisted: true` globally.
- **Paths**: `@/` alias maps to `src/` in the API and `src/` in the web app.
- **E2E tests**: never touch real DB or Redis; use `E2eStore` (in-memory arrays) and mock factories in `test/e2e/mocks/`.
- **No `any`**: strict TypeScript throughout. Unknown external data is cast explicitly.
- **Environment**: loaded via `@dotenvx/dotenvx`. `IS_DEV_ENV = process.env.NODE_ENV !== 'production'`.

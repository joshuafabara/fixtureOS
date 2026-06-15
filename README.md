# FixtureOS

Fixture management system for sports organizations — AI-assisted scheduling with human review and approval.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Drizzle ORM** + **PostgreSQL 16**
- **NextAuth v4** (JWT, CredentialsProvider)
- **Tailwind CSS** + Radix UI

---

## Option A — DDEV (recommended)

Requires [DDEV](https://ddev.readthedocs.io/en/stable/users/install/) and Docker (Colima on macOS).

```bash
# 1. Start DDEV (first run installs deps + runs migrations automatically)
ddev start

# 2. Seed the database with demo data
ddev exec npm run db:seed

# 3. Open the app
ddev launch
```

The app is now available at **https://fixtureos.ddev.site**

### DDEV daily workflow

```bash
ddev start          # start all services + Next.js dev server
ddev stop           # stop all services
ddev exec <cmd>     # run any command inside the web container
ddev exec npm run db:seed    # re-seed (drops & recreates data)
ddev exec npm run db:studio  # open Drizzle Studio
ddev ssh            # open a shell in the web container
ddev logs -f        # tail all logs
```

> **Note:** `DATABASE_URL` and `NEXTAUTH_*` env vars are injected automatically by DDEV — you do **not** need a `.env.local` when using DDEV.

---

## Option B — Docker Compose (local PostgreSQL only)

A `docker-compose.yml` ships with the repo to spin up PostgreSQL without DDEV.

```bash
# 1. Start the database
docker compose up -d

# 2. Copy env and fill in values
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL to:
# postgresql://postgres:postgres@localhost:5432/fixtureos

# 3. Install dependencies
nvm use   # uses .nvmrc (Node 20)
npm install

# 4. Run migrations + seed
npm run db:migrate
npm run db:seed

# 5. Start dev server
npm run dev
```

App runs at **http://localhost:3000**

---

## Option C — Fully native (nvm + Homebrew PostgreSQL)

```bash
# Prerequisites: nvm, Homebrew, PostgreSQL 16
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb fixtureos

# Copy env
cp .env.example .env.local
# Set: DATABASE_URL=postgresql://<your-user>@localhost:5432/fixtureos

# Install + setup
nvm use
npm install
npm run db:migrate
npm run db:seed

npm run dev
```

---

## Environment variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/fixtureos` |
| `NEXTAUTH_SECRET` | JWT signing secret (min 32 chars) | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App base URL (must match deployment) | `http://localhost:3000` |
| `APP_PUBLIC_URL` | Same as NEXTAUTH_URL | `http://localhost:3000` |

Copy `.env.example` to `.env.local` and fill in values before running locally.

---

## Available scripts

```bash
npm run dev          # Start Next.js dev server (port 3000, hot reload)
npm run build        # Production build
npm run start        # Start production server (requires build first)
npm run lint         # ESLint

npm run db:generate  # Generate Drizzle migration files from schema changes
npm run db:migrate   # Apply pending migrations to the database
npm run db:push      # Push schema directly (dev only — skips migration files)
npm run db:studio    # Open Drizzle Studio (browser DB GUI)
npm run db:seed      # Seed demo data (Liga Deportiva Quito + Copa Alpha 2026)

npm run test         # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests (requires app running on :3000)
npm run test:e2e:ui  # Open Playwright interactive UI runner
```

---

## Demo credentials

After seeding (`npm run db:seed` / `ddev exec npm run db:seed`):

| Field | Value |
|---|---|
| Email | `admin@fixtureos.dev` |
| Password | `admin1234` |
| Organization | Liga Deportiva Quito |
| Tournament | Copa Alpha 2026 |

---

## First-time setup checklist

- [ ] Start database (DDEV / Docker Compose / Homebrew)
- [ ] Copy `.env.example` → `.env.local` and fill values *(skip if using DDEV)*
- [ ] `npm install`
- [ ] `npm run db:migrate`
- [ ] `npm run db:seed`
- [ ] `npm run dev` and open http://localhost:3000

---

## Testing

### Unit tests (Vitest)

```bash
npm run test
```

No running server needed — these test pure logic in `lib/`.

### E2E tests (Playwright)

Playwright tests require the app to be running with a seeded database.

**First time only — install browser:**
```bash
npx playwright install chromium
```

**Run the tests:**
```bash
# 1. Make sure the app is running (in a separate terminal):
npm run dev        # or: ddev start (DDEV handles this automatically)

# 2. Run E2E tests:
npm run test:e2e

# Or open the interactive Playwright UI:
npm run test:e2e:ui
```

**What the tests cover:**
- Login page renders with email/password fields
- Unauthenticated users are redirected to `/login`
- Successful login with seed credentials lands on dashboard
- Wrong credentials show an error message
- Authenticated access to: dashboard, tournaments, teams, context, dry-run, clubs, categories
- Dry run generation flow (conditional on seeded eligible categories)

> **Note for DDEV:** Run `npm run test:e2e` from your local machine pointing at `http://localhost:3000`, or proxy through the DDEV URL by setting `baseURL` in `playwright.config.ts`.

---

## Project structure

```
app/
  (auth)/          # Login page (unauthenticated)
  (app)/           # All authenticated app pages
    dashboard/
    tournaments/
    categories/
    teams/
    context/       # AI context management (org, tournament, category, date)
    dry-run/       # Fixture review & approval
    fixture/       # Fixture viewer (Phase 5+)
components/
  ui/              # Headless Radix UI components
  context/         # Context editor client components
  dry-run/         # Dry run review client components
lib/
  auth/            # NextAuth config + session helpers
  db/              # Drizzle client, schema, seed
  context/         # Mock context parser
  fixture-engine/  # Slot generator, eligibility validator, scheduler, orchestrator
drizzle/           # Migration files (auto-generated)
tests/             # Vitest unit tests + Playwright E2E tests
```

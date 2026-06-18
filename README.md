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
# 1. Start DDEV (installs deps + runs migrations automatically)
ddev start

# 2. Seed the database with demo data  ← first time only, or after a db:reset
ddev exec npm run db:seed

# 3. Open the app
ddev launch
```

The app is now available at **https://fixtureos.ddev.site**

> **Why is `db:seed` a manual step?** Seeding drops and recreates all demo data. Running it automatically on every `ddev start` would wipe any data you've added. Run it once on first setup, or any time you want to reset back to demo data.

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

npm run test         # Run Vitest unit tests (181 tests, no server needed)
npm run test:smoke   # Run Playwright smoke tests (31 screen-load checks)
npm run test:e2e     # Run full Playwright E2E suite
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
- All 21 static routes load without a server error (smoke)
- Dynamic routes: tournaments, clubs, fixtures, context, dry-run, standings, import wizard steps

**Running via DDEV:**
```bash
ddev exec "npm test"            # 181 unit tests (no browser needed)
ddev exec "npm run test:smoke"  # 31 smoke tests (Playwright inside container)
```

Playwright auto-starts the dev server if nothing is on port 3000 (`reuseExistingServer: true`). The first run inside DDEV requires installing the browser once:
```bash
ddev exec "npx playwright install chromium --with-deps"
```

---

## Screens

| Route | Description |
|---|---|
| `/dashboard` | Overview: fixture health, upcoming matches, quick actions |
| `/tournaments` | Tournament list |
| `/tournaments/new` | Create tournament — name, sport, start method (empty / import / Drupal) |
| `/tournaments/[id]` | Tournament detail — tabs for fixture, categories, clubs, data health |
| `/import` | Import wizard step 1 — choose mode (create / update) and source |
| `/imports` | Import history — all batches with status, source, and actions |
| `/imports/[id]/mapping` | Step 2 — column mapping table + preview rows + validation summary |
| `/imports/[id]/diff` | Step 3 — diff review: new clubs/cats/teams, renames, color changes, missing |
| `/imports/[id]/errors` | Error resolution — split-panel list of ambiguous/duplicate rows |
| `/imports/[id]/confirm` | Final confirmation + import summary stats |
| `/fixture` | Fixture list |
| `/fixture/[id]` | Fixture viewer |
| `/fixture/[id]/edit` | Manual match editor |
| `/fixture/[id]/history` | Fixture version history |
| `/dry-run` | Dry-run list |
| `/dry-run/[id]` | Dry-run detail — AI audit, change viewer, apply patches |
| `/clubs` | Club list |
| `/clubs/[id]` | Club detail |
| `/context` | AI context dashboard |
| `/context/organization` | Org-level context editor |
| `/context/tournament/[id]` | Tournament context |
| `/context/category/[id]` | Category context |
| `/context/date` | Date context |
| `/context/history` | Context version history |
| `/context/compare` | Compare two context snapshots |
| `/matches` | Match list |
| `/audit` | AI audit log |
| `/exports` | Data exports |
| `/communications` | Comms / notifications |
| `/standings/import` | Import standings from image via AI |
| `/settings/courts` | Court management |
| `/settings/organization` | Org settings |
| `/settings/users` | User management |

---

## Import sources

The import wizard (`/import`) supports four sources:

| Source | How it works |
|---|---|
| **Excel** (.xlsx / .xls) | Parsed server-side with ExcelJS; auto-detects Club / Equipo / Categoría / Color columns |
| **CSV** | RFC 4180 parser; same column aliases as Excel |
| **Image / screenshot** | Uploaded image sent to OpenAI GPT-4o vision; returns per-row confidence scores |
| **Drupal JSON:API** | Fetches from a JSON:API endpoint; maps `field_club`, `title`, `field_category` |

All sources produce a unified `ImportPreview` shape. The wizard then:
1. Shows a column-mapping table (non-image) or confidence-annotated preview (image)
2. Computes a **diff** against the existing tournament data (update mode) — new clubs, new categories, new teams, renames, color changes, missing teams, duplicates, ambiguous matches
3. Lets you decide per-row (keep / rename / retire / ignore)
4. Resolves ambiguous rows in a dedicated error-resolution panel
5. Confirms — upserts clubs, categories, teams; applies diff decisions; records to audit log

---

## Project structure

```
app/
  (auth)/login/        # Login page (unauthenticated)
  (app)/               # All authenticated app pages
    dashboard/
    tournaments/
    import/            # Import wizard step 1
    imports/[id]/      # Wizard steps 2–4: mapping, diff, errors, confirm
    fixture/[id]/
    dry-run/[id]/
    clubs/[id]/
    context/
    matches/
    audit/
    exports/
    communications/
    standings/
    settings/
  api/                 # API routes
    tournaments/       # CRUD
    imports/           # batch + parse + mapping + diff + errors + confirm
    imports/csv/       # CSV parse shorthand
    imports/image/     # Image extract shorthand

components/
  ui/                  # shadcn/Radix UI primitives
  import/              # ImportWizard, MappingReview, DiffReview, ErrorResolution, WizardSteps, ConfirmButton
  tournaments/         # CreateTournamentForm
  dry-run/             # AuditPanel, DryRunChangesViewer, RegenerateButton
  fixture/             # FixtureViewerClient, MatchEditor
  layout/              # Sidebar, Topbar, Providers
  shared/              # PageStub, shared atoms

lib/
  auth/                # NextAuth config + session helpers (getSession, requireOrg)
  db/schema/           # Drizzle schema: tournaments, clubs, categories, teams, importBatches, auditLogs …
  imports/             # excel.ts · csv.ts · image.ts · diff.ts
  ai/                  # standings-extractor.ts · fixture-auditor.ts · fixture-editor.ts
  fixture-engine/      # Slot generator, eligibility validator, scheduler, orchestrator
  context/             # Mock context parser

drizzle/               # Migration SQL files (auto-generated by drizzle-kit)
__tests__/             # Vitest unit tests (181 tests)
tests/e2e/             # Playwright smoke + E2E tests (31 smoke tests)
design/                # JSX design prototypes (reference only, not shipped)
docs/                  # Feature documentation by version (v3 → v4)
```

# Fixture Organizer App — Claude Code Implementation Plan V3

## 1. Implementation Strategy

Build incrementally. Do not start with AI. First create data model, auth, CRUD, imports, fixture engine skeleton, dry-run/versioning workflow, then AI parsing.

## 2. Recommended Project Structure

```
fixture-organizer/
├── app/
├── components/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── drupal/
│   ├── fixture-engine/
│   ├── ai/
│   ├── imports/
│   ├── exports/
│   ├── audit/
│   └── validators/
├── workers/
├── prisma/ or drizzle/
├── docs/v3/
└── tests/
```

## 3. Milestones

### Milestone 1 — Foundation

- Next.js app.
- PostgreSQL connection.
- Auth email/password.
- Organization scoping.
- Base layout.
- Users and settings.

### Milestone 2 — Core Data

- Tournaments CRUD.
- Clubs/categories/teams models.
- Courts and court availability.
- Club contacts.
- Audit logs.

### Milestone 3 — Imports

- Excel import.
- Drupal JSON:API import.
- Import preview and confirmation.

### Milestone 4 — Contexts and Game Modes

- Context prompt storage.
- Parsed constraint storage.
- Manual structured preview.
- Game mode templates.
- Category start date and game mode activation rule.

### Milestone 5 — Fixture Engine

- Round robin generator.
- Group generator.
- Playoff bracket from standings.
- Slot generation from court calendars.
- Conflict validation.

### Milestone 6 — Dry Run and Versioning

- Dry-run generation.
- Diff storage.
- Approval creates fixture version.
- History and compare.
- Restore creates new version.

### Milestone 7 — Manual Edit Mode

- Drag/drop schedule UI.
- Swap matches.
- Generate dry-run warnings for manual edits.
- Commit manual edit as new version.

### Milestone 8 — AI Integration

- Prompt to structured constraints.
- Image-assisted standings extraction.
- Diff explanations.

### Milestone 9 — Exports and Public Pages

- Excel export.
- PDF export.
- Image export.
- Public published fixture routes only.

## 4. API Routes

Suggested endpoints:

- `POST /api/auth/login`
- `GET /api/tournaments`
- `POST /api/tournaments`
- `GET /api/tournaments/:id`
- `POST /api/imports/excel`
- `POST /api/imports/drupal-sync`
- `POST /api/contexts/parse`
- `POST /api/contexts/confirm`
- `POST /api/fixtures/dry-run`
- `POST /api/dry-runs/:id/approve`
- `GET /api/fixtures/:id/versions`
- `GET /api/fixtures/:id/compare`
- `POST /api/fixtures/:id/manual-edit`
- `GET /api/clubs`
- `PATCH /api/club-contacts/:id`
- `POST /api/exports`

## 5. Testing Priorities

- Constraint hierarchy.
- Locked match protection.
- Manual override persistence.
- Court conflict detection.
- Team overlap detection.
- Dry-run diff accuracy.
- Version rollback behavior.
- WhatsApp validation.
- Organization data isolation.

## 6. Do Not Implement in MVP

- Evolution API sending.
- Drupal SSO.
- Automatic standings calculation from custom tie-breakers.
- Venues.
- Full role permission matrix.


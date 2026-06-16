# Fixture Organizer App — System Architecture V3

## 1. Recommended Stack

Frontend and application backend: Next.js, React, TypeScript.

Database: PostgreSQL for Fixture App operational data.

Queue/Workers: Redis + BullMQ or equivalent for imports, AI parsing, fixture generation, dry runs, exports.

AI: OpenAI API for structured context parsing, image/table interpretation, and human-readable explanations.

External source: Drupal JSON:API for organizations, clubs, teams, categories, and tournaments when configured.

Storage: S3-compatible storage for uploaded files and generated exports.

## 2. Architecture Overview

```
User Browser
  ↓
Next.js Frontend
  ↓
Next.js API / Backend Services
  ↓
PostgreSQL Fixture App DB
  ↓
Workers / Queue
  ↓
OpenAI API, Drupal JSON:API, File Storage
```

## 3. Data Ownership

Drupal owns imported business entities when connected:

- Organizations.
- Clubs.
- Teams.
- Categories.
- Tournaments.

Fixture App owns operational entities:

- Users for MVP auth.
- Courts.
- Contacts.
- Prompts.
- Parsed constraints.
- Fixture versions.
- Matches.
- Dry runs.
- Manual overrides.
- Audit logs.
- Exports.

## 4. Multi-Tenant Model

MVP supports organization-based multi-tenancy using `organization_id` on all tenant-owned records.

Future multi-backend Drupal support should use tenant configuration:

```
tenant_id
organization_id
drupal_base_url
drupal_client_id
drupal_client_secret
drupal_jsonapi_paths
```

Initial deployment can use environment variables for a single Drupal backend.

## 5. Backend Modules

- Auth Module.
- Organization Module.
- Drupal Sync Module.
- Import Module.
- Context Module.
- AI Parser Module.
- Fixture Engine Module.
- Dry Run Module.
- Versioning Module.
- Manual Edit Module.
- Contacts Module.
- Export Module.
- Audit Module.
- Public Portal Module.

## 6. AI Boundary

AI must not directly commit fixture changes.

AI may:

- Parse prompts into JSON constraints.
- Extract standings from images.
- Extract retired teams from prompts/images.
- Explain diffs and constraint violations.

Deterministic backend code must:

- Generate matches.
- Resolve constraints.
- Validate conflicts.
- Create dry runs.
- Commit versions.

## 7. Worker Jobs

Recommended jobs:

- `import.drupal.sync`.
- `import.excel.parse`.
- `ai.context.parse`.
- `ai.image.parse`.
- `fixture.generate`.
- `fixture.dry_run`.
- `fixture.commit_version`.
- `export.excel`.
- `export.pdf`.
- `export.image`.

## 8. Publication Architecture

Fixtures and fixture dates can be Draft, Published, or Archived.

Public routes can only read published dates/fixtures and must not expose contacts, admin metadata, contexts, dry runs, or audit logs.

## 9. Security

- Organization isolation is mandatory.
- Every query must be scoped by organization.
- Passwords must be hashed.
- Uploaded files must be access-controlled.
- Public routes must only expose published records.
- Audit all destructive or version-changing actions.

## 10. Environment Variables

Example:

```
DATABASE_URL=
REDIS_URL=
OPENAI_API_KEY=
DRUPAL_BASE_URL=
DRUPAL_CLIENT_ID=
DRUPAL_CLIENT_SECRET=
STORAGE_BUCKET=
STORAGE_REGION=
APP_PUBLIC_URL=
```


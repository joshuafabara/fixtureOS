# Fixture Organizer App — Claude Design Brief V3

## 1. Goal

Design a modern SaaS web app called Fixture Organizer for sports tournament fixture generation and management.

Primary language: Spanish.
Desktop-first. Responsive later.

## 2. Product Personality

- Professional.
- Clear.
- Visual.
- Trustworthy.
- Admin-friendly.
- Designed for tournament organizers under time pressure.

## 3. Most Important UX Concepts

1. Fixture visualization.
2. Dry-run diff approval.
3. Version history and comparison.
4. Prompt-based rule entry with structured preview.
5. Manual drag/drop schedule editing.
6. Club contacts with WhatsApp readiness.
7. Category colors.

## 4. Required Screens

Create 24 screens:

1. Login
2. Dashboard
3. Tournaments List
4. Tournament Detail
5. Import Wizard
6. Organization Context
7. Tournament Context
8. Category Context
9. Date Context
10. Fixture Builder
11. Dry Run Review
12. Fixture Viewer
13. Manual Edit Mode
14. Fixture History
15. Version Compare
16. Standings Import
17. Standings Review
18. Clubs Directory
19. Club Detail
20. Communications Directory
21. Courts Management
22. Users Management
23. Organization Settings
24. Audit Log / Export Center

If needed, split Audit Log and Export Center into two screens.

## 5. Highest Priority Screens

Polish these first:

- Dashboard.
- Tournament Detail.
- Fixture Viewer.
- Dry Run Review.
- Version Compare.
- Clubs Directory.
- Manual Edit Mode.

## 6. Visual Requirements

- Use category color badges throughout.
- Use status pills for Draft, Published, Archived.
- Use severity indicators for Info, Warning, Conflict.
- Make diffs very visual: before/after cards, arrows, changed fields highlighted.
- Fixture should support Date Card view and Calendar view.
- Manual Edit Mode should feel like a scheduling board.

## 7. Spanish Labels Examples

- Torneos
- Fixture
- Categorías
- Fechas
- Canchas
- Clubes
- Contactos
- Revisión de Cambios
- Historial de Versiones
- Comparar Versiones
- Publicado
- Borrador
- Archivado
- Advertencia
- Conflicto
- Aprobar
- Rechazar

## 8. Club Contacts Requirement

Design a Clubs Directory page where users can:

- Filter by category.
- Search by text.
- See primary WhatsApp number.
- Edit WhatsApp inline.
- Add contact if empty.
- See missing WhatsApp warnings.

Phone helper text:

`Formato: código de país + número. Ejemplo: 593998375914`

## 9. Dry Run UX

Dry Run Review must make the user confident before approval.

Show:

- Summary counts.
- Added/moved/removed/forfeit changes.
- Warnings and conflicts.
- Before/after visual comparison.
- Approve button only when critical conflicts are resolved or explicitly accepted.

## 10. Versioning UX

Design version history like Git for fixtures.

Each version shows:

- Version number.
- State.
- Created by.
- Date.
- Reason.
- Actions: View, Compare, Restore, Publish, Archive.

Rollback creates a new version; do not imply overwriting old versions.

## 11. Public Fixture UX

Public fixture pages expose only published dates. No admin controls. Clean and mobile-friendly later.


# FixtureOS — Claude Design Brief V3.1

## 1. Goal

Design a modern SaaS web app called FixtureOS for multi-sport tournament fixture generation and management.

Primary language: Spanish.
Desktop-first. Responsive later.

## 2. Product Personality

- Professional.
- Clear.
- Visual.
- Trustworthy.
- Admin-friendly.
- Designed for tournament organizers under time pressure.

## 3. Typeface Direction

Use a modern grotesque typeface feel.

Target inspiration:

- Vercel.
- Linear.
- Notion.
- Figma.

Use a clean neutral grotesque similar to Geist, General Sans, Söhne, or Suisse Int'l.

Include a monospace accent for data and numbers:

- Match IDs.
- Dates.
- Times.
- Court identifiers.
- Version numbers.

Avoid overly playful geometric fonts. Avoid traditional enterprise/government typography.

## 4. Most Important UX Concepts

1. Fixture visualization.
2. Dry-run diff approval.
3. Version history and comparison.
4. Context management as a first-class rules engine.
5. Prompt-based rule entry with structured preview.
6. Manual drag/drop schedule editing.
7. Club contacts with WhatsApp readiness.
8. Category colors.

## 5. Required Screens

Create 28 screens if Audit Log and Export Center are combined, or 29 screens if they are separated.

1. Login
2. Dashboard
3. Tournaments List
4. Tournament Detail
5. Import Wizard
6. Context Dashboard
7. Organization Context
8. Tournament Context
9. Category Context
10. Date Context
11. Context Version History
12. Context Compare
13. Context Impact Simulator
14. Fixture Builder
15. Dry Run Review
16. Fixture Viewer
17. Manual Edit Mode
18. Fixture History
19. Version Compare
20. Standings Import
21. Standings Review
22. Clubs Directory
23. Club Detail
24. Communications Directory
25. Courts Management
26. Users Management
27. Organization Settings
28. Audit Log / Export Center

If needed, split Audit Log and Export Center into two screens.

## 6. Highest Priority Screens

Polish these first:

- Dashboard.
- Tournament Detail.
- Context Dashboard.
- Category Context.
- Date Context.
- Context Impact Simulator.
- Fixture Viewer.
- Dry Run Review.
- Version Compare.
- Clubs Directory.
- Manual Edit Mode.

## 7. Context Management Design Requirement

The Context Management module is a first-class workflow in FixtureOS. Do not design it as a simple settings form.

The app needs rich screens for:

- Organization Context.
- Tournament Context.
- Category Context.
- Date Context.
- Context Dashboard.
- Context Version History.
- Context Compare.
- Context Impact Simulator.

Every context screen must show:

- Current active rules.
- Inherited rules where applicable.
- Prompt input area.
- Example prompts.
- Parsed structured preview.
- Warnings and conflicts.
- Context version information.
- Path to simulate impact or generate a dry run.

The Category Context screen must clearly show whether the category is eligible for fixture generation based on start date and game mode. It must include a visual game mode preview.

The Date Context screen must be calendar/date focused and show affected matches.

## 8. Visual Requirements

- Use category color badges throughout.
- Use status pills for Draft, Published, Archived.
- Use severity indicators for Info, Warning, Conflict.
- Make diffs very visual: before/after cards, arrows, changed fields highlighted.
- Fixture should support Date Card view and Calendar view.
- Manual Edit Mode should feel like a scheduling board.
- Context screens should feel like a rules engine/control center.
- Use inherited-rule and override indicators.
- Use compact cards for parsed rules and active constraints.

## 9. Context UX Components

Create reusable components for:

- Context Scope Badge.
- Active Rule Card.
- Inherited Rule Indicator.
- Override Indicator.
- Parsed Preview Panel.
- Rule Diff Row.
- Constraint Hierarchy Explainer.
- Rule Conflict Warning.
- Impact Summary Cards.
- Prompt Example Chips.
- Game Mode Preview Card.
- Category Eligibility Panel.
- Context Version Timeline.

## 10. Spanish Labels Examples

General:

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

Context-specific:

- Contexto
- Reglas Activas
- Reglas Heredadas
- Sobrescritura
- Vista Previa Interpretada
- Simular Impacto
- Generar Revisión de Cambios
- Historial de Contextos
- Comparar Contextos
- Fecha Específica
- Contexto de Categoría
- Categoría Elegible
- Falta Fecha de Inicio
- Falta Modo de Juego
- Confirmar Contexto
- Descartar Cambios
- Reglas en Conflicto

## 11. Club Contacts Requirement

Design a Clubs Directory page where users can:

- Filter by category.
- Search by text.
- See primary WhatsApp number.
- Edit WhatsApp inline.
- Add contact if empty.
- See missing WhatsApp warnings.

Phone helper text:

`Formato: código de país + número. Ejemplo: 593998375914`

## 12. Dry Run UX

Dry Run Review must make the user confident before approval.

Show:

- Summary counts.
- Added/moved/removed/forfeit changes.
- Warnings and conflicts.
- Before/after visual comparison.
- Approve button only when critical conflicts are resolved or explicitly accepted.

## 13. Versioning UX

Design version history like Git for fixtures and contexts.

Each version shows:

- Version number.
- State.
- Created by.
- Date.
- Reason.
- Actions: View, Compare, Restore, Publish, Archive.

Rollback creates a new version; do not imply overwriting old versions.

## 14. Public Fixture UX

Public fixture pages expose only published dates. No admin controls. Clean and mobile-friendly later.

## 15. Direct Claude Design Instruction

Use this as the instruction prompt:

```text
Design FixtureOS, a Spanish-first modern SaaS platform for multi-sport tournament fixture generation. The product uses AI-assisted prompt parsing, deterministic fixture generation, dry-run approval, version history, manual drag/drop schedule editing, and club WhatsApp contact readiness.

The Context Management module is a first-class rules engine. Design Organization Context, Tournament Context, Category Context, Date Context, Context Dashboard, Context Version History, Context Compare, and Context Impact Simulator as core workflows. Do not make them simple settings forms.

Every context screen must include active rules, inherited rules when applicable, prompt input, example prompts, parsed structured preview, warnings/conflicts, context version metadata, and actions to simulate impact or generate a dry run.

Category Context must clearly show fixture eligibility based on start date and game mode, and include a visual game mode/bracket preview.

Date Context must be calendar-based and show affected matches.

Use a modern grotesque typography direction with monospace accents for dates, times, courts, match IDs, and version numbers.
```

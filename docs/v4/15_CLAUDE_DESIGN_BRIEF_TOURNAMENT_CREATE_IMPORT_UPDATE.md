# FixtureOS — Claude Design Brief V3.2: Tournament Create, Import, and Update

## 1. Goal

Design the missing FixtureOS screens for creating tournaments, importing tournament data, updating existing tournament data, resolving import issues, and completing post-import category setup.

These screens should match the existing FixtureOS visual design and Spanish-first UX.

## 2. Why This Matters

Users need a clear way to start a tournament inside an organization. They may start from an empty tournament, from Excel/CSV, from an image/screenshot, or from Drupal JSON:API.

Later, tournament data may change: new categories, new teams, new clubs, renamed teams, retired teams, or category colors. FixtureOS must support updating an existing tournament safely without silently breaking fixtures.

## 3. Required New Screens

Design these screens:

1. Create Tournament — `/tournaments/new`
2. Tournament Update — `/tournaments/:id/edit`
3. Tournament Import Wizard — `/tournaments/import`
4. Existing Tournament Import Wizard — `/tournaments/:id/import`
5. Import Mapping Review — `/imports/:id/mapping`
6. Import Diff Review — `/imports/:id/diff`
7. Import Error Resolution — `/imports/:id/errors`
8. Post-Import Fixture Setup — `/tournaments/:id/setup`
9. Import History, optional but recommended — `/imports`

## 4. Highest Priority Screens

Polish these first:

- Create Tournament.
- Tournament Import Wizard.
- Import Diff Review.
- Import Error Resolution.
- Post-Import Fixture Setup.
- Tournament Update.

## 5. UX Principles

1. Importing data should feel safe and reversible.
2. Updating a tournament must be diff-first.
3. Never imply data will be deleted automatically.
4. Clearly separate imported source data from confirmed FixtureOS data.
5. Make warnings visible but not scary when they are resolvable.
6. Always show the path from import to fixture generation.
7. Make category readiness extremely clear: start date + game mode required.
8. Use Spanish-first labels.

## 6. Create Tournament Screen

### Required UI

- Basic tournament details.
- Start method selection.
- Empty tournament option.
- Import from file option.
- Import from Drupal option.
- Clear CTA to continue.

### Suggested Layout

```text
[Crear Torneo]

Nombre del torneo
Deporte opcional
Temporada/Año
Descripción
Estado: Borrador

¿Cómo quieres empezar?
[Crear vacío]
[Importar Excel/CSV/Imagen]
[Importar desde Drupal]

[Cancelar] [Guardar Borrador] [Continuar]
```

## 7. Tournament Update Screen

### Required UI

- Metadata form.
- Data summary.
- Fixture summary.
- Last import summary.
- CTAs to update data, edit context, generate dry run.

### Suggested Layout

```text
[Editar Torneo: Copa Alpha]

Metadata
Data Summary
Fixture Summary
Import History Snapshot

Actions:
[Actualizar Datos]
[Editar Contexto]
[Ir al Fixture]
[Guardar]
```

## 8. Import Wizard

### Must Support

- Create mode.
- Update mode.
- Excel.
- CSV.
- Image/screenshot.
- Drupal JSON:API.

### Important UI Difference

In create mode:

```text
This import will create a new tournament dataset.
```

In update mode:

```text
This import will compare against the existing tournament. No fixture changes will be applied until dry-run approval.
```

## 9. Import Mapping Review

Design a table that maps file/image/API fields to FixtureOS fields.

Required mapped fields:

- Club name.
- Team name.
- Category name.
- Category color.
- Team status.
- Notes.

Show:

- Detected columns.
- User-selected target fields.
- Preview rows.
- Validation summary.
- CTA to confirm mapping or resolve errors.

## 10. Import Diff Review

This is the most important new screen.

### Required Summary Cards

- New clubs.
- New categories.
- New teams.
- Updated records.
- Warnings.
- Potential fixture impacts.

### Required Diff Table Columns

- Change type.
- Entity.
- Current value.
- Imported value.
- Suggested action.
- User decision.

### Visual Requirements

Use strong visual diff language:

- Added rows.
- Changed rows.
- Warning rows.
- Ambiguous rows.
- Retired team rows.

Do not use destructive colors for missing-from-source rows unless user explicitly marks them retired or removed.

## 11. Import Error Resolution

Design this as a focused review workflow.

Required issue types:

- Missing team name.
- Missing category.
- Ambiguous club match.
- Duplicate team candidate.
- Invalid color.
- Team appears in multiple categories.
- Low confidence image extraction.

Each issue should offer actions:

- Link to existing entity.
- Create new entity.
- Edit imported row.
- Ignore row.
- Mark team retired.

## 12. Post-Import Fixture Setup

After import, users need to define category start dates and game modes.

Required UI:

- Import summary.
- Category readiness table.
- Bulk prompt input.
- Parsed preview.
- Per-category setup action.
- CTA to generate fixture dry run.

### Category Readiness Table

Columns:

- Color.
- Category.
- Teams.
- Start date.
- Game mode.
- Fixture eligible.
- Action.

Clear statuses:

- Eligible.
- Missing start date.
- Missing game mode.
- Missing both.

## 13. Tournament Detail Updates

Update the existing Tournament Detail design to include these CTAs:

- Crear Fixture.
- Importar Datos.
- Actualizar Datos.
- Continuar Setup.
- Ver Historial de Importaciones.

Also add a Data Health section:

- Categories missing start date.
- Categories missing game mode.
- Teams without club.
- Clubs missing WhatsApp.
- Last import.

## 14. Optional Import History Screen

Recommended if Claude Design can add it.

Purpose: list all imports and their statuses.

Columns:

- Date.
- Tournament.
- Source.
- Mode.
- Status.
- Summary.
- Actions.

## 15. Spanish Labels

Use these labels:

- Crear Torneo
- Editar Torneo
- Importar Datos
- Actualizar Datos
- Crear desde Importación
- Actualizar Torneo Existente
- Revisar Mapeo
- Resolver Problemas
- Revisión de Cambios
- Confirmar Importación
- Categorías Nuevas
- Equipos Nuevos
- Clubes Nuevos
- Advertencias
- Ignorar Fila
- Crear Nuevo
- Vincular Existente
- Equipo Retirado
- Mantener Existente
- Falta Fecha de Inicio
- Falta Modo de Juego
- Categoría Inactiva
- Categoría Elegible
- Generar Fixture Dry Run
- Simular Impacto
- Ver Historial de Importaciones

## 16. Exact Prompt for Claude Design

```text
Design the missing FixtureOS tournament creation and import/update workflows.

Use the existing FixtureOS design system. Spanish-first. Desktop-first.

Add these screens:
1. Create Tournament
2. Tournament Update
3. Tournament Import Wizard for new tournaments
4. Tournament Import Wizard for existing tournaments
5. Import Mapping Review
6. Import Diff Review
7. Import Error Resolution
8. Post-Import Fixture Setup
9. Optional Import History

The import workflow must support Excel, CSV, image/screenshot, and Drupal JSON:API.

The same import system must work in two modes:
- Create a new tournament from imported data.
- Update an existing tournament with a new file/image/API source.

For updates, design a clear diff review showing new clubs, new categories, new teams, changed category colors, renamed teams, retired teams, duplicates, ambiguous matches, and rows missing from the new source.

Existing data must never appear as automatically deleted. Missing-from-source items should be shown as warnings with user decisions.

After import, categories missing start date or game mode must be shown as inactive in a Post-Import Fixture Setup screen. This screen should allow bulk prompt input for start dates and game modes, show parsed preview, and provide a CTA to generate a fixture dry run.

Any import/update that affects an existing fixture must show impact simulation and dry-run review before committing fixture changes.
```

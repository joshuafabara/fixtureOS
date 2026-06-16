# FixtureOS — Tournament Create, Import, and Update Addendum V3.2

## 1. Purpose

This addendum defines missing screens and workflows for creating tournaments inside an organization, importing tournament data, and updating an existing tournament with a new Excel, CSV, image/screenshot, or Drupal JSON:API source.

The goal is to let organization admins start a tournament from scratch or from imported data, review extracted clubs/categories/teams, resolve issues, define missing category setup, and then generate or update the fixture through the existing dry-run/versioning system.

## 2. Core Principle

Tournament creation and tournament updates must never silently change fixture data.

All imported data must pass through:

1. Upload / source selection.
2. Parsing or extraction.
3. Mapping review.
4. Validation.
5. Import diff review.
6. User confirmation.
7. Fixture impact simulation where applicable.
8. Dry run before fixture changes are committed.

## 3. New Required Screens

Add these screens to Claude Design scope:

1. Create Tournament — `/tournaments/new`
2. Tournament Update — `/tournaments/:id/edit`
3. Tournament Import Wizard — `/tournaments/import`
4. Tournament Import Wizard for Existing Tournament — `/tournaments/:id/import`
5. Import Mapping Review — `/imports/:id/mapping`
6. Import Diff Review — `/imports/:id/diff`
7. Import Error Resolution — `/imports/:id/errors`
8. Post-Import Fixture Setup — `/tournaments/:id/setup`

These screens are in addition to the existing Tournament List, Tournament Detail, Fixture Builder, Context, Dry Run, and Versioning screens.

## 4. Create Tournament Page

Route: `/tournaments/new`

Purpose: create a tournament shell inside an organization.

The page should support two paths:

1. Create manually.
2. Create from import.

### Required Fields

- Tournament name.
- Sport, optional and generic.
- Season or year, optional.
- Description, optional.
- Default language, Spanish by default.
- Default state: Draft.
- Tournament color/theme, optional.

### Primary Actions

- Save Draft Tournament.
- Continue to Import Data.
- Create Empty Tournament.

### Wireframe

```text
[Crear Torneo]

Basic Info
--------------------------------------------------
Nombre del torneo: [ Copa Alpha 2026          ]
Deporte:           [ Genérico / Basketball ▼   ]
Temporada/Año:     [ 2026                      ]
Descripción:       [ textarea                  ]
Estado inicial:    [ Borrador                  ]

How do you want to start?
--------------------------------------------------
( ) Crear torneo vacío
( ) Importar equipos/categorías desde archivo
( ) Importar desde Drupal JSON:API

Actions
--------------------------------------------------
[Cancelar] [Guardar Borrador] [Continuar]
```

## 5. Tournament Update Page

Route: `/tournaments/:id/edit`

Purpose: edit tournament metadata and provide a clear entry point to update data or context.

### Required Sections

- Tournament metadata.
- Current import source summary.
- Categories summary.
- Fixture status summary.
- Update data CTA.
- Context CTA.
- Fixture dry-run CTA.

### Wireframe

```text
[Editar Torneo: Copa Alpha]

Tournament Metadata
--------------------------------------------------
Nombre:      [ Copa Alpha ]
Deporte:     [ Genérico ▼ ]
Temporada:   [ 2026 ]
Estado:      [ Borrador / Publicado / Archivado ]

Data Summary
--------------------------------------------------
Clubs: 18
Categorías: 9
Equipos: 76
Última importación: Excel · hace 2 días

Fixture Summary
--------------------------------------------------
Última versión: V5
Estado: Borrador
Fechas publicadas: 3
Dry runs pendientes: 1

Actions
--------------------------------------------------
[Actualizar Datos del Torneo]
[Editar Contexto del Torneo]
[Ir al Fixture Builder]
[Guardar Cambios]
```

## 6. Tournament Import Wizard

Routes:

- Create mode: `/tournaments/import`
- Update mode: `/tournaments/:id/import`

Purpose: import clubs, teams, categories, and category colors into a new or existing tournament.

### Import Modes

The wizard must clearly show whether the user is:

- Creating a new tournament from imported data.
- Updating an existing tournament.

### Sources

Supported sources:

1. Excel file.
2. CSV file.
3. Image or screenshot.
4. Drupal JSON:API endpoint.

### Source Selection Wireframe

```text
[Importar Datos del Torneo]

Mode
--------------------------------------------------
Modo: [Crear nuevo torneo / Actualizar torneo existente]
Torneo destino: [Copa Alpha ▼]  // only for update mode

Choose Source
--------------------------------------------------
[ Excel ]     Upload .xlsx or .xls
[ CSV ]       Upload .csv
[ Imagen ]    Upload screenshot/photo
[ Drupal ]    JSON:API endpoint

Helper Text
--------------------------------------------------
Puedes importar clubes, categorías, equipos y colores de categoría.
La importación no cambiará el fixture hasta que revises y apruebes un dry run.

Actions
--------------------------------------------------
[Cancelar] [Continuar]
```

## 7. Excel / CSV Upload Requirements

Supported data:

- Club name.
- Team name.
- Category name.
- Category color if present.
- Team status if present.
- Notes if present.

The app should not require a single strict template at first, but should show a mapping screen.

### Mapping Screen

Route: `/imports/:id/mapping`

Purpose: let the user confirm how columns map to FixtureOS fields.

### Wireframe

```text
[Revisar Mapeo de Importación]

Detected Columns
--------------------------------------------------
Column A: Club          -> [Club Name ▼]
Column B: Team          -> [Team Name ▼]
Column C: Category      -> [Category Name ▼]
Column D: Color         -> [Category Color ▼]
Column E: Status        -> [Team Status ▼]

Preview Rows
--------------------------------------------------
Club       | Team              | Category | Color | Status
Spartans   | Spartans U14M     | U14M     | Blue  | Active
CVU        | CVU U16F          | U16F     | Green | Active

Validation
--------------------------------------------------
✓ 76 teams detected
✓ 9 categories detected
! 3 rows missing club name
! 1 duplicate team candidate

Actions
--------------------------------------------------
[Volver] [Confirmar Mapeo] [Resolver Errores]
```

## 8. Image Import Requirements

Images may contain tables, colored category headers, screenshots, or marked retired teams.

Image import must always show extracted data for confirmation.

### Image Import Screen Behavior

- Upload image.
- User adds instruction prompt.
- AI extracts probable clubs/categories/teams/colors/statuses.
- User reviews confidence and mappings.
- User confirms or edits extracted rows.

### Prompt Examples

```text
Los equipos marcados en rojo están retirados. Ignóralos para la creación inicial.
```

```text
Cada columna representa una categoría. Usa los colores de encabezado como color de la categoría.
```

```text
Extrae clubes, equipos y categorías de esta imagen. Si hay dudas, márcalas para revisión.
```

### Wireframe

```text
[Importar desde Imagen]

Upload
--------------------------------------------------
[Drop image here]

Instruction Prompt
--------------------------------------------------
Describe cómo interpretar la imagen...
[textarea]

Extracted Preview
--------------------------------------------------
Confidence | Club | Team | Category | Color | Status | Action
92%        | CVU  | CVU U14M | U14M | Blue | Active | Edit
64%        | ?    | Andes    | U16F | Red  | Retired? | Review

Actions
--------------------------------------------------
[Reintentar extracción] [Confirmar Datos] [Resolver Dudas]
```

## 9. Import Diff Review

Route: `/imports/:id/diff`

Purpose: show what will change before confirming an import, especially for existing tournaments.

### Diff Types

- New club.
- New category.
- New team.
- Updated category color.
- Updated team name.
- Team moved category.
- Team marked retired.
- Removed from source but exists in app.
- Duplicate candidate.
- Ambiguous match.

### Update Behavior Defaults

When updating existing tournament data:

- New clubs are added.
- New categories are added but inactive until start date + game mode exist.
- New teams are added to their categories.
- Existing teams are matched by normalized name + category + club where possible.
- Renames are suggested, not automatically applied without confirmation.
- Missing teams in the new upload are not deleted automatically.
- If the user marks teams as retired, future matches become forfeits by default.
- Category colors may be updated after confirmation.

### Wireframe

```text
[Revisión de Cambios de Importación]

Summary Cards
--------------------------------------------------
[+ 3 Clubes]
[+ 2 Categorías]
[+ 14 Equipos]
[~ 5 Actualizaciones]
[! 4 Advertencias]

Diff Table
--------------------------------------------------
Type        | Entity           | Current       | New             | Action
New Club    | Titanes          | -             | Titanes         | Add
New Category| U18F             | -             | U18F            | Add inactive
Update Team | Spartans U14     | Spartans U14  | Spartans U14M   | Confirm rename
Warning     | Andes            | Existing      | Missing source  | Keep existing

Actions
--------------------------------------------------
[Cancelar]
[Resolver Advertencias]
[Confirmar Importación]
```

## 10. Import Error Resolution

Route: `/imports/:id/errors`

Purpose: resolve ambiguous or invalid imported rows.

### Error Types

- Missing team name.
- Missing category.
- Ambiguous club match.
- Duplicate team candidate.
- Invalid category color.
- Team appears in multiple categories.
- Image extraction low confidence.

### Wireframe

```text
[Resolver Problemas de Importación]

Issue List
--------------------------------------------------
1. Duplicate team candidate: Spartans U14
2. Missing category on row 18
3. Low confidence extraction: Los Andes / Andes

Selected Issue
--------------------------------------------------
Imported Row:
Club: Spartans
Team: Spartans U14
Category: U14M

Suggested Resolution:
( ) Match existing team: Spartans U14M
( ) Create new team
( ) Ignore row
( ) Edit manually

Actions
--------------------------------------------------
[Previous] [Save Resolution] [Next]
```

## 11. Post-Import Fixture Setup

Route: `/tournaments/:id/setup`

Purpose: after import, help user complete missing category requirements before generating fixture.

This is different from Category Context because it is a bulk setup screen.

### Required Behavior

Show every category and whether it has:

- Start date.
- Game mode.
- Team count.
- Color.
- Fixture eligibility.

Allow bulk prompt input:

```text
Todas las categorías empiezan el 15 de julio. U14 y U16 usan 2 grupos, top 2 a semifinales. U18 usa todos contra todos ida y vuelta.
```

AI/deterministic parser should preview parsed category setup before saving.

### Wireframe

```text
[Setup del Torneo Después de Importar]

Import Summary
--------------------------------------------------
Clubs: 18
Categories: 9
Teams: 76
Needs setup: 6 categories

Category Readiness Table
--------------------------------------------------
Color | Category | Teams | Start Date | Game Mode | Eligible | Action
Blue  | U14M     | 8     | Missing    | Missing   | No       | Setup
Green | U16F     | 6     | Jul 15     | Missing   | No       | Setup
Red   | Senior   | 10    | Jul 20     | RR x1     | Yes      | Edit

Bulk Category Prompt
--------------------------------------------------
Describe start dates and game modes for categories...
[textarea]

Parsed Preview
--------------------------------------------------
U14M: Start Jul 15, 2 groups, top 2 semifinal/final
U16F: Start Jul 15, single round robin
Senior: No change

Actions
--------------------------------------------------
[Guardar Setup]
[Ir a Contexto de Categorías]
[Generar Fixture Dry Run]
```

## 12. Tournament Detail Updates

The existing Tournament Detail page should add prominent CTAs:

- Create Fixture.
- Import Data.
- Update Data.
- Continue Setup.
- View Import History.

### Updated Tournament Detail Wireframe Section

```text
[Tournament Detail: Copa Alpha]

Top Actions
--------------------------------------------------
[Crear Fixture]
[Importar Datos]
[Actualizar Datos]
[Continuar Setup]
[Generar Dry Run]

Data Health
--------------------------------------------------
Categories missing start date: 3
Categories missing game mode: 4
Teams without club: 2
Clubs missing WhatsApp: 5
Last import: Excel · V2 · 2 days ago
```

## 13. Import History

Recommended missing screen:

Route: `/imports`

Purpose: show all imports across organization/tournaments.

Optional but recommended for MVP if time allows.

### Wireframe

```text
[Historial de Importaciones]

Filters:
Tournament | Source Type | Status | Date Range

Table:
Date | Tournament | Source | Mode | Status | Summary | Actions
Today | Copa Alpha | Excel | Update | Confirmed | +14 teams | View Diff
Yesterday | Copa Beta | Image | Create | Needs Review | 3 warnings | Continue
```

## 14. Data Safety Rules

Tournament data import/update must follow these rules:

1. Never delete existing clubs/categories/teams automatically.
2. Missing rows in a new upload should be shown as `missing from source`, not deleted.
3. New categories are inactive until they have start date + game mode.
4. New teams in active categories should trigger fixture impact simulation.
5. Retired teams should default to future forfeits only after confirmation.
6. Imports that affect existing generated fixtures must require dry run approval.
7. Every confirmed import must create an audit log entry.
8. Every fixture-affecting import must create a new fixture version after dry-run approval.

## 15. Import Statuses

Import batches should support these statuses:

- Uploaded.
- Parsing.
- Needs Mapping.
- Needs Review.
- Needs Error Resolution.
- Ready to Confirm.
- Confirmed.
- Rejected.
- Failed.

## 16. Spanish Labels

Use Spanish-first labels:

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
- Generar Fixture Dry Run

## 17. Claude Design Instruction

Add this exact instruction to Claude Design:

```text
Design the missing FixtureOS tournament creation and import/update workflows.

Add screens for Create Tournament, Tournament Update, Tournament Import Wizard, Import Mapping Review, Import Diff Review, Import Error Resolution, Post-Import Fixture Setup, and optionally Import History.

The import workflow must support Excel, CSV, image/screenshot, and Drupal JSON:API sources. It must work in create mode for new tournaments and update mode for existing tournaments.

The update workflow must clearly show diffs: new clubs, new categories, new teams, renamed teams, category color changes, retired teams, ambiguous matches, and items missing from the new source. Existing data should never be deleted automatically.

After import, categories without start date or game mode must be marked inactive and shown in a Post-Import Fixture Setup screen. Users should be able to define start dates and game modes in bulk through a prompt and preview the parsed result before saving.

Any import/update that affects existing fixtures must lead to impact simulation and dry-run review before changes are committed.

Use Spanish-first UI labels and match the existing FixtureOS design system.
```

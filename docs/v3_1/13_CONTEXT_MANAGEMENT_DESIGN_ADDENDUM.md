# FixtureOS — Context Management Design Addendum V3.1

## 1. Purpose

This addendum upgrades Context Management from simple prompt input pages into a first-class product module. Context Management is the rule engine interface where organization admins define, review, version, simulate, and approve the rules that drive fixture generation.

Claude Design must treat these screens as core workflows, not secondary settings pages.

## 2. Context Management Principles

1. Contexts are the human-readable rules behind the fixture engine.
2. Every saved context creates a new context version.
3. Every context change must show parsed structured output before saving.
4. Every context change that affects fixtures must support impact simulation and dry-run generation.
5. Users must understand which rules are active, where they came from, and which rule wins when conflicts exist.
6. Context pages must be visual, confidence-building, and admin-friendly.

## 3. Context Scopes

FixtureOS supports these context scopes:

1. Organization Context — global rules for the organization.
2. Tournament Context — rules for one tournament.
3. Category Context — rules for one category inside a tournament.
4. Date Context — rules for a specific date or weekend.

## 4. Constraint Priority Reminder

Highest priority first:

1. Locked Past Matches.
2. Manual User Overrides.
3. Date Context.
4. Category Context.
5. Tournament Context.
6. Organization Context.
7. System Defaults.

Design must make this hierarchy easy to understand.

## 5. New Required Context Screens

Add these screens to the design scope:

25. Context Dashboard — `/context`
26. Context Version History — `/context/history`
27. Context Compare — `/context/compare`
28. Context Impact Simulator — `/context/impact-simulator`

These are in addition to the existing context screens:

6. Organization Context — `/context/organization`
7. Tournament Context — `/context/tournament/:id`
8. Category Context — `/context/category/:id`
9. Date Context — `/context/date`

Total design scope becomes 28 screens if Audit Log and Export Center remain combined, or 29 screens if they are split.

## 6. Context Dashboard

Route: `/context`

Purpose: give admins one place to understand all active rule layers.

Wireframe:

```text
[Context Dashboard]

Summary Cards:
[Organization Rules: 12 Active]
[Tournament Rules: 8 Active]
[Category Rules: 23 Active]
[Date Rules: 14 Active]
[Pending Impact Reviews: 2]

Active Rule Layers
------------------------------------------------------------
Scope        | Active Rules | Last Updated | Conflicts | Action
Organization | 12           | Yesterday    | 0         | Open
Tournament   | 8            | Today        | 1         | Open
Category     | 23           | Today        | 2         | Open
Date         | 14           | Today        | 0         | Open

Recent Context Changes
------------------------------------------------------------
Date | User | Scope | Summary | Created Version
```

UX requirements:

- Show context health/status.
- Show missing required category context, especially missing start dates and game modes.
- Show recent edits.
- Provide quick links to each context scope.
- Show conflict count when rules overlap.

## 7. Organization Context Screen

Route: `/context/organization`

Purpose: define default organization-wide rules.

Must include:

- Current active organization rules.
- Prompt editor.
- Example prompts.
- Parsed structured preview.
- Rule categories.
- Context version info.
- Button to simulate fixture impact.

Wireframe:

```text
[Organization Context]

Header:
Organization Rules | Current Version V4 | Last edited by Admin

Left Panel: Active Rules
--------------------------------------------------
✓ Default match duration: 60 min
✓ Play days: Friday, Saturday, Sunday
✓ Courts allowed: Court A, Court B
✓ Club grouping: soft enabled
✓ Priority: all categories equal

Center Panel: Prompt Editor
--------------------------------------------------
Describe global rules for all tournaments...
[textarea]

Examples:
- All tournaments use Court A and Court B.
- Games are Friday to Sunday from 8:00 to 21:00.
- Try to group teams from the same club close together.

[Parse Context]

Right Panel: Parsed Preview
--------------------------------------------------
Availability
Courts
Durations
Priorities
Club Grouping
Warnings

Actions:
[Save Context Version]
[Simulate Impact]
[Discard]
```

## 8. Tournament Context Screen

Route: `/context/tournament/:id`

Purpose: define tournament-specific overrides.

Must include:

- Tournament selector or header.
- Inherited organization rules.
- Tournament overrides.
- Prompt editor.
- Parsed preview.
- Impact summary before saving.

Wireframe:

```text
[Tournament Context: Alpha Cup]

Inherited From Organization
--------------------------------------------------
Default duration: 60 min
Default courts: Court A, Court B
Default play days: Fri-Sun

Tournament Overrides
--------------------------------------------------
Court A only
No games July 20-21
Senior priority 100

Prompt Editor
--------------------------------------------------
Describe tournament-specific rules...
[textarea]

Parsed Preview
--------------------------------------------------
Changed Rules
New Rules
Conflicting Rules
Affected Categories

Actions:
[Parse]
[Save Context Version]
[Simulate Impact]
[Generate Dry Run]
```

## 9. Category Context Screen

Route: `/context/category/:id`

Purpose: define category eligibility, start date, game mode, duration, priority, and restrictions.

This screen is critical because categories require start date and game mode before fixture inclusion.

Must include:

- Fixture eligibility status.
- Start date.
- Game mode status.
- Category color.
- Team count.
- Prompt editor.
- Game mode visual preview.
- Parsed structured preview.

Wireframe:

```text
[Category Context: U17 Masculino]

Eligibility Panel
--------------------------------------------------
Start Date: 2026-06-15 ✓
Game Mode: Groups + Semifinal + Final ✓
Teams: 8
Fixture Eligible: YES

If incomplete:
Start Date: Missing ✗
Game Mode: Missing ✗
Fixture Eligible: NO

Prompt Editor
--------------------------------------------------
Example:
U17 Masculino starts June 15. Use 2 groups, single round robin,
top 2 per group advance to semifinals and final. Games last 75 minutes.

[textarea]
[Parse Category Context]

Parsed Game Mode Preview
--------------------------------------------------
Groups: 2
Group Rounds: 1
Classification: Top 2 per group
Playoffs: Semifinal, Final
Duration: 75 min
Priority: inherited/equal

Visual Preview
--------------------------------------------------
Group A     Group B
Team 1      Team 5
Team 2      Team 6
Team 3      Team 7
Team 4      Team 8

Semifinals
A1 vs B2
B1 vs A2
Final
Winner SF1 vs Winner SF2

Actions:
[Confirm Game Mode]
[Simulate Impact]
[Generate Dry Run]
```

## 10. Date Context Screen

Route: `/context/date`

Purpose: define date-specific restrictions that override organization, tournament, and category context.

Must be calendar/date focused.

Wireframe:

```text
[Date Context]

Date Picker / Calendar
--------------------------------------------------
Selected Date: Saturday July 12, 2026

Existing Rules for Date
--------------------------------------------------
Spartans U16M cannot play
Crossover U14M only after 14:00
Court B unavailable after 18:00

Prompt Editor
--------------------------------------------------
Describe restrictions for this date...
[textarea]

Parsed Preview
--------------------------------------------------
Team Restrictions
Court Restrictions
Time Restrictions
Priority Overrides
Warnings

Affected Matches Preview
--------------------------------------------------
Match | Current Slot | Potential Issue | Suggested Change

Actions:
[Save Date Context]
[Simulate Impact]
[Generate Dry Run]
```

## 11. Context Version History

Route: `/context/history`

Purpose: audit and restore context rule changes.

Wireframe:

```text
[Context Version History]

Filters:
Scope: [All]
Tournament: [All]
Category: [All]
Date Range: [All]
User: [All]

Table:
Version | Scope | Target | Created By | Date | Summary | Actions
V12     | Date  | Jul 12 | Admin      | Today | Added restrictions | View | Compare | Restore
V11     | Category | U17M | Admin | Yesterday | Added game mode | View | Compare
V10     | Tournament | Alpha Cup | Admin | Yesterday | Added holidays | View
```

Rules:

- Restoring context creates a new context version.
- Do not overwrite historical versions.
- Restoring may trigger fixture impact simulation.

## 12. Context Compare

Route: `/context/compare`

Purpose: visually compare two context versions.

Wireframe:

```text
[Compare Context Versions]

Left: Version V10
Right: Version V12

Summary:
+ 3 Added Rules
~ 2 Changed Rules
- 1 Removed Rule
! 2 Potential Fixture Impacts

Diff View:
Rule Type | Before | After | Impact | Severity
Duration  | 60 min | 75 min | affects U17M | warning
Court     | A,B    | A only | moves 6 matches | warning
```

Design requirements:

- Use before/after visual cards.
- Highlight changed fields.
- Show impact estimates where available.
- Include CTA: `Simulate Fixture Impact`.

## 13. Context Impact Simulator

Route: `/context/impact-simulator`

Purpose: preview how a context change may affect fixtures before generating a full dry run.

Wireframe:

```text
[Context Impact Simulator]

Context Change:
Tournament Alpha Cup V4 -> V5

Impact Summary
--------------------------------------------------
Affected Fixture Versions: 1
Affected Categories: 4
Matches Potentially Moved: 18
Potential Forfeits: 0
Manual Overrides Preserved: 3
Locked Past Matches Unchanged: 42
Warnings: 5
Conflicts: 1

Affected Categories
--------------------------------------------------
Category | Impact | Severity | Details
U17M     | 8 matches moved | warning | Open
Senior   | priority changed | info | Open

Affected Dates
--------------------------------------------------
Date | Added | Moved | Conflicts | Action
Jul 12 | 0 | 6 | 1 | View
Jul 13 | 2 | 4 | 0 | View

Actions:
[Back to Context]
[Generate Full Dry Run]
[Discard Change]
```

Important distinction:

- Impact Simulator is a fast preview.
- Dry Run is the authoritative before/after proposal required before commit.

## 14. Context Components Needed

Claude Design should create reusable components:

- Context Scope Badge.
- Active Rule Card.
- Parsed Preview Panel.
- Rule Diff Row.
- Constraint Hierarchy Explainer.
- Rule Conflict Warning.
- Impact Summary Cards.
- Prompt Example Chips.
- Game Mode Preview Card.
- Category Eligibility Panel.
- Context Version Timeline.
- Inherited Rule Indicator.
- Override Indicator.

## 15. Spanish UI Labels

Use Spanish-first labels:

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

## 16. Claude Design Instruction

Add this exact instruction to Claude Design:

```text
The Context Management module is a first-class workflow in FixtureOS. Do not design it as a simple settings form. The app needs rich screens for Organization Context, Tournament Context, Category Context, Date Context, Context Dashboard, Context Version History, Context Compare, and Context Impact Simulator.

Every context screen must show: current active rules, inherited rules where applicable, a prompt input area, parsed structured preview, warnings/conflicts, context version information, and a path to simulate impact or generate a dry run.

The Category Context screen must clearly show whether the category is eligible for fixture generation based on start date and game mode. It must include a visual game mode preview.

The Date Context screen must be calendar/date focused and show affected matches.
```

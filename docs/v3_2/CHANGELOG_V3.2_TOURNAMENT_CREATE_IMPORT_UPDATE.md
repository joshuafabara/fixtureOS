# FixtureOS Docs — Changelog V3.2 Tournament Create / Import / Update

## Summary

V3.2 adds missing tournament creation and tournament update workflows. It expands the import system so users can create a new tournament from uploaded Excel, CSV, image/screenshot, or Drupal JSON:API data, and can also update an existing tournament with new/changed clubs, categories, and teams.

## Files Added

- `14_TOURNAMENT_CREATE_IMPORT_UPDATE_ADDENDUM.md`
- `15_CLAUDE_DESIGN_BRIEF_TOURNAMENT_CREATE_IMPORT_UPDATE.md`

## Files Updated Conceptually

These V3/V3.1 docs should be considered updated by this addendum:

- `01_PRODUCT_REQUIREMENTS_DOCUMENT.md`
- `06_FRONTEND_PAGES_AND_WIREFRAMES.md`
- `07_CLAUDE_DESIGN_BRIEF.md`
- `08_CLAUDE_CODE_IMPLEMENTATION_PLAN.md`

## Major Changes

1. Added Create Tournament page.
2. Added Tournament Update page.
3. Expanded Import Wizard to support create mode and update mode.
4. Added Import Preview + Mapping Review page.
5. Added Import Diff Review page for tournament updates.
6. Added Import Error Resolution page.
7. Added Post-Import Fixture Setup page to define missing category start dates and game modes.
8. Added support for Excel, CSV, image/screenshot, and Drupal JSON:API import sources.
9. Added update behavior for new categories, new teams, new clubs, renamed entities, removed/retired teams, and color changes.
10. Reinforced that updating tournament data must create a dry run before modifying fixtures.

## Claude Design Instruction

Use `14_TOURNAMENT_CREATE_IMPORT_UPDATE_ADDENDUM.md` and `15_CLAUDE_DESIGN_BRIEF_TOURNAMENT_CREATE_IMPORT_UPDATE.md` as the primary files for designing the missing tournament creation and import/update screens.

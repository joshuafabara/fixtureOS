# Fixture Organizer App — Product Requirements Document V3

## 1. Product Summary

Fixture Organizer App is a Spanish-first, multi-organization web application for importing tournament teams/categories, defining tournament rules through human prompts, generating fixtures, reviewing dry-run changes, approving versioned fixture updates, manually editing schedules, managing club contacts, and exporting fixtures.

The app must support generic sports such as basketball, volleyball, soccer, and similar tournament formats. MVP scoring only requires W/L/T. Standings for playoff qualification are user-provided in MVP, with image/table-assisted import supported where possible.

## 2. Core Product Principles

1. AI interprets context; deterministic code generates fixtures.
2. The user always has final approval.
3. No approved fixture change happens without dry-run review.
4. Past/played matches are locked and cannot be automatically changed.
5. Manual overrides are respected unless explicitly removed.
6. Every approved change creates a new version.
7. The app should be usable in Spanish and English, with Spanish as the primary UI language.

## 3. Users and Organizations

The app supports multiple organizations. Each organization has its own users, tournaments, courts, teams imported from Drupal/API/Excel, contexts, fixture versions, exports, and club contacts.

MVP authentication may use Fixture App email/password login. Drupal OAuth/JWT/SSO is future technical debt.

Roles exist in MVP, but all roles may have full access initially. Permissions should be designed for future expansion.

## 4. Data Sources

### 4.1 Drupal JSON:API

Drupal is the external source for organizations, clubs, teams, categories, and tournaments when available.

Fixture App stores lightweight operational data locally, including prompts, constraints, generated fixtures, versions, dry runs, overrides, contacts, audit logs, and exports.

### 4.2 Excel Import

Users can upload Excel files containing clubs, teams, and categories. The system should parse teams, assign categories, and preserve category colors when possible.

### 4.3 Image-Assisted Import

Images/screenshots may be used to assist with team/category extraction, retired team interpretation, or standings import. Image import should always show extracted data for confirmation.

## 5. Required Category Inclusion Rules

A category can only be included in fixture generation if it has:

1. Start date.
2. Game mode.

Categories missing either value remain imported but inactive for fixture generation.

## 6. Context Prompt System

The app supports four context levels:

1. Organization Context.
2. Tournament Context.
3. Category Context.
4. Date Context.

Contexts can define scheduling rules, available days/hours, courts, blackout dates, team restrictions, priorities, match durations, grouping preferences, retired teams, and game mode information.

## 7. Final Constraint Resolution Hierarchy

Higher items have priority over lower items:

1. Locked Past Matches.
2. Manual User Overrides.
3. Date Context.
4. Category Context.
5. Tournament Context.
6. Organization Context.
7. System Defaults.

System Defaults have the lowest priority. Locked Past Matches and Manual User Overrides have the highest priority.

## 8. Match Duration Requirements

Default match duration is 1 hour for all games.

Duration must be configurable at:

1. Organization level.
2. Tournament level.
3. Category level.
4. Date level.
5. Phase level where applicable, for example regular phase, quarterfinal, semifinal, final.

Most specific rule wins.

## 9. Courts

Courts exist only in Fixture App, not Drupal.

Court requirements:

- Name.
- Organization association.
- Availability calendar.
- Active/inactive status.
- Conflict prevention.

No venues in MVP. Courts are the only physical scheduling resource.

## 10. Game Modes

Game modes can be created from:

1. Predefined templates.
2. Prompt-based custom rules.
3. Super admin global defaults based on number of teams.

Supported MVP formats:

- Single round robin.
- Double round robin.
- Multiple groups.
- Group phase plus playoffs.
- Semifinal and final.
- Quarterfinal, semifinal, final.
- Custom classification rules described by prompt and confirmed by user.

Before saving prompt-generated game mode, the app must show a structured preview for user confirmation.

## 11. Standings

MVP standings can be supplied by user.

Supported input modes:

1. Manual ordered list.
2. Table/image-assisted import.

Future: automatic standings calculation from W/L/T and custom tie-breaker prompts.

## 12. Retired Teams

Default behavior when a team retires:

- Future matches become forfeits.
- Retired team receives L.
- Opponent receives W.
- Past matches remain unchanged.

User can override behavior through context prompts.

## 13. Priority Rules

Default scheduling priority is equal for all categories and teams.

Priorities may be defined at:

1. Organization level.
2. Tournament level.
3. Category level.
4. Date level.

Higher-level specificity follows the constraint hierarchy.

## 14. Club Grouping Rule

The system should try to schedule teams from the same club close together when possible. This is a soft constraint by default.

It can be overridden by organization, tournament, category, or date context.

## 15. Fixture Generation

Fixture generation must:

- Generate matches from game mode.
- Assign matches to dates, times, and courts.
- Avoid court overlap.
- Avoid team overlap.
- Respect court availability.
- Respect active category start dates.
- Preserve locked past matches.
- Preserve manual overrides.
- Generate dry-run diffs before commit.

## 16. Dry Run Workflow

Every context change, fixture generation, manual edit, retired team update, or standings bracket generation must first create a dry run.

Dry run must show:

- Added matches.
- Removed matches.
- Moved matches.
- Changed results.
- Constraint warnings.
- Conflicts.
- Locked matches unaffected.
- Manual overrides preserved.

User must approve before changes are applied.

## 17. Versioning

Every approved fixture change creates a new immutable version.

Fixtures must support:

- Version history.
- Compare multiple versions.
- View diffs.
- Restore old version by creating a new version.
- Draft, Published, Archived states.

Never overwrite history.

## 18. Publication Rules

Fixture versions/dates may have states:

- Draft.
- Published.
- Archived.

Only published dates are public. All other data remains behind authentication.

## 19. Manual Editing

Manual editing supports:

- Drag and drop match movement.
- Match-to-match swap.
- Court reassignment.
- Time reassignment.

Manual edits can violate constraints, but dry-run warnings must clearly explain which constraints are broken. User has final decision.

## 20. Club Contacts and WhatsApp Readiness

Each club must have at least one contact. Multiple contacts are supported.

For MVP, contact data is stored only in Fixture App. No Evolution API integration yet.

WhatsApp number format:

- Digits only.
- Country code + number.
- Example: 593998375914.
- No plus sign, spaces, dashes, or parentheses.
- Suggested length: 10–15 digits.

Club directory must allow filtering by category and free text, and inline editing of WhatsApp numbers.

## 21. Exports

Users can export fixtures to:

- Excel.
- PDF.
- Image.

Exports should respect selected tournament, date range, category, publication state, and view type.

## 22. Public Access

Public access is allowed only for published fixture dates, published standings, and published brackets.

All draft data, admin tools, contexts, dry runs, contacts, audit logs, and version controls require authentication.

## 23. MVP Must-Haves

- Multi-organization app.
- Email/password login.
- Drupal JSON:API import.
- Excel import.
- Prompt contexts.
- Category start date + game mode requirement.
- Fixture generation.
- Court availability calendars.
- Dry run approval.
- Versioning.
- Manual drag/drop edit.
- Standings manual and image-assisted import.
- Club contacts with WhatsApp validation.
- Exports.
- Spanish-first UI.


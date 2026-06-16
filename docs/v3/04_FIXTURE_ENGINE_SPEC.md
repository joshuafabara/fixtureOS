# Fixture Organizer App — Fixture Engine Spec V3

## 1. Engine Responsibility

The Fixture Engine is deterministic code. It receives validated structured inputs and returns fixture schedules, conflicts, warnings, and diffs.

The engine must not depend on AI for final scheduling decisions.

## 2. Inputs

- Tournament.
- Active categories.
- Teams.
- Game modes.
- Courts.
- Court availability.
- Effective constraints.
- Existing fixture version.
- Locked matches.
- Manual overrides.
- Standings rows for playoffs.

## 3. Outputs

- Proposed match list.
- Date/time/court assignments.
- Constraint warnings.
- Conflicts.
- Dry-run diff.
- Human-readable explanation fields.

## 4. Required Pre-Generation Checks

A category is eligible only if:

- `start_date` is present.
- `game_mode_id` is present.
- category has at least two active teams, unless game mode supports byes.

## 5. Constraint Hierarchy

Apply from lowest to highest, with higher overriding lower:

1. System Defaults.
2. Organization Context.
3. Tournament Context.
4. Category Context.
5. Date Context.
6. Manual User Overrides.
7. Locked Past Matches.

When conflicts are detected, the engine must identify which rule wins and why.

## 6. Match Duration Resolution

Default is 60 minutes.

Resolution order:

- System default.
- Organization override.
- Tournament override.
- Category override.
- Date override.
- Phase override if more specific.

Most specific value wins.

## 7. Game Mode Generation

Supported MVP generators:

### Single Round Robin

Each team plays every other team once.

### Double Round Robin

Each team plays every other team twice.

### Groups

Teams are divided into groups. Each group can use single or double round robin.

### Playoffs

Playoff brackets are generated from confirmed standings rows.

Supported rounds:

- Round of 16.
- Quarterfinals.
- Semifinals.
- Final.
- Third-place match optional later.

## 8. Scheduling Algorithm Requirements

The engine should:

1. Generate unscheduled match pool.
2. Remove or lock already played matches.
3. Apply manual overrides.
4. Generate available time slots from court calendars and contexts.
5. Sort matches by priority and constraints.
6. Assign matches to slots.
7. Validate no court overlap.
8. Validate no team overlap.
9. Validate date restrictions.
10. Validate category start dates.
11. Validate soft constraints and produce warnings if unmet.

## 9. Locked Past Matches

A match becomes locked when:

- Its scheduled date/time is in the past and marked played.
- User explicitly locks it.
- It has official result W/L/T.

Locked matches cannot be moved by regeneration.

## 10. Manual Overrides

Manual overrides remain active across regeneration unless explicitly removed.

Override examples:

- Match moved to date/time/court.
- Match swapped with another match.
- Match result changed.
- Match converted to forfeit.

Manual overrides can break constraints but must generate warnings.

## 11. Retired Teams

Default behavior:

- Future matches involving retired team become forfeits.
- Retired team = L.
- Opponent = W.
- Past matches unchanged.

## 12. Soft Constraints

Soft constraints should influence scheduling but not block generation:

- Club grouping.
- Preferred time windows.
- Avoid more than X weekends without playing.
- Category priority preferences.

Violations must appear in dry-run warnings.

## 13. Hard Constraints

Hard constraints should block scheduling or produce error conflicts:

- Court overlap.
- Team overlap.
- Match before category start date.
- Match assigned to unavailable court.
- Locked match modification.

## 14. Dry Run Diff Generation

Compare base version against proposed schedule.

Change types:

- Added match.
- Removed match.
- Moved match.
- Changed court.
- Changed result.
- Forfeit generated.
- Constraint warning.
- Conflict.

## 15. Explainability

The engine must store machine-readable reasons. AI may convert them to friendly text.

Example:

```
reason_code: COURT_UNAVAILABLE
message: Court A is unavailable on 2026-07-12 after 14:00.
```


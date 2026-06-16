# Fixture Organizer App — Versioning and Audit System V3

## 1. Purpose

Versioning protects organizers from accidental changes and AI-generated mistakes. Every approved change creates a new immutable version.

## 2. Versioned Entities

Required:

- Fixture versions.
- Context versions.
- Fixture matches by version.

Recommended:

- Game mode versions.
- Export metadata.

## 3. Fixture Version Rules

- Never overwrite a fixture version.
- Approval creates a new version.
- Rollback creates a new version copied from an old version.
- Manual edits create a new version.
- Retired team actions create a new version.
- Standings playoff generation creates a new version.

## 4. Version States

- Draft.
- Published.
- Archived.

Only published dates are public.

## 5. Compare Versions

Users can compare multiple versions and see diffs.

Diff types:

- Match added.
- Match removed.
- Match moved.
- Court changed.
- Time changed.
- Result changed.
- Forfeit added.
- Warning added.

## 6. Restore Version

Restoring V3 while current is V7 creates V8 from V3.

Never delete V4–V7.

## 7. Context Versioning

Every saved context prompt creates a context version.

Context scope:

- Organization.
- Tournament.
- Category.
- Date.

Each version stores raw prompt and parsed JSON.

## 8. Audit Log

Audit records:

- User.
- Action.
- Entity type.
- Entity id.
- Before JSON.
- After JSON.
- Timestamp.

Audit these actions:

- Login failures where useful.
- User creation/update.
- Import confirmed.
- Context saved.
- Dry run approved/rejected.
- Fixture version created.
- Fixture published/archived.
- Manual edit committed.
- Contact updated.
- Export generated.

## 9. UI Requirements

Version History page:

- Version number.
- State.
- Reason.
- Created by.
- Created date.
- Actions.

Compare page:

- Left version.
- Right version.
- Summary.
- Detailed diff rows.

Audit page:

- Date.
- User.
- Action.
- Entity.
- Details.


---

# V3.1 Addendum — Context Versioning UI

## 10. Context Version History Page

The UI must include a dedicated Context Version History page.

Route: `/context/history`

Required columns:

- Version.
- Scope.
- Target.
- Created by.
- Created date.
- Summary.
- Actions.

Actions:

- View.
- Compare.
- Restore.
- Simulate Impact.

Restoring an old context version creates a new context version. It must never overwrite historical records.

## 11. Context Compare Page

The UI must include a Context Compare page.

Route: `/context/compare`

The page must show:

- Left selected context version.
- Right selected context version.
- Added rules.
- Removed rules.
- Changed rules.
- Potential fixture impact.
- CTA to simulate fixture impact.

## 12. Context Impact Simulator

Context Impact Simulator is a pre-dry-run screen. It estimates the impact of a context change before generating the authoritative dry run.

It must show:

- Affected fixture versions.
- Affected categories.
- Affected dates.
- Estimated moved matches.
- Manual overrides preserved.
- Locked past matches unchanged.
- Warnings.
- Conflicts.

The simulator does not replace dry run approval.

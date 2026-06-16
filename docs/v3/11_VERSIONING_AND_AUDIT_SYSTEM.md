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


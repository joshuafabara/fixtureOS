# Fixture Organizer App — Export System V3

## 1. Supported Export Formats

MVP supports:

- Excel.
- PDF.
- Image.

## 2. Export Filters

Users can export by:

- Organization.
- Tournament.
- Fixture version.
- Date range.
- Category.
- Court.
- Club.
- Publication state.

## 3. Excel Export

Should include structured sheets:

- Fixture.
- Categories.
- Courts.
- Standings if available.
- Brackets if available.

## 4. PDF Export

Should be clean, printable, Spanish-first.

Options:

- Full tournament fixture.
- Date-by-date fixture.
- Category-only fixture.
- Public published dates only.

## 5. Image Export

Should generate a visual fixture suitable for sharing.

Options:

- Selected date.
- Selected weekend.
- Selected category.

## 6. Export Center Page

Show:

- Create export form.
- Format selector.
- Filters.
- Export history.
- Download links.
- Status: pending, ready, failed.

## 7. Storage

Generated exports should be stored in S3-compatible storage or local storage for development.

## 8. Audit

Audit every export request and generated file metadata.


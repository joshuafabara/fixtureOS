# Fixture Organizer App — Tech Debt and Future Features V3

## 1. Authentication

MVP uses email/password inside Fixture App.

Future:

- Drupal OAuth.
- Drupal JWT.
- SAML.
- Google login.
- Role-based permissions from Drupal.

## 2. Communications

MVP stores contacts only.

Future:

- Evolution API integration.
- WhatsApp message templates.
- Fixture change notifications.
- Match reminder notifications.
- Forfeit notifications.
- Publication notifications.

## 3. Standings

MVP supports manual and image/table-assisted standings import.

Future:

- Automatic standings from W/L/T.
- Custom points rules.
- Custom tie-breaker prompts.
- Head-to-head calculation.
- Point differential.
- Sport-specific scoring extensions.

## 4. Multi-Backend Drupal

MVP may use environment variables for one Drupal backend.

Future:

- Tenant-level Drupal configuration.
- Multiple Drupal backends in one Fixture App deployment.
- Per-tenant API credentials.

## 5. Permissions

MVP roles can have all access.

Future:

- Super Admin.
- Organization Admin.
- Tournament Manager.
- Viewer.
- Contact Manager.
- Public Publisher.

## 6. Venues

MVP supports courts only.

Future:

- Venues containing courts.
- Travel/venue grouping constraints.

## 7. Advanced Scheduling

Future:

- Optimization scoring.
- Fairness balancing.
- Referee assignment.
- Scorekeeper assignment.
- Travel time constraints.
- Better club grouping algorithms.

## 8. Public Portal

MVP public route shows published dates only.

Future:

- Public standings.
- Public brackets.
- Club-specific public pages.
- Embed widgets.


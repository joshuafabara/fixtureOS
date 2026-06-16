# Fixture Organizer App — Database Schema V3

## 1. Notes

Use PostgreSQL. All organization-owned tables must include `organization_id` where applicable.

## 2. Core Tables

### organizations

- id uuid pk
- name text
- slug text unique
- drupal_external_id text nullable
- created_at timestamptz
- updated_at timestamptz

### users

- id uuid pk
- organization_id uuid fk
- email text unique
- password_hash text
- name text
- role text
- is_active boolean
- created_at timestamptz
- updated_at timestamptz

### tournaments

- id uuid pk
- organization_id uuid fk
- drupal_external_id text nullable
- name text
- sport text nullable
- status text
- created_at timestamptz
- updated_at timestamptz

### clubs

- id uuid pk
- organization_id uuid fk
- drupal_external_id text nullable
- name text
- normalized_name text
- created_at timestamptz
- updated_at timestamptz

### categories

- id uuid pk
- organization_id uuid fk
- tournament_id uuid fk
- drupal_external_id text nullable
- name text
- color_hex text nullable
- start_date date nullable
- game_mode_id uuid nullable
- is_active_for_fixture boolean default false
- priority integer nullable
- created_at timestamptz
- updated_at timestamptz

### teams

- id uuid pk
- organization_id uuid fk
- club_id uuid fk nullable
- category_id uuid fk
- drupal_external_id text nullable
- name text
- normalized_name text
- status text default 'active'
- created_at timestamptz
- updated_at timestamptz

## 3. Courts

### courts

- id uuid pk
- organization_id uuid fk
- name text
- is_active boolean
- created_at timestamptz
- updated_at timestamptz

### court_availability_rules

- id uuid pk
- court_id uuid fk
- day_of_week integer nullable
- specific_date date nullable
- start_time time
- end_time time
- is_available boolean
- note text nullable

## 4. Context and Constraints

### context_versions

- id uuid pk
- organization_id uuid fk
- scope text -- organization, tournament, category, date
- scope_id uuid nullable
- effective_date date nullable
- raw_prompt text
- parsed_constraints jsonb
- version_number integer
- created_by uuid fk users
- created_at timestamptz

### constraint_sets

- id uuid pk
- organization_id uuid fk
- tournament_id uuid nullable
- category_id uuid nullable
- date date nullable
- source_context_version_id uuid nullable
- constraints jsonb
- created_at timestamptz

## 5. Game Modes

### game_mode_templates

- id uuid pk
- organization_id uuid nullable -- null means global default
- name text
- team_count_min integer nullable
- team_count_max integer nullable
- mode_json jsonb
- is_global_default boolean
- created_at timestamptz
- updated_at timestamptz

### game_modes

- id uuid pk
- organization_id uuid fk
- tournament_id uuid fk
- category_id uuid nullable
- name text
- source text -- template, prompt, manual
- mode_json jsonb
- created_at timestamptz
- updated_at timestamptz

## 6. Fixtures and Versions

### fixture_versions

- id uuid pk
- organization_id uuid fk
- tournament_id uuid fk
- version_number integer
- parent_version_id uuid nullable
- state text -- draft, published, archived
- reason text
- created_by uuid fk users
- created_at timestamptz

### fixture_dates

- id uuid pk
- fixture_version_id uuid fk
- date date
- state text -- draft, published, archived
- public_slug text nullable

### matches

- id uuid pk
- organization_id uuid fk
- fixture_version_id uuid fk
- fixture_date_id uuid fk nullable
- tournament_id uuid fk
- category_id uuid fk
- phase text
- group_name text nullable
- bracket_round text nullable
- home_team_id uuid nullable
- away_team_id uuid nullable
- scheduled_date date nullable
- start_time time nullable
- end_time time nullable
- court_id uuid nullable
- status text -- scheduled, played, forfeit, cancelled, pending
- home_result text nullable -- W/L/T
- away_result text nullable -- W/L/T
- is_locked boolean default false
- manual_override_id uuid nullable
- metadata jsonb
- created_at timestamptz
- updated_at timestamptz

### manual_overrides

- id uuid pk
- organization_id uuid fk
- tournament_id uuid fk
- match_id uuid nullable
- override_type text
- override_json jsonb
- created_by uuid fk users
- created_at timestamptz
- removed_at timestamptz nullable

## 7. Dry Runs and Diffs

### dry_runs

- id uuid pk
- organization_id uuid fk
- tournament_id uuid fk
- base_fixture_version_id uuid nullable
- status text -- pending, ready, approved, rejected, expired
- reason text
- summary jsonb
- created_by uuid fk users
- created_at timestamptz
- approved_at timestamptz nullable

### dry_run_changes

- id uuid pk
- dry_run_id uuid fk
- change_type text -- add, remove, move, update, warning, conflict
- entity_type text
- entity_id uuid nullable
- before_json jsonb nullable
- after_json jsonb nullable
- severity text -- info, warning, error
- explanation text

## 8. Standings

### standings_imports

- id uuid pk
- organization_id uuid fk
- tournament_id uuid fk
- category_id uuid fk
- source_type text -- manual, image, excel
- raw_input_ref text nullable
- parsed_rows jsonb
- status text
- created_by uuid fk users
- created_at timestamptz

### standings_rows

- id uuid pk
- organization_id uuid fk
- tournament_id uuid fk
- category_id uuid fk
- fixture_version_id uuid nullable
- position integer
- team_id uuid fk
- source_import_id uuid nullable
- created_at timestamptz

## 9. Club Contacts

### club_contacts

- id uuid pk
- organization_id uuid fk
- club_id uuid fk
- contact_name text
- contact_role text nullable
- whatsapp_number text nullable
- is_primary boolean default false
- notes text nullable
- created_at timestamptz
- updated_at timestamptz

Validation: whatsapp_number must match `^[0-9]{10,15}$` when not null.

## 10. Imports and Exports

### import_batches

- id uuid pk
- organization_id uuid fk
- tournament_id uuid nullable
- source_type text -- drupal, excel, image
- status text
- file_ref text nullable
- summary jsonb
- created_by uuid fk users
- created_at timestamptz

### exports

- id uuid pk
- organization_id uuid fk
- tournament_id uuid fk
- fixture_version_id uuid nullable
- export_type text -- excel, pdf, image
- filters jsonb
- file_ref text nullable
- status text
- created_by uuid fk users
- created_at timestamptz

## 11. Audit

### audit_logs

- id uuid pk
- organization_id uuid fk
- user_id uuid nullable
- action text
- entity_type text
- entity_id uuid nullable
- before_json jsonb nullable
- after_json jsonb nullable
- created_at timestamptz


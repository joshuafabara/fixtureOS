# Fixture Organizer App — Frontend Pages and Wireframes V3

## 1. Design Scope

Claude Design must create 24 desktop-first screens. Spanish-first UI.

## 2. Pages List

1. Login — `/login`
2. Dashboard — `/dashboard`
3. Tournaments List — `/tournaments`
4. Tournament Detail — `/tournaments/:id`
5. Import Wizard — `/import`
6. Organization Context — `/context/organization`
7. Tournament Context — `/context/tournament/:id`
8. Category Context — `/context/category/:id`
9. Date Context — `/context/date`
10. Fixture Builder — `/fixture-builder`
11. Dry Run Review — `/dry-run/:id`
12. Fixture Viewer — `/fixture/:id`
13. Manual Edit Mode — `/fixture/:id/edit`
14. Fixture History — `/fixture/:id/history`
15. Version Compare — `/fixture/:id/compare`
16. Standings Import — `/standings/import`
17. Standings Review — `/standings/review/:id`
18. Clubs Directory — `/clubs`
19. Club Detail — `/clubs/:id`
20. Communications Directory — `/communications`
21. Courts Management — `/settings/courts`
22. Users Management — `/settings/users`
23. Organization Settings — `/settings/organization`
24. Audit Log / Export Center combined or separate route `/audit` and `/exports`

If Claude Design prefers exact separate pages, create 25 screens by splitting Audit Log and Export Center.

## 3. Global Layout

```
+---------------------------------------------------------------+
| Top Bar: Organization | Tournament Switcher | User Menu       |
+----------------------+----------------------------------------+
| Sidebar              | Page Content                           |
| Dashboard            |                                        |
| Tournaments          |                                        |
| Fixture              |                                        |
| Clubs                |                                        |
| Communications       |                                        |
| Settings             |                                        |
+----------------------+----------------------------------------+
```

## 4. Dashboard Wireframe

```
[Dashboard]

Cards:
[Active Tournaments] [Pending Dry Runs] [Published Dates] [Missing Contacts]

Upcoming Matches
------------------------------------------------
Date | Time | Court | Category | Match | Status

Recent Activity
------------------------------------------------
User | Action | Time
```

## 5. Tournament Detail Wireframe

```
[Tournament Name] [Draft/Published/Archived] [Generate Dry Run]

Tabs: Overview | Categories | Fixture | Context | Versions | Exports

Categories
------------------------------------------------
Color | Category | Teams | Start Date | Game Mode | Status
```

## 6. Import Wizard Wireframe

```
[Import Tournament Data]

Step 1: Source
( ) Drupal JSON:API
( ) Excel
( ) Image/Screenshot

Step 2: Preview
Club | Team | Category | Color | Status

Step 3: Confirm Import
[Import]
```

## 7. Context Pages Wireframe

```
[Context Editor]

Prompt input:
+------------------------------------------------+
| Describe rules in Spanish or English...        |
+------------------------------------------------+

[Parse Context]

Parsed Preview:
Rules | Availability | Priorities | Durations | Warnings

[Confirm Save]
```

## 8. Fixture Builder Wireframe

```
[Fixture Builder]

Tournament: [Alpha Cup]
Version Base: [V3]
Categories: [x] U12 [x] U14 [ ] U16 missing start date

Validation Panel
- U12 ready
- U14 ready
- U16 missing game mode

[Generate Dry Run]
```

## 9. Dry Run Review Wireframe

```
[Dry Run Review]

Summary Cards:
[Added] [Moved] [Forfeits] [Warnings] [Conflicts]

Diff Table:
Type | Match | Before | After | Severity | Explanation

[Reject] [Approve and Create Version]
```

## 10. Fixture Viewer Wireframe

```
[Fixture Viewer] [Version V5] [Draft/Published] [Publish Dates] [Export]

View Toggle: Date Cards | Calendar
Filters: Category | Court | Club | Date Range

Date Card:
Saturday July 12
------------------------------------------------
Time | Court | Category | Match | Status
```

## 11. Manual Edit Mode Wireframe

```
[Manual Edit Mode]

Left: Fixture grid/calendar
Right: Selected Match Details

Actions:
- Drag match to slot
- Swap with another match
- Change court
- Change time

After edit:
[Preview Dry Run Warnings]
```

## 12. Version History Wireframe

```
[Fixture History]

Version | State | Created By | Date | Reason | Actions
V5 | Draft | Admin | Today | Retired team | Compare | Restore
V4 | Published | Admin | Yesterday | Initial publish | Compare
```

## 13. Version Compare Wireframe

```
[Compare Versions]

Left: V4
Right: V5

Summary:
+ Added 4
~ Moved 12
! Warnings 2

Visual diff rows below.
```

## 14. Standings Import Wireframe

```
[Import Standings]

Category: [U17]
Input Mode: Manual | Image | Excel

Upload / Manual List
[Parse]
```

## 15. Standings Review Wireframe

```
[Review Standings]

Position | Detected Team | Matched Team | Confidence | Edit
1 | LOS ANDES QUITO | Los Andes Quito | 96% | Edit

[Confirm and Generate Playoffs Dry Run]
```

## 16. Clubs Directory Wireframe

```
[Club Directory]

Search: [__________]
Category: [All]
Has WhatsApp: [All/Missing/Present]

Club | Categories | Primary Contact | WhatsApp | Missing? | Actions
Spartans | U12,U14 | John | 593998375914 | No | View
CVU | U16 | - | [Add inline] | Yes | View
```

## 17. Club Detail Wireframe

```
[Club: Spartans]

Teams by Category
Contacts
Name | Role | WhatsApp | Primary | Actions

[Add Contact]
```

## 18. Communications Directory Wireframe

```
[Communications]

This is contact readiness only in MVP. No sending yet.

Filters: Tournament | Category | Missing WhatsApp

Club | Primary Contact | WhatsApp | Last Updated
```

## 19. Courts Management Wireframe

```
[Courts]

Court | Active | Availability | Actions
Court A | Yes | Fri-Sun 08:00-21:00 | Edit

Availability Calendar Editor
```

## 20. Users Management Wireframe

```
[Users]

Name | Email | Role | Status | Actions

[Invite/Create User]
```

## 21. Organization Settings Wireframe

```
[Organization Settings]

Name
Language
Drupal Connection
Default Match Duration
Global Context Link
```

## 22. Audit Log Wireframe

```
[Audit Log]

Date | User | Action | Entity | Details
```

## 23. Export Center Wireframe

```
[Exports]

Create Export
Tournament | Version | Format: Excel/PDF/Image | Filters

Export History
```

## 24. Public Fixture Wireframe

```
[Public Fixture]

Published dates only.

Tournament | Dates | Categories | Matches
No admin controls.
```


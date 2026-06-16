# FixtureOS — Frontend Pages and Wireframes V3.1

## 1. Design Scope

Claude Design must create 28 desktop-first screens if Audit Log and Export Center remain combined, or 29 screens if they are split. Spanish-first UI.

V3.1 makes Context Management a first-class module. Context screens must be designed with the same importance as Fixture Viewer, Dry Run Review, Version Compare, and Manual Edit Mode.

## 2. Pages List

1. Login — `/login`
2. Dashboard — `/dashboard`
3. Tournaments List — `/tournaments`
4. Tournament Detail — `/tournaments/:id`
5. Import Wizard — `/import`
6. Context Dashboard — `/context`
7. Organization Context — `/context/organization`
8. Tournament Context — `/context/tournament/:id`
9. Category Context — `/context/category/:id`
10. Date Context — `/context/date`
11. Context Version History — `/context/history`
12. Context Compare — `/context/compare`
13. Context Impact Simulator — `/context/impact-simulator`
14. Fixture Builder — `/fixture-builder`
15. Dry Run Review — `/dry-run/:id`
16. Fixture Viewer — `/fixture/:id`
17. Manual Edit Mode — `/fixture/:id/edit`
18. Fixture History — `/fixture/:id/history`
19. Version Compare — `/fixture/:id/compare`
20. Standings Import — `/standings/import`
21. Standings Review — `/standings/review/:id`
22. Clubs Directory — `/clubs`
23. Club Detail — `/clubs/:id`
24. Communications Directory — `/communications`
25. Courts Management — `/settings/courts`
26. Users Management — `/settings/users`
27. Organization Settings — `/settings/organization`
28. Audit Log / Export Center combined — `/audit` and `/exports`

If Claude Design prefers exact separate pages, create 29 screens by splitting Audit Log and Export Center.

## 3. Global Layout

```text
+---------------------------------------------------------------+
| Top Bar: Organization | Tournament Switcher | User Menu       |
+----------------------+----------------------------------------+
| Sidebar              | Page Content                           |
| Dashboard            |                                        |
| Tournaments          |                                        |
| Fixture              |                                        |
| Contexto             |                                        |
| Clubes               |                                        |
| Comunicaciones       |                                        |
| Settings             |                                        |
+----------------------+----------------------------------------+
```

## 4. Dashboard Wireframe

```text
[Dashboard]

Cards:
[Active Tournaments] [Pending Dry Runs] [Published Dates] [Missing Contacts]
[Context Warnings] [Categories Missing Game Mode]

Upcoming Matches
------------------------------------------------
Date | Time | Court | Category | Match | Status

Recent Activity
------------------------------------------------
User | Action | Time
```

## 5. Tournament Detail Wireframe

```text
[Tournament Name] [Draft/Published/Archived] [Generate Dry Run]

Tabs: Overview | Categories | Fixture | Context | Versions | Exports

Categories
------------------------------------------------
Color | Category | Teams | Start Date | Game Mode | Status
```

## 6. Import Wizard Wireframe

```text
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

## 7. Context Dashboard Wireframe

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

Missing Required Category Context
------------------------------------------------------------
Category | Missing Start Date | Missing Game Mode | Action
U15 F    | No                 | Yes               | Open
U17 M    | Yes                | No                | Open

Recent Context Changes
------------------------------------------------------------
Date | User | Scope | Summary | Created Version
```

## 8. Organization Context Wireframe

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

## 9. Tournament Context Wireframe

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

## 10. Category Context Wireframe

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

## 11. Date Context Wireframe

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

## 12. Context Version History Wireframe

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

## 13. Context Compare Wireframe

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

[Simulate Fixture Impact]
```

## 14. Context Impact Simulator Wireframe

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

## 15. Fixture Builder Wireframe

```text
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

## 16. Dry Run Review Wireframe

```text
[Dry Run Review]

Summary Cards:
[Added] [Moved] [Forfeits] [Warnings] [Conflicts]

Diff Table:
Type | Match | Before | After | Severity | Explanation

[Reject] [Approve and Create Version]
```

## 17. Fixture Viewer Wireframe

```text
[Fixture Viewer] [Version V5] [Draft/Published] [Publish Dates] [Export]

View Toggle: Date Cards | Calendar
Filters: Category | Court | Club | Date Range

Date Card:
Saturday July 12
------------------------------------------------
Time | Court | Category | Match | Status
```

## 18. Manual Edit Mode Wireframe

```text
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

## 19. Version History Wireframe

```text
[Fixture History]

Version | State | Created By | Date | Reason | Actions
V5 | Draft | Admin | Today | Retired team | Compare | Restore
V4 | Published | Admin | Yesterday | Initial publish | Compare
```

## 20. Version Compare Wireframe

```text
[Compare Versions]

Left: V4
Right: V5

Summary:
+ Added 4
~ Moved 12
! Warnings 2

Visual diff rows below.
```

## 21. Standings Import Wireframe

```text
[Import Standings]

Category: [U17]
Input Mode: Manual | Image | Excel

Upload / Manual List
[Parse]
```

## 22. Standings Review Wireframe

```text
[Review Standings]

Position | Detected Team | Matched Team | Confidence | Edit
1 | LOS ANDES QUITO | Los Andes Quito | 96% | Edit

[Confirm and Generate Playoffs Dry Run]
```

## 23. Clubs Directory Wireframe

```text
[Club Directory]

Search: [__________]
Category: [All]
Has WhatsApp: [All/Missing/Present]

Club | Categories | Primary Contact | WhatsApp | Missing? | Actions
Spartans | U12,U14 | John | 593998375914 | No | View
CVU | U16 | - | [Add inline] | Yes | View
```

## 24. Club Detail Wireframe

```text
[Club: Spartans]

Teams by Category
Contacts
Name | Role | WhatsApp | Primary | Actions

[Add Contact]
```

## 25. Communications Directory Wireframe

```text
[Communications]

This is contact readiness only in MVP. No sending yet.

Filters: Tournament | Category | Missing WhatsApp

Club | Primary Contact | WhatsApp | Last Updated
```

## 26. Courts Management Wireframe

```text
[Courts]

Court | Active | Availability | Actions
Court A | Yes | Fri-Sun 08:00-21:00 | Edit

Availability Calendar Editor
```

## 27. Users Management Wireframe

```text
[Users]

Name | Email | Role | Status | Actions

[Invite/Create User]
```

## 28. Organization Settings Wireframe

```text
[Organization Settings]

Name
Language
Drupal Connection
Default Match Duration
Global Context Link
```

## 29. Audit Log Wireframe

```text
[Audit Log]

Date | User | Action | Entity | Details
```

## 30. Export Center Wireframe

```text
[Exports]

Create Export
Tournament | Version | Format: Excel/PDF/Image | Filters

Export History
```

## 31. Public Fixture Wireframe

```text
[Public Fixture]

Published dates only.

Tournament | Dates | Categories | Matches
No admin controls.
```

# Fixture Organizer App — AI and Prompt System V3

## 1. AI Purpose

AI helps users convert human tournament language into structured data. AI never directly commits changes.

## 2. Supported AI Tasks

- Organization context parsing.
- Tournament context parsing.
- Category context parsing.
- Date context parsing.
- Game mode parsing.
- Retired team interpretation.
- Standings image/table extraction.
- Fixture diff explanation.
- Constraint violation explanation.

## 3. Structured Output Requirement

Every prompt parse must return validated JSON matching backend schemas.

No raw AI text should be trusted as executable scheduling logic.

## 4. Context Prompt Examples

### Organization Context

```
All tournaments use Court A and Court B. Games are played Friday through Sunday from 8am to 9pm. Default game duration is 1 hour.
```

### Tournament Context

```
Alpha Cup only uses Court A. Play Saturday and Sunday, except July 20 and July 21. Try to keep teams from the same club close together.
```

### Category Context

```
U17 Masculino starts on June 15. Use 2 groups, single round robin, top 2 per group advance to semifinals and final. Games last 75 minutes.
```

### Date Context

```
On July 12, Spartans U16M cannot play. Crossover U14M can only play after 2pm.
```

## 5. Parsed Constraint Preview

After each prompt, show structured preview:

```json
{
  "scope": "category",
  "category": "U17 Masculino",
  "startDate": "2026-06-15",
  "gameMode": {
    "groups": 2,
    "groupRounds": 1,
    "classification": "top_2_each_group",
    "playoffs": ["semifinal", "final"]
  },
  "matchDurationMinutes": 75
}
```

User must confirm before saving context.

## 6. Image-Assisted Standings Import

AI may extract standings from screenshots/images.

The result must show confirmation screen before use:

- Position.
- Team name.
- Confidence.
- Matched internal team.
- Unmatched warnings.

## 7. Retired Team Image/Prompt Handling

User can say:

```
Teams in red are retired. Mark their remaining games as forfeits.
```

AI should extract candidate teams and show confirmation.

## 8. Diff Explanation

AI can convert technical diffs into user-friendly explanations.

Example:

```
Match moved from July 5 to July 12 because Crossover U14M is only available after 2pm on July 5 and no court was available then.
```

## 9. Languages

Prompts should support Spanish and English.

UI is Spanish-first. AI preview labels should appear in the user's selected language.

## 10. Safety and Validation

All AI output must be validated by schema.

Invalid or ambiguous output must ask user for clarification instead of committing.


---

# V3.1 Addendum — Context UI and AI Preview Requirements

## 11. Context Editor AI Flow

Every context editor must follow this flow:

1. User enters natural-language prompt.
2. AI parses prompt into structured JSON.
3. Backend validates schema.
4. UI shows parsed preview.
5. User confirms or edits prompt.
6. Saved context creates a new context version.
7. User may simulate impact.
8. Fixture-affecting changes proceed to dry run before commit.

## 12. Required Parsed Preview Sections

Parsed preview should group extracted rules into sections:

- Availability.
- Courts.
- Dates and blackout periods.
- Match duration.
- Category start dates.
- Game modes.
- Priorities.
- Club grouping rules.
- Team restrictions.
- Retired teams.
- Warnings.
- Ambiguities requiring confirmation.

## 13. Category Game Mode Preview

When a category prompt defines a game mode, AI output must support visual preview fields:

- Groups count.
- Teams per group if known.
- Round robin rounds.
- Classification mode.
- Playoff rounds.
- Bracket pairing logic.
- Match duration.

## 14. Context Impact Explanation

AI may explain context impact in natural language after deterministic analysis.

Example:

`This change makes Court B unavailable on July 12. Six matches are affected. Three can move to Court A, two move to July 13, and one creates a conflict because Spartans U16 cannot play on July 13.`

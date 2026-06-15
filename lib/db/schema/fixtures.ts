import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  time,
  integer,
  jsonb,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations, users } from "./auth";
import { tournaments, categories, teams } from "./tournaments";
import { courts } from "./courts";

export const fixtureVersions = pgTable("fixture_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  parentVersionId: uuid("parent_version_id"),
  state: text("state").notNull().default("draft"), // draft, published, archived
  reason: text("reason"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const fixtureDates = pgTable("fixture_dates", {
  id: uuid("id").primaryKey().defaultRandom(),
  fixtureVersionId: uuid("fixture_version_id")
    .notNull()
    .references(() => fixtureVersions.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  state: text("state").notNull().default("draft"), // draft, published, archived
  publicSlug: text("public_slug").unique(),
});

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  fixtureVersionId: uuid("fixture_version_id")
    .notNull()
    .references(() => fixtureVersions.id, { onDelete: "cascade" }),
  fixtureDateId: uuid("fixture_date_id").references(() => fixtureDates.id, {
    onDelete: "set null",
  }),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  phase: text("phase").notNull().default("regular"), // regular, group, quarterfinal, semifinal, final
  groupName: text("group_name"),
  bracketRound: text("bracket_round"),
  homeTeamId: uuid("home_team_id").references(() => teams.id, {
    onDelete: "set null",
  }),
  awayTeamId: uuid("away_team_id").references(() => teams.id, {
    onDelete: "set null",
  }),
  scheduledDate: date("scheduled_date"),
  startTime: time("start_time"),
  endTime: time("end_time"),
  courtId: uuid("court_id").references(() => courts.id, { onDelete: "set null" }),
  status: text("status").notNull().default("scheduled"), // scheduled, played, forfeit, cancelled, pending
  homeResult: text("home_result"), // W, L, T
  awayResult: text("away_result"), // W, L, T
  isLocked: boolean("is_locked").notNull().default(false),
  manualOverrideId: uuid("manual_override_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const manualOverrides = pgTable("manual_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  matchId: uuid("match_id"),
  overrideType: text("override_type").notNull(), // move, swap, court_change, time_change, forfeit, result
  overrideJson: jsonb("override_json").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  removedAt: timestamp("removed_at", { withTimezone: true }),
});

export const dryRuns = pgTable("dry_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  baseFixtureVersionId: uuid("base_fixture_version_id").references(
    () => fixtureVersions.id,
    { onDelete: "set null" }
  ),
  status: text("status").notNull().default("pending"), // pending, ready, approved, rejected, expired
  reason: text("reason"),
  summary: jsonb("summary"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export const dryRunChanges = pgTable("dry_run_changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  dryRunId: uuid("dry_run_id")
    .notNull()
    .references(() => dryRuns.id, { onDelete: "cascade" }),
  changeType: text("change_type").notNull(), // add, remove, move, update, warning, conflict
  entityType: text("entity_type").notNull(), // match, court, team
  entityId: uuid("entity_id"),
  beforeJson: jsonb("before_json"),
  afterJson: jsonb("after_json"),
  severity: text("severity").notNull().default("info"), // info, warning, error
  explanation: text("explanation"),
});

export const aiAuditReports = pgTable("ai_audit_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  dryRunId: uuid("dry_run_id")
    .notNull()
    .references(() => dryRuns.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // pass | warning | fail
  confidence: real("confidence"), // 0–1
  model: text("model").notNull(),
  inputHash: text("input_hash").notNull(),
  reportJson: jsonb("report_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const fixtureVersionsRelations = relations(
  fixtureVersions,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [fixtureVersions.organizationId],
      references: [organizations.id],
    }),
    tournament: one(tournaments, {
      fields: [fixtureVersions.tournamentId],
      references: [tournaments.id],
    }),
    dates: many(fixtureDates),
    matches: many(matches),
  })
);

export const matchesRelations = relations(matches, ({ one }) => ({
  fixtureVersion: one(fixtureVersions, {
    fields: [matches.fixtureVersionId],
    references: [fixtureVersions.id],
  }),
  category: one(categories, {
    fields: [matches.categoryId],
    references: [categories.id],
  }),
  homeTeam: one(teams, {
    fields: [matches.homeTeamId],
    references: [teams.id],
    relationName: "homeMatches",
  }),
  awayTeam: one(teams, {
    fields: [matches.awayTeamId],
    references: [teams.id],
    relationName: "awayMatches",
  }),
  court: one(courts, {
    fields: [matches.courtId],
    references: [courts.id],
  }),
}));

export const dryRunsRelations = relations(dryRuns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [dryRuns.organizationId],
    references: [organizations.id],
  }),
  tournament: one(tournaments, {
    fields: [dryRuns.tournamentId],
    references: [tournaments.id],
  }),
  changes: many(dryRunChanges),
  auditReports: many(aiAuditReports),
}));

export const aiAuditReportsRelations = relations(aiAuditReports, ({ one }) => ({
  organization: one(organizations, {
    fields: [aiAuditReports.organizationId],
    references: [organizations.id],
  }),
  dryRun: one(dryRuns, {
    fields: [aiAuditReports.dryRunId],
    references: [dryRuns.id],
  }),
}));

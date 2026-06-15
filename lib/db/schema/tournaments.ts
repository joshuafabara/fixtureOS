import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./auth";

export const tournaments = pgTable("tournaments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  drupalExternalId: text("drupal_external_id"),
  name: text("name").notNull(),
  sport: text("sport"),
  status: text("status").notNull().default("draft"), // draft, active, completed, archived
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clubs = pgTable("clubs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  drupalExternalId: text("drupal_external_id"),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  drupalExternalId: text("drupal_external_id"),
  name: text("name").notNull(),
  colorHex: text("color_hex"),
  startDate: date("start_date"),
  gameModeId: uuid("game_mode_id"),
  isActiveForFixture: boolean("is_active_for_fixture").notNull().default(false),
  priority: integer("priority"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clubId: uuid("club_id").references(() => clubs.id, { onDelete: "set null" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  drupalExternalId: text("drupal_external_id"),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  status: text("status").notNull().default("active"), // active, retired
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const gameModeTemplates = pgTable("game_mode_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  teamCountMin: integer("team_count_min"),
  teamCountMax: integer("team_count_max"),
  modeJson: jsonb("mode_json").notNull(),
  isGlobalDefault: boolean("is_global_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const gameModes = pgTable("game_modes", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  source: text("source").notNull().default("manual"), // template, prompt, manual
  modeJson: jsonb("mode_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const standingsImports = pgTable("standings_imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull().default("manual"), // manual, image, excel
  rawInputRef: text("raw_input_ref"),
  parsedRows: jsonb("parsed_rows"),
  status: text("status").notNull().default("pending"), // pending, confirmed, applied
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const standingsRows = pgTable("standings_rows", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  fixtureVersionId: uuid("fixture_version_id"),
  position: integer("position").notNull(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  sourceImportId: uuid("source_import_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const tournamentsRelations = relations(tournaments, ({ many, one }) => ({
  categories: many(categories),
  organization: one(organizations, {
    fields: [tournaments.organizationId],
    references: [organizations.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  teams: many(teams),
  tournament: one(tournaments, {
    fields: [categories.tournamentId],
    references: [tournaments.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one }) => ({
  club: one(clubs, { fields: [teams.clubId], references: [clubs.id] }),
  category: one(categories, {
    fields: [teams.categoryId],
    references: [categories.id],
  }),
}));

export const clubsRelations = relations(clubs, ({ many }) => ({
  teams: many(teams),
}));

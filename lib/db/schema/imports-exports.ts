import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations, users } from "./auth";
import { tournaments } from "./tournaments";
import { fixtureVersions } from "./fixtures";

export const importBatches = pgTable("import_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tournamentId: uuid("tournament_id").references(() => tournaments.id, {
    onDelete: "set null",
  }),
  // sourceType: excel | csv | image | drupal
  sourceType: text("source_type").notNull(),
  // mode: create (new tournament dataset) | update (diff against existing)
  mode: text("mode").notNull().default("create"),
  // status: uploaded → parsing → mapping → review → errors → ready → confirmed | rejected | failed
  status: text("status").notNull().default("uploaded"),
  fileRef: text("file_ref"),
  // parsed rows + auto-detected column mapping
  mappingData: jsonb("mapping_data"),
  // computed diff rows (ImpDiffRow[])
  diffData: jsonb("diff_data"),
  // rows that need manual resolution (ImpErrorRow[])
  errorsData: jsonb("errors_data"),
  // user decisions per error row  { [errorId]: number }
  resolvedErrors: jsonb("resolved_errors"),
  // final stats written on confirm
  summary: jsonb("summary"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const fixtureExports = pgTable("exports", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  fixtureVersionId: uuid("fixture_version_id").references(
    () => fixtureVersions.id,
    { onDelete: "set null" }
  ),
  exportType: text("export_type").notNull(), // excel, pdf, image
  filters: jsonb("filters"),
  fileRef: text("file_ref"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const importBatchesRelations = relations(importBatches, ({ one }) => ({
  organization: one(organizations, {
    fields: [importBatches.organizationId],
    references: [organizations.id],
  }),
  tournament: one(tournaments, {
    fields: [importBatches.tournamentId],
    references: [tournaments.id],
  }),
}));

export const exportsRelations = relations(fixtureExports, ({ one }) => ({
  organization: one(organizations, {
    fields: [fixtureExports.organizationId],
    references: [organizations.id],
  }),
  tournament: one(tournaments, {
    fields: [fixtureExports.tournamentId],
    references: [tournaments.id],
  }),
}));

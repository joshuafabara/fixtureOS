import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations, users } from "./auth";

export const contextVersions = pgTable("context_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  // organization | tournament | category | date
  scope: text("scope").notNull(),
  scopeId: uuid("scope_id"), // tournament_id, category_id, or null for org/date
  effectiveDate: date("effective_date"), // used for date-scope contexts
  rawPrompt: text("raw_prompt").notNull(),
  parsedConstraints: jsonb("parsed_constraints"),
  versionNumber: integer("version_number").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const constraintSets = pgTable("constraint_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tournamentId: uuid("tournament_id"),
  categoryId: uuid("category_id"),
  date: date("date"),
  sourceContextVersionId: uuid("source_context_version_id").references(
    () => contextVersions.id,
    { onDelete: "set null" }
  ),
  constraints: jsonb("constraints").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contextVersionsRelations = relations(contextVersions, ({ one }) => ({
  organization: one(organizations, {
    fields: [contextVersions.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [contextVersions.createdBy],
    references: [users.id],
  }),
}));

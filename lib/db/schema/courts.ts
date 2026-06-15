import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  time,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./auth";

export const courts = pgTable("courts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const courtAvailabilityRules = pgTable("court_availability_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  courtId: uuid("court_id")
    .notNull()
    .references(() => courts.id, { onDelete: "cascade" }),
  // 0=Sunday, 1=Monday, ..., 6=Saturday (null means date-specific)
  dayOfWeek: integer("day_of_week"),
  specificDate: date("specific_date"),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  note: text("note"),
});

export const courtsRelations = relations(courts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [courts.organizationId],
    references: [organizations.id],
  }),
  availabilityRules: many(courtAvailabilityRules),
}));

export const courtAvailabilityRulesRelations = relations(
  courtAvailabilityRules,
  ({ one }) => ({
    court: one(courts, {
      fields: [courtAvailabilityRules.courtId],
      references: [courts.id],
    }),
  })
);

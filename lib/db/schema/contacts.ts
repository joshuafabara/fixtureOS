import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./auth";
import { clubs } from "./tournaments";

export const clubContacts = pgTable("club_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clubId: uuid("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  contactName: text("contact_name").notNull(),
  contactRole: text("contact_role"),
  // Validated: ^[0-9]{10,15}$ — digits only, country code included
  // Example: 593998375914
  whatsappNumber: text("whatsapp_number"),
  isPrimary: boolean("is_primary").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clubContactsRelations = relations(clubContacts, ({ one }) => ({
  organization: one(organizations, {
    fields: [clubContacts.organizationId],
    references: [organizations.id],
  }),
  club: one(clubs, {
    fields: [clubContacts.clubId],
    references: [clubs.id],
  }),
}));

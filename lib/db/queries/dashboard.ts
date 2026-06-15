import { db } from "@/lib/db";
import { tournaments, dryRuns, matches, fixtureDates, clubContacts, auditLogs, users } from "@/lib/db/schema";
import { eq, and, count, isNull, sql } from "drizzle-orm";

export async function getDashboardStats(organizationId: string) {
  const [activeTournaments] = await db
    .select({ count: count() })
    .from(tournaments)
    .where(
      and(
        eq(tournaments.organizationId, organizationId),
        eq(tournaments.status, "active")
      )
    );

  const [pendingDryRuns] = await db
    .select({ count: count() })
    .from(dryRuns)
    .where(
      and(
        eq(dryRuns.organizationId, organizationId),
        eq(dryRuns.status, "ready")
      )
    );

  const [publishedDates] = await db
    .select({ count: count() })
    .from(fixtureDates)
    .where(
      and(
        eq(fixtureDates.organizationId, organizationId),
        eq(fixtureDates.state, "published")
      )
    );

  const [missingContacts] = await db
    .select({ count: count() })
    .from(clubContacts)
    .where(
      and(
        eq(clubContacts.organizationId, organizationId),
        isNull(clubContacts.whatsappNumber)
      )
    );

  return {
    activeTournaments: activeTournaments?.count ?? 0,
    pendingDryRuns: pendingDryRuns?.count ?? 0,
    publishedDates: publishedDates?.count ?? 0,
    missingContacts: missingContacts?.count ?? 0,
  };
}

export async function getRecentActivity(organizationId: string, limit = 10) {
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      createdAt: auditLogs.createdAt,
      userName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(eq(auditLogs.organizationId, organizationId))
    .orderBy(sql`${auditLogs.createdAt} desc`)
    .limit(limit);
}

export async function getUpcomingMatches(organizationId: string, limit = 10) {
  return db
    .select({
      id: matches.id,
      scheduledDate: matches.scheduledDate,
      startTime: matches.startTime,
      phase: matches.phase,
      status: matches.status,
    })
    .from(matches)
    .where(
      and(
        eq(matches.organizationId, organizationId),
        eq(matches.status, "scheduled")
      )
    )
    .orderBy(matches.scheduledDate, matches.startTime)
    .limit(limit);
}

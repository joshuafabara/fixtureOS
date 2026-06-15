import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clubs, categories, teams, importBatches, auditLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const rowSchema = z.object({
  clubName: z.string(),
  teamName: z.string(),
  categoryName: z.string(),
  categoryColor: z.string().nullable(),
});

const bodySchema = z.object({
  tournamentId: z.string().uuid(),
  rows: z.array(rowSchema).min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as typeof session.user & { organizationId: string; id: string };

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { tournamentId, rows } = parsed.data;
  const orgId = user.organizationId;

  // Load existing clubs & categories for dedup
  const existingClubs = await db.select({ id: clubs.id, normalized: clubs.normalizedName })
    .from(clubs).where(eq(clubs.organizationId, orgId));
  const clubMap = new Map(existingClubs.map((c) => [c.normalized, c.id]));

  const existingCats = await db.select({ id: categories.id, name: categories.name })
    .from(categories).where(and(eq(categories.organizationId, orgId), eq(categories.tournamentId, tournamentId)));
  const catMap = new Map(existingCats.map((c) => [c.name.toLowerCase(), c.id]));

  const stats = { clubsCreated: 0, categoriesCreated: 0, teamsCreated: 0, teamsSkipped: 0 };

  // Create batch record
  const [batch] = await db.insert(importBatches).values({
    organizationId: orgId,
    tournamentId,
    sourceType: "excel",
    status: "processing",
    createdBy: user.id,
  }).returning();

  try {
    for (const row of rows) {
      const normalizedClub = row.clubName.toLowerCase().trim();

      // Upsert club
      let clubId = clubMap.get(normalizedClub);
      if (!clubId) {
        const [newClub] = await db.insert(clubs).values({
          organizationId: orgId,
          name: row.clubName.trim(),
          normalizedName: normalizedClub,
        }).returning();
        clubId = newClub.id;
        clubMap.set(normalizedClub, clubId);
        stats.clubsCreated++;
      }

      // Upsert category
      const catKey = row.categoryName.toLowerCase().trim();
      let catId = catMap.get(catKey);
      if (!catId) {
        const [newCat] = await db.insert(categories).values({
          organizationId: orgId,
          tournamentId,
          name: row.categoryName.trim(),
          colorHex: row.categoryColor ?? null,
          isActiveForFixture: false,
        }).returning();
        catId = newCat.id;
        catMap.set(catKey, catId);
        stats.categoriesCreated++;
      }

      // Check if team exists
      const existingTeam = await db.select({ id: teams.id })
        .from(teams)
        .where(and(
          eq(teams.organizationId, orgId),
          eq(teams.categoryId, catId),
          eq(teams.normalizedName, row.teamName.toLowerCase().trim()),
        ))
        .limit(1);

      if (existingTeam.length > 0) {
        stats.teamsSkipped++;
        continue;
      }

      await db.insert(teams).values({
        organizationId: orgId,
        clubId,
        categoryId: catId,
        name: row.teamName.trim(),
        normalizedName: row.teamName.toLowerCase().trim(),
        status: "active",
      });
      stats.teamsCreated++;
    }

    // Mark batch completed
    await db.update(importBatches).set({ status: "completed", summary: stats }).where(eq(importBatches.id, batch.id));

    await db.insert(auditLogs).values({
      organizationId: orgId,
      userId: user.id,
      action: "IMPORT_CONFIRMED",
      entityType: "import_batch",
      entityId: batch.id,
      afterJson: stats,
    });

    return NextResponse.json({ batchId: batch.id, ...stats });
  } catch (e) {
    await db.update(importBatches).set({ status: "failed" }).where(eq(importBatches.id, batch.id));
    throw e;
  }
}

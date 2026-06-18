import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { importBatches, clubs, categories, teams, auditLogs } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { ParsedTeamRow } from "@/lib/imports/excel";
import type { DiffRow } from "@/lib/imports/diff";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [batch] = await db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.id, params.id), eq(importBatches.organizationId, session.user.organizationId)))
    .limit(1);

  if (!batch) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const orgId = session.user.organizationId;
  const tournamentId = batch.tournamentId;
  if (!tournamentId) return NextResponse.json({ error: "Importación sin torneo destino" }, { status: 400 });

  const mappingData = batch.mappingData as Record<string, unknown> | null;
  const confirmedRows = mappingData?.confirmedRows as { rows?: ParsedTeamRow[] } | ParsedTeamRow[] | null;
  const previewData = mappingData?.preview as { rows?: ParsedTeamRow[] } | null;
  const rows: ParsedTeamRow[] = (Array.isArray(confirmedRows) ? confirmedRows : confirmedRows?.rows ?? previewData?.rows ?? []);

  if (rows.length === 0) return NextResponse.json({ error: "Sin filas confirmadas para importar" }, { status: 400 });

  const diffData = batch.diffData as Record<string, unknown> | null;
  const decisions: Record<string, number> = (diffData?.decisions as Record<string, number>) ?? {};
  const diffRows: DiffRow[] = (diffData?.diff ?? []) as DiffRow[];

  const existingClubs = await db.select({ id: clubs.id, normalized: clubs.normalizedName }).from(clubs).where(eq(clubs.organizationId, orgId));
  const clubMap = new Map(existingClubs.map((c) => [c.normalized, c.id]));

  const existingCats = await db.select({ id: categories.id, name: categories.name }).from(categories).where(and(eq(categories.organizationId, orgId), eq(categories.tournamentId, tournamentId)));
  const catMap = new Map(existingCats.map((c) => [c.name.toLowerCase(), c.id]));

  const stats = { clubsCreated: 0, categoriesCreated: 0, teamsCreated: 0, teamsSkipped: 0, teamsRetired: 0 };

  // Apply diff decisions (retires, renames, color updates)
  for (const drow of diffRows) {
    const decIdx = decisions[drow.id] ?? 0;
    const decision = drow.decisions[decIdx] ?? drow.decisions[0];

    if (drow.type === "retired" && decision === "Equipo Retirado") {
      // Find and retire the team
      const normName = drow.entity.toLowerCase();
      const teamRec = await db.select({ id: teams.id }).from(teams).where(and(eq(teams.organizationId, orgId), eq(teams.normalizedName, normName))).limit(1);
      if (teamRec[0]) {
        await db.update(teams).set({ status: "retired" }).where(eq(teams.id, teamRec[0].id));
        stats.teamsRetired++;
      }
    }
  }

  // Upsert clubs, categories, teams
  for (const row of rows) {
    const normClub = row.clubName.toLowerCase().trim();
    let clubId = clubMap.get(normClub);
    if (!clubId) {
      const [newClub] = await db.insert(clubs).values({ organizationId: orgId, name: row.clubName.trim(), normalizedName: normClub }).returning();
      clubId = newClub.id;
      clubMap.set(normClub, clubId);
      stats.clubsCreated++;
    }

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

    const existing = await db.select({ id: teams.id }).from(teams).where(and(eq(teams.organizationId, orgId), eq(teams.categoryId, catId), eq(teams.normalizedName, row.teamName.toLowerCase().trim()))).limit(1);
    if (existing.length > 0) { stats.teamsSkipped++; continue; }

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

  await db.update(importBatches).set({ status: "confirmed", summary: stats, updatedAt: new Date() }).where(eq(importBatches.id, batch.id));

  await db.insert(auditLogs).values({
    organizationId: orgId,
    userId: session.user.id,
    action: "IMPORT_CONFIRMED",
    entityType: "import_batch",
    entityId: batch.id,
    afterJson: stats,
  });

  return NextResponse.json({ batchId: batch.id, ...stats });
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  tournaments, clubs, categories, teams,
  importBatches, constraintSets, contextVersions,
} from "@/lib/db/schema";
import { and, eq, inArray, ne, notExists } from "drizzle-orm";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1).optional(),
  sport: z.string().nullable().optional(),
  status: z.enum(["draft", "active", "completed", "archived"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
  if (parsed.data.sport !== undefined) updates.sport = parsed.data.sport?.trim() ?? null;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  const [updated] = await db
    .update(tournaments)
    .set(updates)
    .where(and(eq(tournaments.id, params.id), eq(tournaments.organizationId, session.user.organizationId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = session.user.organizationId;
  const tournamentId = params.id;

  // Verify ownership
  const [tournament] = await db
    .select({ id: tournaments.id })
    .from(tournaments)
    .where(and(eq(tournaments.id, tournamentId), eq(tournaments.organizationId, orgId)))
    .limit(1);
  if (!tournament) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Find clubs whose only teams belong to this tournament — they'll become orphaned
  const tournamentTeamClubs = await db
    .selectDistinct({ clubId: teams.clubId })
    .from(teams)
    .innerJoin(categories, eq(teams.categoryId, categories.id))
    .where(and(eq(categories.tournamentId, tournamentId), eq(categories.organizationId, orgId)));

  const candidateClubIds = tournamentTeamClubs
    .map((r) => r.clubId)
    .filter((id): id is string => id !== null);

  // Of those clubs, keep any that also have teams in other tournaments
  const clubsWithOtherTeams =
    candidateClubIds.length > 0
      ? await db
          .selectDistinct({ clubId: teams.clubId })
          .from(teams)
          .innerJoin(categories, eq(teams.categoryId, categories.id))
          .where(
            and(
              inArray(teams.clubId, candidateClubIds),
              ne(categories.tournamentId, tournamentId),
            ),
          )
      : [];

  const keepClubIds = new Set(clubsWithOtherTeams.map((r) => r.clubId));
  const orphanClubIds = candidateClubIds.filter((id) => !keepClubIds.has(id));

  // Delete items not covered by tournament CASCADE:
  // importBatches uses onDelete: "set null" — must be deleted explicitly
  await db
    .delete(importBatches)
    .where(and(eq(importBatches.tournamentId, tournamentId), eq(importBatches.organizationId, orgId)));

  // constraintSets has no FK to tournaments — delete explicitly
  await db
    .delete(constraintSets)
    .where(and(eq(constraintSets.tournamentId, tournamentId), eq(constraintSets.organizationId, orgId)));

  // contextVersions scoped to this tournament (scopeId = tournamentId, scope = "tournament")
  await db
    .delete(contextVersions)
    .where(and(eq(contextVersions.scopeId, tournamentId), eq(contextVersions.organizationId, orgId)));

  // Delete the tournament — CASCADE handles:
  // categories → teams, gameModes, standingsImports/Rows
  // fixtureVersions → fixtureDates, matches, manualOverrides
  // dryRuns → dryRunChanges, aiAuditReports
  // fixtureExports
  await db
    .delete(tournaments)
    .where(and(eq(tournaments.id, tournamentId), eq(tournaments.organizationId, orgId)));

  // Clean up now-orphaned clubs (no remaining teams anywhere in the org)
  if (orphanClubIds.length > 0) {
    await db
      .delete(clubs)
      .where(and(inArray(clubs.id, orphanClubIds), eq(clubs.organizationId, orgId)));
  }

  return NextResponse.json({ ok: true });
}

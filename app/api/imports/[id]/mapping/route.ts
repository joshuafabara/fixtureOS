import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { importBatches, clubs, categories, teams } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { computeDiff, computeCreateSummary } from "@/lib/imports/diff";
import type { ParsedTeamRow } from "@/lib/imports/excel";
import { z } from "zod";

const bodySchema = z.object({
  // column → field assignments: { "A": "club", "B": "team", ... }
  columnMapping: z.record(z.string()),
  // confirmed rows after applying mapping
  rows: z.array(z.object({
    clubName: z.string(),
    teamName: z.string(),
    categoryName: z.string(),
    categoryColor: z.string().nullable(),
  })),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [batch] = await db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.id, params.id), eq(importBatches.organizationId, session.user.organizationId)))
    .limit(1);

  if (!batch) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const rows: ParsedTeamRow[] = parsed.data.rows;

  // Recompute diff with the confirmed rows
  let diffData = null;
  if (batch.mode === "update" && batch.tournamentId) {
    const [existingClubs, existingCats, existingTeams] = await Promise.all([
      db.select({ id: clubs.id, name: clubs.name, normalizedName: clubs.normalizedName }).from(clubs).where(eq(clubs.organizationId, session.user.organizationId)),
      db.select({ id: categories.id, name: categories.name, colorHex: categories.colorHex }).from(categories).where(and(eq(categories.organizationId, session.user.organizationId), eq(categories.tournamentId, batch.tournamentId))),
      db.select({ id: teams.id, name: teams.name, normalizedName: teams.normalizedName, categoryId: teams.categoryId, clubId: teams.clubId, status: teams.status }).from(teams).where(eq(teams.organizationId, session.user.organizationId)),
    ]);
    diffData = computeDiff(rows, existingClubs, existingCats, existingTeams);
  } else if (batch.mode === "create") {
    diffData = computeCreateSummary(rows);
  }

  const existingMapping = (batch.mappingData as Record<string, unknown>) ?? {};
  await db.update(importBatches).set({
    mappingData: { ...existingMapping, columnMapping: parsed.data.columnMapping, confirmedRows: rows },
    diffData: diffData ?? null,
    status: "review",
    updatedAt: new Date(),
  }).where(eq(importBatches.id, batch.id));

  return NextResponse.json({ ok: true, diffRows: diffData?.diff.length ?? 0 });
}

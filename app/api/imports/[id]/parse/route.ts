import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { importBatches, clubs, categories, teams } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { parseExcelBuffer } from "@/lib/imports/excel";
import { parseCSVBuffer } from "@/lib/imports/csv";
import { extractTeamsFromImage } from "@/lib/imports/image";
import { computeDiff } from "@/lib/imports/diff";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [batch] = await db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.id, params.id), eq(importBatches.organizationId, session.user.organizationId)))
    .limit(1);

  if (!batch) return NextResponse.json({ error: "Importación no encontrada" }, { status: 404 });

  await db.update(importBatches).set({ status: "parsing", updatedAt: new Date() }).where(eq(importBatches.id, batch.id));

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userPrompt = (formData.get("prompt") as string | null) ?? undefined;

    let preview;

    if (batch.sourceType === "excel") {
      if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
      const buf = Buffer.from(await file.arrayBuffer());
      preview = await parseExcelBuffer(buf);
    } else if (batch.sourceType === "csv") {
      if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
      const buf = Buffer.from(await file.arrayBuffer());
      preview = await parseCSVBuffer(buf);
    } else if (batch.sourceType === "image") {
      if (!file) return NextResponse.json({ error: "No se recibió imagen" }, { status: 400 });
      const buf = Buffer.from(await file.arrayBuffer());
      const base64 = buf.toString("base64");
      const result = await extractTeamsFromImage(base64, file.type, userPrompt);
      preview = result.preview;
      // Store extracted rows (with confidence) in mappingData
      await db.update(importBatches).set({
        mappingData: { preview, extractedRows: result.rows, warnings: result.warnings },
        status: "mapping",
        updatedAt: new Date(),
      }).where(eq(importBatches.id, batch.id));
      return NextResponse.json({ batchId: batch.id, preview, extractedRows: result.rows });
    } else if (batch.sourceType === "drupal") {
      const endpoint = formData.get("endpoint") as string | null;
      const token = formData.get("token") as string | null;
      if (!endpoint) return NextResponse.json({ error: "Se requiere endpoint" }, { status: 400 });

      const headers: Record<string, string> = { Accept: "application/vnd.api+json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(endpoint, { headers });
      if (!res.ok) return NextResponse.json({ error: `Endpoint respondió ${res.status}` }, { status: 422 });

      // Basic Drupal JSON:API → ParsedTeamRow conversion
      const json = await res.json() as { data?: { attributes?: Record<string, unknown> }[] };
      const rows = (json.data ?? []).map((item) => ({
        clubName: String(item.attributes?.field_club ?? ""),
        teamName: String(item.attributes?.title ?? item.attributes?.name ?? ""),
        categoryName: String(item.attributes?.field_category ?? ""),
        categoryColor: null as string | null,
      })).filter((r) => r.teamName);

      preview = {
        rows,
        clubs: [...new Set(rows.map((r) => r.clubName).filter(Boolean))],
        categories: [...new Map(rows.map((r) => [r.categoryName, null])).entries()].map(([name, color]) => ({ name, color })),
        totalTeams: rows.length,
        warnings: [],
      };
    } else {
      return NextResponse.json({ error: "Tipo de fuente no soportado" }, { status: 400 });
    }

    // Compute diff if update mode and tournamentId is set
    let diff = null;
    if (batch.mode === "update" && batch.tournamentId) {
      const [existingClubs, existingCats, existingTeams] = await Promise.all([
        db.select({ id: clubs.id, name: clubs.name, normalizedName: clubs.normalizedName }).from(clubs).where(eq(clubs.organizationId, session.user.organizationId)),
        db.select({ id: categories.id, name: categories.name, colorHex: categories.colorHex }).from(categories).where(and(eq(categories.organizationId, session.user.organizationId), eq(categories.tournamentId, batch.tournamentId))),
        db.select({ id: teams.id, name: teams.name, normalizedName: teams.normalizedName, categoryId: teams.categoryId, clubId: teams.clubId, status: teams.status }).from(teams).where(eq(teams.organizationId, session.user.organizationId)),
      ]);
      diff = computeDiff(preview.rows, existingClubs, existingCats, existingTeams);
    }

    await db.update(importBatches).set({
      mappingData: { preview, warnings: preview.warnings },
      diffData: diff ?? null,
      status: diff ? "review" : "mapping",
      updatedAt: new Date(),
    }).where(eq(importBatches.id, batch.id));

    return NextResponse.json({ batchId: batch.id, preview, diff });
  } catch (e) {
    await db.update(importBatches).set({ status: "failed", updatedAt: new Date() }).where(eq(importBatches.id, batch.id));
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al parsear" }, { status: 422 });
  }
}

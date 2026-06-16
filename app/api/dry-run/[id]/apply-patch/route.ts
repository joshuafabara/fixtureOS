import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { dryRuns, dryRunChanges } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import type { MatchPatch } from "@/lib/ai/fixture-editor";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as typeof session.user & { organizationId: string };
  const orgId = user.organizationId;
  const dryRunId = params.id;

  const body = await req.json();
  const { patches } = body as { patches: MatchPatch[] };

  if (!Array.isArray(patches) || patches.length === 0) {
    return NextResponse.json({ error: "No hay parches para aplicar" }, { status: 400 });
  }

  const [dryRun] = await db
    .select()
    .from(dryRuns)
    .where(and(eq(dryRuns.id, dryRunId), eq(dryRuns.organizationId, orgId)))
    .limit(1);

  if (!dryRun) return NextResponse.json({ error: "Dry run no encontrado" }, { status: 404 });

  const allChanges = await db
    .select()
    .from(dryRunChanges)
    .where(eq(dryRunChanges.dryRunId, dryRunId));

  const changeByMatchId = new Map<string, typeof allChanges[0]>();
  for (const c of allChanges) {
    if (c.changeType === "add") {
      changeByMatchId.set(c.entityId ?? c.id, c);
    }
  }

  const applied: string[] = [];
  const skipped: string[] = [];

  for (const patch of patches) {
    const change = changeByMatchId.get(patch.matchId);
    if (!change) { skipped.push(patch.matchId); continue; }

    const current = (change.afterJson ?? {}) as Record<string, unknown>;
    const updated: Record<string, unknown> = { ...current };

    if (patch.changes.scheduledDate !== undefined) updated.date = patch.changes.scheduledDate;
    if (patch.changes.startTime !== undefined) updated.startTime = patch.changes.startTime;
    if (patch.changes.endTime !== undefined) updated.endTime = patch.changes.endTime;
    if (patch.changes.courtName !== undefined) updated.courtName = patch.changes.courtName;

    await db
      .update(dryRunChanges)
      .set({ afterJson: updated })
      .where(
        and(
          eq(dryRunChanges.dryRunId, dryRunId),
          or(
            eq(dryRunChanges.entityId, patch.matchId),
            eq(dryRunChanges.id, patch.matchId),
          )
        )
      );

    applied.push(patch.matchId);
  }

  return NextResponse.json({ applied, skipped });
}

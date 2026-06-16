import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { dryRuns, dryRunChanges, teams, categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { editFixtureWithAI, type EditableMatch } from "@/lib/ai/fixture-editor";

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
  const { request } = body as { request: string };

  if (!request?.trim()) {
    return NextResponse.json({ error: "Solicitud vacía" }, { status: 400 });
  }

  const [dryRun] = await db
    .select()
    .from(dryRuns)
    .where(and(eq(dryRuns.id, dryRunId), eq(dryRuns.organizationId, orgId)))
    .limit(1);

  if (!dryRun) return NextResponse.json({ error: "Dry run no encontrado" }, { status: 404 });

  const changes = await db
    .select()
    .from(dryRunChanges)
    .where(and(eq(dryRunChanges.dryRunId, dryRunId)));

  const allTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.organizationId, orgId));
  const teamMap = new Map(allTeams.map((t) => [t.id, t.name]));

  const allCats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.organizationId, orgId));
  const catMap = new Map(allCats.map((c) => [c.id, c.name]));

  type MatchData = {
    categoryId?: string; homeTeamId?: string; awayTeamId?: string;
    date?: string; startTime?: string; endTime?: string; courtName?: string; phase?: string;
  };

  const matchList: EditableMatch[] = changes
    .filter((c) => c.changeType === "add")
    .map((c) => {
      const m = (c.afterJson ?? {}) as MatchData;
      return {
        id: c.entityId ?? c.id,
        categoryId: m.categoryId ?? "",
        categoryName: catMap.get(m.categoryId ?? "") ?? "—",
        homeTeamName: m.homeTeamId ? (teamMap.get(m.homeTeamId) ?? "—") : "—",
        awayTeamName: m.awayTeamId ? (teamMap.get(m.awayTeamId) ?? "—") : "—",
        scheduledDate: m.date ?? null,
        startTime: m.startTime ?? null,
        endTime: m.endTime ?? null,
        courtName: m.courtName ?? null,
        phase: m.phase ?? "regular",
      };
    });

  const result = await editFixtureWithAI(matchList, request);
  return NextResponse.json(result);
}

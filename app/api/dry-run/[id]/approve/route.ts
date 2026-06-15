import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  dryRuns, dryRunChanges, fixtureVersions, fixtureDates, matches, auditLogs,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as typeof session.user & {
    organizationId: string;
    id: string;
  };

  // Load dry run
  const [dryRun] = await db
    .select()
    .from(dryRuns)
    .where(
      and(
        eq(dryRuns.id, params.id),
        eq(dryRuns.organizationId, user.organizationId)
      )
    )
    .limit(1);

  if (!dryRun) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (dryRun.status !== "ready")
    return NextResponse.json({ error: `Cannot approve dry run with status: ${dryRun.status}` }, { status: 400 });

  // Check no unresolved error-severity conflicts
  const errorChanges = await db
    .select({ id: dryRunChanges.id })
    .from(dryRunChanges)
    .where(
      and(
        eq(dryRunChanges.dryRunId, dryRun.id),
        eq(dryRunChanges.severity, "error")
      )
    )
    .limit(1);

  if (errorChanges.length > 0) {
    return NextResponse.json(
      { error: "Hay conflictos sin resolver. Resuelve o acepta los conflictos antes de aprobar." },
      { status: 422 }
    );
  }

  // Load all "add" match changes
  const addChanges = await db
    .select()
    .from(dryRunChanges)
    .where(
      and(
        eq(dryRunChanges.dryRunId, dryRun.id),
        eq(dryRunChanges.changeType, "add")
      )
    );

  const summary = (dryRun.summary ?? {}) as Record<string, unknown>;

  // Create fixture version (next version number)
  const existingVersions = await db
    .select({ versionNumber: fixtureVersions.versionNumber })
    .from(fixtureVersions)
    .where(
      and(
        eq(fixtureVersions.organizationId, user.organizationId),
        eq(fixtureVersions.tournamentId, dryRun.tournamentId)
      )
    )
    .orderBy(fixtureVersions.versionNumber);

  const nextVersionNum = (existingVersions.at(-1)?.versionNumber ?? 0) + 1;

  const [fixtureVersion] = await db
    .insert(fixtureVersions)
    .values({
      organizationId: user.organizationId,
      tournamentId: dryRun.tournamentId,
      versionNumber: nextVersionNum,
      state: "draft",
      reason: `Aprobado desde dry run: ${dryRun.reason ?? ""}`,
      createdBy: user.id,
    })
    .returning();

  // Collect unique dates from scheduled matches
  const uniqueDates = new Set<string>();
  for (const change of addChanges) {
    const m = change.afterJson as Record<string, unknown> | null;
    if (m?.date) uniqueDates.add(m.date as string);
  }

  // Create fixture dates
  const fixtureDateMap = new Map<string, string>(); // date → fixtureDateId
  for (const date of uniqueDates) {
    const slug = `${slugify(date)}-${randomSuffix()}`;
    const [fd] = await db
      .insert(fixtureDates)
      .values({
        fixtureVersionId: fixtureVersion.id,
        organizationId: user.organizationId,
        date,
        state: "draft",
        publicSlug: slug,
      })
      .returning();
    fixtureDateMap.set(date, fd.id);
  }

  // Create matches from dry run changes
  const matchValues = addChanges
    .map((change) => {
      const m = change.afterJson as Record<string, unknown> | null;
      if (!m) return null;
      return {
        organizationId: user.organizationId,
        fixtureVersionId: fixtureVersion.id,
        fixtureDateId: m.date ? fixtureDateMap.get(m.date as string) ?? null : null,
        tournamentId: dryRun.tournamentId,
        categoryId: m.categoryId as string,
        phase: (m.phase as string) ?? "regular",
        homeTeamId: m.homeTeamId as string,
        awayTeamId: m.awayTeamId as string,
        scheduledDate: m.date as string,
        startTime: m.startTime as string,
        endTime: m.endTime as string,
        courtId: m.courtId as string,
        status: "scheduled" as const,
        isLocked: false,
      };
    })
    .filter(Boolean) as object[];

  if (matchValues.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insert(matches).values(matchValues as any[]);
  }

  // Mark dry run as approved
  await db
    .update(dryRuns)
    .set({ status: "approved", approvedAt: new Date() })
    .where(eq(dryRuns.id, dryRun.id));

  // Audit log
  await db.insert(auditLogs).values({
    organizationId: user.organizationId,
    userId: user.id,
    action: "APPROVE_DRY_RUN",
    entityType: "dry_run",
    entityId: dryRun.id,
    afterJson: {
      fixtureVersionId: fixtureVersion.id,
      versionNumber: nextVersionNum,
      matchesCreated: matchValues.length,
    },
  });

  return NextResponse.json({
    fixtureVersionId: fixtureVersion.id,
    versionNumber: nextVersionNum,
    matchesCreated: matchValues.length,
    datesCreated: uniqueDates.size,
  });
}

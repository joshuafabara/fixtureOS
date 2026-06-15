import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { fixtureVersions, fixtureDates, matches, auditLogs } from "@/lib/db/schema";
import { eq, and, max } from "drizzle-orm";

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

  const user = session.user as typeof session.user & { organizationId: string; id: string };

  // Load source version
  const [source] = await db
    .select()
    .from(fixtureVersions)
    .where(
      and(
        eq(fixtureVersions.id, params.id),
        eq(fixtureVersions.organizationId, user.organizationId)
      )
    )
    .limit(1);

  if (!source)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Next version number
  const [{ maxNum }] = await db
    .select({ maxNum: max(fixtureVersions.versionNumber) })
    .from(fixtureVersions)
    .where(
      and(
        eq(fixtureVersions.organizationId, user.organizationId),
        eq(fixtureVersions.tournamentId, source.tournamentId)
      )
    );

  const nextVersionNum = (maxNum ?? 0) + 1;

  // Create new version
  const [newVersion] = await db
    .insert(fixtureVersions)
    .values({
      organizationId: user.organizationId,
      tournamentId: source.tournamentId,
      versionNumber: nextVersionNum,
      parentVersionId: source.id,
      state: "draft",
      reason: `Restaurado desde V${source.versionNumber}`,
      createdBy: user.id,
    })
    .returning();

  // Load source dates and create new dates
  const sourceDates = await db
    .select()
    .from(fixtureDates)
    .where(eq(fixtureDates.fixtureVersionId, source.id));

  const dateIdMap = new Map<string, string>(); // old id → new id
  for (const fd of sourceDates) {
    const [newDate] = await db
      .insert(fixtureDates)
      .values({
        fixtureVersionId: newVersion.id,
        organizationId: user.organizationId,
        date: fd.date,
        state: "draft",
        publicSlug: `${fd.date}-${randomSuffix()}`,
      })
      .returning();
    dateIdMap.set(fd.id, newDate.id);
  }

  // Copy all matches
  const sourceMatches = await db
    .select()
    .from(matches)
    .where(eq(matches.fixtureVersionId, source.id));

  if (sourceMatches.length > 0) {
    const matchCopies = sourceMatches.map((m) => ({
      organizationId: user.organizationId,
      fixtureVersionId: newVersion.id,
      fixtureDateId: m.fixtureDateId ? (dateIdMap.get(m.fixtureDateId) ?? null) : null,
      tournamentId: m.tournamentId,
      categoryId: m.categoryId,
      phase: m.phase,
      groupName: m.groupName,
      bracketRound: m.bracketRound,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      scheduledDate: m.scheduledDate,
      startTime: m.startTime,
      endTime: m.endTime,
      courtId: m.courtId,
      status: "scheduled" as const,
      isLocked: false,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insert(matches).values(matchCopies as any[]);
  }

  await db.insert(auditLogs).values({
    organizationId: user.organizationId,
    userId: user.id,
    action: "RESTORE_FIXTURE_VERSION",
    entityType: "fixture_version",
    entityId: newVersion.id,
    afterJson: { versionNumber: nextVersionNum, restoredFrom: source.versionNumber },
  });

  return NextResponse.json({
    versionId: newVersion.id,
    versionNumber: nextVersionNum,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  fixtureVersions, fixtureDates, matches, manualOverrides, auditLogs,
} from "@/lib/db/schema";
import { eq, and, max } from "drizzle-orm";
import { z } from "zod";

const changeSchema = z.object({
  matchId: z.string().uuid(),
  newDate: z.string().nullable(),
  newStartTime: z.string().nullable(),
  newEndTime: z.string().nullable(),
  newCourtId: z.string().uuid().nullable(),
  newStatus: z.enum(["scheduled", "forfeit"]).default("scheduled"),
  changeType: z.enum(["move", "forfeit", "unforfeit", "swap_part", "court_change"]).default("move"),
});

const bodySchema = z.object({
  changes: z.array(changeSchema).min(1),
  reason: z.string().optional(),
});

function timesOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return s1 < e2 && e1 > s2;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as typeof session.user & { organizationId: string; id: string };

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });

  const { changes, reason } = parsed.data;

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

  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Build change map
  const changeMap = new Map(changes.map((c) => [c.matchId, c]));

  // Load all source matches
  const sourceMatches = await db
    .select()
    .from(matches)
    .where(eq(matches.fixtureVersionId, source.id));

  // Validate: locked matches cannot be edited
  const lockedEdited = sourceMatches.filter((m) => m.isLocked && changeMap.has(m.id));
  if (lockedEdited.length > 0) {
    return NextResponse.json(
      { error: `No se pueden editar partidos bloqueados: ${lockedEdited.map((m) => m.id).join(", ")}` },
      { status: 422 }
    );
  }

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
      reason: reason ?? `Edición manual (${changes.length} cambio${changes.length > 1 ? "s" : ""})`,
      createdBy: user.id,
    })
    .returning();

  // Copy source dates
  const sourceDates = await db
    .select()
    .from(fixtureDates)
    .where(eq(fixtureDates.fixtureVersionId, source.id));

  const dateIdMap = new Map<string, string>();
  const existingDateKeys = new Set<string>();

  for (const fd of sourceDates) {
    const [newDate] = await db
      .insert(fixtureDates)
      .values({
        fixtureVersionId: newVersion.id,
        organizationId: user.organizationId,
        date: fd.date,
        state: "draft",
        publicSlug: `${fd.date}-${Math.random().toString(36).slice(2, 8)}`,
      })
      .returning();
    dateIdMap.set(fd.date, newDate.id);
    existingDateKeys.add(fd.date);
  }

  // Ensure fixture dates exist for new dates introduced by edits
  for (const change of changes) {
    if (change.newDate && !existingDateKeys.has(change.newDate)) {
      const [newDate] = await db
        .insert(fixtureDates)
        .values({
          fixtureVersionId: newVersion.id,
          organizationId: user.organizationId,
          date: change.newDate,
          state: "draft",
          publicSlug: `${change.newDate}-${Math.random().toString(36).slice(2, 8)}`,
        })
        .returning();
      dateIdMap.set(change.newDate, newDate.id);
      existingDateKeys.add(change.newDate);
    }
  }

  // Build effective match list (apply changes)
  type EffectiveMatch = {
    originalId: string;
    organizationId: string;
    tournamentId: string;
    categoryId: string;
    phase: string;
    groupName: string | null;
    bracketRound: string | null;
    homeTeamId: string | null;
    awayTeamId: string | null;
    scheduledDate: string | null;
    startTime: string | null;
    endTime: string | null;
    courtId: string | null;
    status: string;
    isLocked: boolean;
  };

  const effectiveMatches: EffectiveMatch[] = sourceMatches.map((m) => {
    const change = changeMap.get(m.id);
    if (!change) {
      return {
        originalId: m.id,
        organizationId: user.organizationId,
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
        status: m.status,
        isLocked: m.isLocked,
      };
    }
    return {
      originalId: m.id,
      organizationId: user.organizationId,
      tournamentId: m.tournamentId,
      categoryId: m.categoryId,
      phase: m.phase,
      groupName: m.groupName,
      bracketRound: m.bracketRound,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      scheduledDate: change.newDate ?? m.scheduledDate,
      startTime: change.newStartTime ?? m.startTime,
      endTime: change.newEndTime ?? m.endTime,
      courtId: change.newCourtId ?? m.courtId,
      status: change.newStatus,
      isLocked: false,
    };
  });

  // Detect warnings
  const warnings: string[] = [];
  for (let i = 0; i < effectiveMatches.length; i++) {
    for (let j = i + 1; j < effectiveMatches.length; j++) {
      const a = effectiveMatches[i];
      const b = effectiveMatches[j];
      if (!a.scheduledDate || !b.scheduledDate || a.scheduledDate !== b.scheduledDate) continue;
      if (!a.startTime || !b.startTime || !a.endTime || !b.endTime) continue;
      if (!timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

      if (a.courtId && a.courtId === b.courtId) {
        warnings.push(`Conflicto de cancha: dos partidos asignados a la misma cancha al mismo horario (${a.scheduledDate} ${a.startTime})`);
      }
      const teamsA = [a.homeTeamId, a.awayTeamId].filter(Boolean);
      const teamsB = [b.homeTeamId, b.awayTeamId].filter(Boolean);
      const shared = teamsA.filter((t) => teamsB.includes(t));
      if (shared.length > 0) {
        warnings.push(`Conflicto de equipo: un equipo tiene dos partidos al mismo horario (${a.scheduledDate} ${a.startTime})`);
      }
    }
  }

  // Insert new matches
  const matchInserts = effectiveMatches.map((m) => ({
    organizationId: user.organizationId,
    fixtureVersionId: newVersion.id,
    fixtureDateId: m.scheduledDate ? (dateIdMap.get(m.scheduledDate) ?? null) : null,
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
    status: m.status as "scheduled" | "played" | "forfeit" | "cancelled",
    isLocked: m.isLocked,
  }));

  if (matchInserts.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.insert(matches).values(matchInserts as any[]);
  }

  // Store manual overrides
  for (const change of changes) {
    const original = sourceMatches.find((m) => m.id === change.matchId);
    await db.insert(manualOverrides).values({
      organizationId: user.organizationId,
      tournamentId: source.tournamentId,
      matchId: change.matchId,
      overrideType: change.changeType,
      overrideJson: {
        sourceVersionId: source.id,
        newVersionId: newVersion.id,
        before: {
          date: original?.scheduledDate,
          startTime: original?.startTime,
          endTime: original?.endTime,
          courtId: original?.courtId,
          status: original?.status,
        },
        after: {
          date: change.newDate,
          startTime: change.newStartTime,
          endTime: change.newEndTime,
          courtId: change.newCourtId,
          status: change.newStatus,
        },
      },
      createdBy: user.id,
    });
  }

  // Audit log
  await db.insert(auditLogs).values({
    organizationId: user.organizationId,
    userId: user.id,
    action: "MANUAL_EDIT_COMMITTED",
    entityType: "fixture_version",
    entityId: newVersion.id,
    afterJson: {
      sourceVersionId: source.id,
      newVersionNumber: nextVersionNum,
      changeCount: changes.length,
      warningCount: warnings.length,
    },
  });

  return NextResponse.json({
    versionId: newVersion.id,
    versionNumber: nextVersionNum,
    warnings,
  });
}

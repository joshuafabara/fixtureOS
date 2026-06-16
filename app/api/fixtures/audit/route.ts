import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  dryRuns,
  dryRunChanges,
  matches,
  manualOverrides,
  contextVersions,
  teams,
  aiAuditReports,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  auditFixture,
  hashAuditInput,
  type AuditInput,
  type ProposedMatch,
  type LockedMatch,
  type ManualOverride,
} from "@/lib/ai/fixture-auditor";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as typeof session.user & {
    organizationId: string;
    id: string;
  };
  const orgId = user.organizationId;

  const body = await req.json();
  const { dryRunId } = body as { dryRunId: string };

  if (!dryRunId) {
    return NextResponse.json({ error: "dryRunId requerido" }, { status: 400 });
  }

  // Load dry run
  const [dryRun] = await db
    .select()
    .from(dryRuns)
    .where(and(eq(dryRuns.id, dryRunId), eq(dryRuns.organizationId, orgId)))
    .limit(1);

  if (!dryRun) return NextResponse.json({ error: "Dry run no encontrado" }, { status: 404 });

  // Load dry run changes
  const changes = await db
    .select()
    .from(dryRunChanges)
    .where(eq(dryRunChanges.dryRunId, dryRunId));

  // Build proposed matches from add changes
  const proposedMatches: ProposedMatch[] = changes
    .filter((c) => c.changeType === "add")
    .map((c) => {
      const m = c.afterJson as Record<string, unknown> | null;
      if (!m) return null;
      return {
        id: c.entityId ?? c.id,
        categoryId: (m.categoryId as string) ?? "",
        homeTeamId: (m.homeTeamId as string) ?? null,
        awayTeamId: (m.awayTeamId as string) ?? null,
        scheduledDate: (m.date as string) ?? null,
        startTime: (m.startTime as string) ?? null,
        endTime: (m.endTime as string) ?? null,
        courtId: (m.courtId as string) ?? null,
        courtName: (m.courtName as string) ?? null,
        phase: (m.phase as string) ?? "regular",
      } satisfies ProposedMatch;
    })
    .filter(Boolean) as ProposedMatch[];

  // Load team names for this org
  const allTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.organizationId, orgId));
  const teamNames: Record<string, string> = Object.fromEntries(allTeams.map((t) => [t.id, t.name]));

  // Load context versions: org scope
  const orgContexts = await db
    .select()
    .from(contextVersions)
    .where(and(eq(contextVersions.organizationId, orgId), eq(contextVersions.scope, "organization")))
    .orderBy(desc(contextVersions.createdAt))
    .limit(1);

  // Load context versions: tournament scope
  const tournamentContexts = await db
    .select()
    .from(contextVersions)
    .where(
      and(
        eq(contextVersions.organizationId, orgId),
        eq(contextVersions.scope, "tournament"),
        eq(contextVersions.scopeId, dryRun.tournamentId)
      )
    )
    .orderBy(desc(contextVersions.createdAt))
    .limit(1);

  // Load context versions: category scope (all for this org)
  const categoryContexts = await db
    .select()
    .from(contextVersions)
    .where(and(eq(contextVersions.organizationId, orgId), eq(contextVersions.scope, "category")))
    .orderBy(desc(contextVersions.createdAt));

  // Load context versions: date scope
  const dateContexts = await db
    .select()
    .from(contextVersions)
    .where(and(eq(contextVersions.organizationId, orgId), eq(contextVersions.scope, "date")))
    .orderBy(desc(contextVersions.createdAt));

  // Merge parsedConstraints (org → tournament, tournament takes precedence)
  const orgConstraints = (orgContexts[0]?.parsedConstraints ?? {}) as Record<string, unknown>;
  const tournamentConstraints = (tournamentContexts[0]?.parsedConstraints ?? {}) as Record<string, unknown>;
  const mergedConstraints: Record<string, unknown> = { ...orgConstraints, ...tournamentConstraints };

  // Load locked matches (from base fixture version, if any)
  const lockedMatches: LockedMatch[] = [];
  if (dryRun.baseFixtureVersionId) {
    const locked = await db
      .select({
        id: matches.id,
        courtId: matches.courtId,
        scheduledDate: matches.scheduledDate,
        startTime: matches.startTime,
      })
      .from(matches)
      .where(
        and(
          eq(matches.fixtureVersionId, dryRun.baseFixtureVersionId),
          eq(matches.isLocked, true)
        )
      );
    lockedMatches.push(...locked.map((m) => ({
      id: m.id,
      courtId: m.courtId,
      scheduledDate: m.scheduledDate,
      startTime: m.startTime,
    })));
  }

  // Load active manual overrides for this tournament
  const overrides = await db
    .select()
    .from(manualOverrides)
    .where(
      and(
        eq(manualOverrides.organizationId, orgId),
        eq(manualOverrides.tournamentId, dryRun.tournamentId)
      )
    );

  const manualOverrideList: ManualOverride[] = overrides
    .filter((o) => !o.removedAt)
    .map((o) => ({
      id: o.id,
      overrideType: o.overrideType,
      overrideJson: (o.overrideJson as Record<string, unknown>) ?? {},
    }));

  // Build unique category context map (latest per scopeId)
  const latestCategoryContextByScopeId = new Map<string, typeof categoryContexts[0]>();
  for (const cv of categoryContexts) {
    if (cv.scopeId && !latestCategoryContextByScopeId.has(cv.scopeId)) {
      latestCategoryContextByScopeId.set(cv.scopeId, cv);
    }
  }

  // Category-level parsed constraints (for per-category rule checking)
  const categoryParsedConstraints: Record<string, Record<string, unknown>> = {};
  for (const [catId, cv] of latestCategoryContextByScopeId.entries()) {
    if (cv.parsedConstraints) {
      categoryParsedConstraints[catId] = cv.parsedConstraints as Record<string, unknown>;
    }
  }

  const input: AuditInput = {
    organizationContextPrompt: orgContexts[0]?.rawPrompt ?? "",
    tournamentContextPrompt: tournamentContexts[0]?.rawPrompt ?? "",
    categoryContextPrompts: Array.from(latestCategoryContextByScopeId.values()).map((cv) => ({
      categoryId: cv.scopeId ?? "",
      categoryName: cv.scopeId ?? "",
      prompt: cv.rawPrompt,
    })),
    dateContextPrompts: dateContexts.map((cv) => ({
      date: cv.scopeId ?? "",
      prompt: cv.rawPrompt,
    })),
    parsedConstraints: mergedConstraints,
    categoryParsedConstraints,
    constraintHierarchy: [
      "locked_match",
      "manual_override",
      "date",
      "category",
      "tournament",
      "organization",
      "system",
    ],
    proposedMatches,
    teamNames,
    lockedMatches,
    manualOverrides: manualOverrideList,
    dryRunChanges: changes.map((c) => ({
      changeType: c.changeType,
      severity: c.severity,
      explanation: c.explanation,
    })),
  };

  // Check for cached report with same input hash
  const inputHash = hashAuditInput(input);
  const [existing] = await db
    .select()
    .from(aiAuditReports)
    .where(
      and(
        eq(aiAuditReports.dryRunId, dryRunId),
        eq(aiAuditReports.inputHash, inputHash)
      )
    )
    .orderBy(desc(aiAuditReports.createdAt))
    .limit(1);

  if (existing) {
    return NextResponse.json({ report: existing.reportJson, cached: true });
  }

  // Run audit
  const report = await auditFixture(input);
  const model = process.env.OPENAI_API_KEY ? "gpt-4o" : "mock";

  // Persist report
  await db.insert(aiAuditReports).values({
    organizationId: orgId,
    dryRunId,
    status: report.status,
    confidence: report.confidence,
    model,
    inputHash,
    reportJson: report as unknown as Record<string, unknown>,
  });

  return NextResponse.json({ report, cached: false });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as typeof session.user & { organizationId: string };
  const orgId = user.organizationId;

  const url = new URL(req.url);
  const dryRunId = url.searchParams.get("dryRunId");
  if (!dryRunId) return NextResponse.json({ error: "dryRunId requerido" }, { status: 400 });

  const [report] = await db
    .select()
    .from(aiAuditReports)
    .where(
      and(
        eq(aiAuditReports.organizationId, orgId),
        eq(aiAuditReports.dryRunId, dryRunId)
      )
    )
    .orderBy(desc(aiAuditReports.createdAt))
    .limit(1);

  if (!report) return NextResponse.json({ report: null });
  return NextResponse.json({ report: report.reportJson });
}

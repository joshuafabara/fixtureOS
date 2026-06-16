import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  fixtureVersions, matches, tournaments,
  categories, teams, courts,
} from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { MatchEditor } from "@/components/fixture/match-editor";

export default async function ManualEditPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { v?: string };
}) {
  const orgId = await requireOrg();
  const tournamentId = params.id;

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(and(eq(tournaments.id, tournamentId), eq(tournaments.organizationId, orgId)))
    .limit(1);

  if (!tournament) notFound();

  const allVersions = await db
    .select({
      id: fixtureVersions.id,
      versionNumber: fixtureVersions.versionNumber,
      state: fixtureVersions.state,
    })
    .from(fixtureVersions)
    .where(
      and(
        eq(fixtureVersions.tournamentId, tournamentId),
        eq(fixtureVersions.organizationId, orgId)
      )
    )
    .orderBy(desc(fixtureVersions.versionNumber));

  if (allVersions.length === 0) notFound();

  const requestedV = searchParams.v ? parseInt(searchParams.v) : null;
  const version = requestedV
    ? (allVersions.find((v) => v.versionNumber === requestedV) ?? allVersions[0])
    : allVersions[0];

  const allTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.organizationId, orgId));
  const teamMap = new Map(allTeams.map((t) => [t.id, t.name]));

  const rawMatches = await db
    .select({
      id: matches.id,
      scheduledDate: matches.scheduledDate,
      startTime: matches.startTime,
      endTime: matches.endTime,
      status: matches.status,
      phase: matches.phase,
      isLocked: matches.isLocked,
      categoryId: matches.categoryId,
      categoryName: categories.name,
      categoryColorHex: categories.colorHex,
      homeTeamId: matches.homeTeamId,
      homeTeamName: teams.name,
      awayTeamId: matches.awayTeamId,
      courtId: matches.courtId,
      courtName: courts.name,
    })
    .from(matches)
    .leftJoin(categories, eq(matches.categoryId, categories.id))
    .leftJoin(teams, eq(matches.homeTeamId, teams.id))
    .leftJoin(courts, eq(matches.courtId, courts.id))
    .where(eq(matches.fixtureVersionId, version.id))
    .orderBy(asc(matches.scheduledDate), asc(matches.startTime));

  const matchData = rawMatches.map((m) => ({
    id: m.id,
    scheduledDate: m.scheduledDate,
    startTime: m.startTime,
    endTime: m.endTime,
    courtId: m.courtId,
    courtName: m.courtName,
    categoryId: m.categoryId ?? "",
    categoryName: m.categoryName,
    categoryColorHex: m.categoryColorHex,
    homeTeamName: m.homeTeamName,
    awayTeamName: m.awayTeamId ? (teamMap.get(m.awayTeamId) ?? null) : null,
    status: m.status,
    isLocked: m.isLocked,
    phase: m.phase,
  }));

  const courtList = await db
    .select({ id: courts.id, name: courts.name })
    .from(courts)
    .where(and(eq(courts.organizationId, orgId), eq(courts.isActive, true)))
    .orderBy(asc(courts.name));

  return (
    <MatchEditor
      versionId={version.id}
      tournamentId={tournamentId}
      tournamentName={tournament.name}
      versionNumber={version.versionNumber}
      versionState={version.state}
      matches={matchData}
      courts={courtList}
    />
  );
}

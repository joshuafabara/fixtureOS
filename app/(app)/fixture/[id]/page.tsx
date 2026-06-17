import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fixtureVersions, matches, tournaments, categories, teams, clubs, courts } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { FixtureViewerClient } from "@/components/fixture/fixture-viewer-client";

export default async function FixtureViewerPage({
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
    .select({ id: fixtureVersions.id, versionNumber: fixtureVersions.versionNumber, state: fixtureVersions.state })
    .from(fixtureVersions)
    .where(and(eq(fixtureVersions.tournamentId, tournamentId), eq(fixtureVersions.organizationId, orgId)))
    .orderBy(desc(fixtureVersions.versionNumber));

  if (allVersions.length === 0) {
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/fixture" className="hover:text-foreground flex items-center gap-1">← Fixtures</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{tournament.name}</span>
        </div>
        <h1 className="text-2xl font-bold">{tournament.name}</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
            <p className="font-medium">Sin versiones de fixture</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Genera y aprueba un dry run para crear la primera versión.
            </p>
            <Button asChild><Link href="/dry-run">Ir a Dry Runs</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requestedV = searchParams.v ? parseInt(searchParams.v) : null;
  const selectedVersion = requestedV
    ? (allVersions.find((v) => v.versionNumber === requestedV) ?? allVersions[0])
    : allVersions[0];

  // Load categories
  const allCategories = await db
    .select({ id: categories.id, name: categories.name, colorHex: categories.colorHex })
    .from(categories)
    .where(and(eq(categories.tournamentId, tournamentId), eq(categories.organizationId, orgId)))
    .orderBy(asc(categories.name));

  // Load matches with home team + court joins
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
      courtName: courts.name,
    })
    .from(matches)
    .leftJoin(categories, eq(matches.categoryId, categories.id))
    .leftJoin(teams, eq(matches.homeTeamId, teams.id))
    .leftJoin(courts, eq(matches.courtId, courts.id))
    .where(eq(matches.fixtureVersionId, selectedVersion.id))
    .orderBy(asc(matches.scheduledDate), asc(matches.startTime));

  // Load all teams (with clubId) for away team lookup + club resolution
  const allTeams = await db
    .select({ id: teams.id, name: teams.name, clubId: teams.clubId })
    .from(teams)
    .where(eq(teams.organizationId, orgId));
  const teamMap = new Map(allTeams.map((t) => [t.id, t.name]));

  const allClubs = await db
    .select({ id: clubs.id, name: clubs.name })
    .from(clubs)
    .where(eq(clubs.organizationId, orgId));
  const clubMap = new Map(allClubs.map((c) => [c.id, c.name]));
  const teamClubMap = new Map(
    allTeams.filter((t) => t.clubId).map((t) => [t.id, clubMap.get(t.clubId!) ?? null])
  );

  const matchesWithAway = rawMatches.map((m) => ({
    id: m.id,
    scheduledDate: m.scheduledDate ?? "",
    startTime: m.startTime ?? null,
    endTime: m.endTime ?? null,
    homeTeamName: m.homeTeamName ?? null,
    homeClubName: m.homeTeamId ? (teamClubMap.get(m.homeTeamId) ?? null) : null,
    awayTeamName: m.awayTeamId ? (teamMap.get(m.awayTeamId) ?? null) : null,
    awayClubName: m.awayTeamId ? (teamClubMap.get(m.awayTeamId) ?? null) : null,
    courtName: m.courtName ?? null,
    categoryId: m.categoryId ?? "",
    categoryName: m.categoryName ?? null,
    categoryColorHex: m.categoryColorHex ?? null,
    status: m.status,
    isLocked: m.isLocked,
    phase: m.phase ?? null,
  }));

  // Unique court names in schedule order
  const courtNames = [...new Set(
    rawMatches.map((m) => m.courtName).filter(Boolean) as string[]
  )];

  return (
    <FixtureViewerClient
      tournamentId={tournamentId}
      tournamentName={tournament.name}
      versionId={selectedVersion.id}
      versionNumber={selectedVersion.versionNumber}
      state={selectedVersion.state}
      allVersions={allVersions}
      matches={matchesWithAway}
      courtNames={courtNames}
      categories={allCategories.map((c) => ({ id: c.id, name: c.name, colorHex: c.colorHex ?? null }))}
    />
  );
}

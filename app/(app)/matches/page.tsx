import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  matches, fixtureVersions, tournaments, categories, teams, clubs, courts,
} from "@/lib/db/schema";
import { eq, and, inArray, or } from "drizzle-orm";
import { PendingMatchesClient, type PendingMatch, type FilterOptions } from "@/components/matches/pending-matches-client";

export default async function PendingMatchesPage() {
  const orgId = await requireOrg();

  // Load all published fixture versions for this org
  const publishedVersions = await db
    .select({ id: fixtureVersions.id, tournamentId: fixtureVersions.tournamentId })
    .from(fixtureVersions)
    .where(and(
      eq(fixtureVersions.organizationId, orgId),
      eq(fixtureVersions.state, "published"),
    ));

  const versionIds = publishedVersions.map((v) => v.id);

  // Load pending/scheduled matches from published fixtures
  const rawMatches = versionIds.length === 0 ? [] : await db
    .select({
      id: matches.id,
      tournamentId: matches.tournamentId,
      categoryId: matches.categoryId,
      homeTeamId: matches.homeTeamId,
      awayTeamId: matches.awayTeamId,
      scheduledDate: matches.scheduledDate,
      startTime: matches.startTime,
      endTime: matches.endTime,
      courtId: matches.courtId,
      phase: matches.phase,
      status: matches.status,
    })
    .from(matches)
    .where(and(
      eq(matches.organizationId, orgId),
      inArray(matches.fixtureVersionId, versionIds),
      or(eq(matches.status, "scheduled"), eq(matches.status, "pending")),
    ));

  // Load lookup tables
  const [allTournaments, allCategories, allTeams, allClubs, allCourts] = await Promise.all([
    db.select({ id: tournaments.id, name: tournaments.name }).from(tournaments).where(eq(tournaments.organizationId, orgId)),
    db.select({ id: categories.id, name: categories.name, colorHex: categories.colorHex, tournamentId: categories.tournamentId }).from(categories).where(eq(categories.organizationId, orgId)),
    db.select({ id: teams.id, name: teams.name, clubId: teams.clubId }).from(teams).where(eq(teams.organizationId, orgId)),
    db.select({ id: clubs.id, name: clubs.name }).from(clubs).where(eq(clubs.organizationId, orgId)),
    db.select({ id: courts.id, name: courts.name }).from(courts).where(and(eq(courts.organizationId, orgId), eq(courts.isActive, true))),
  ]);

  const tournamentMap = new Map(allTournaments.map((t) => [t.id, t.name]));
  const categoryMap   = new Map(allCategories.map((c) => [c.id, c]));
  const teamMap       = new Map(allTeams.map((t) => [t.id, t]));
  const clubMap       = new Map(allClubs.map((c) => [c.id, c.name]));
  const courtMap      = new Map(allCourts.map((c) => [c.id, c.name]));

  const pendingMatches: PendingMatch[] = rawMatches.map((m) => {
    const cat        = categoryMap.get(m.categoryId);
    const homeTeam   = m.homeTeamId ? teamMap.get(m.homeTeamId) : null;
    const awayTeam   = m.awayTeamId ? teamMap.get(m.awayTeamId) : null;
    const homeClubId = homeTeam?.clubId ?? null;
    const awayClubId = awayTeam?.clubId ?? null;
    return {
      id: m.id,
      tournamentId: m.tournamentId,
      tournamentName: tournamentMap.get(m.tournamentId) ?? "—",
      categoryId: m.categoryId,
      categoryName: cat?.name ?? "—",
      categoryColorHex: cat?.colorHex ?? null,
      homeTeamId: m.homeTeamId,
      homeTeamName: homeTeam?.name ?? null,
      homeClubId,
      homeClubName: homeClubId ? (clubMap.get(homeClubId) ?? null) : null,
      awayTeamId: m.awayTeamId,
      awayTeamName: awayTeam?.name ?? null,
      awayClubId,
      awayClubName: awayClubId ? (clubMap.get(awayClubId) ?? null) : null,
      scheduledDate: m.scheduledDate,
      startTime: m.startTime,
      endTime: m.endTime,
      courtId: m.courtId,
      courtName: m.courtId ? (courtMap.get(m.courtId) ?? null) : null,
      phase: m.phase,
      status: m.status,
    };
  });

  // Derive which tournaments/categories are actually represented in matches
  const usedTournamentIds = new Set(pendingMatches.map((m) => m.tournamentId));
  const usedCategoryIds   = new Set(pendingMatches.map((m) => m.categoryId));

  const filterOptions: FilterOptions = {
    tournaments: allTournaments.filter((t) => usedTournamentIds.has(t.id)),
    categories:  allCategories.filter((c) => usedCategoryIds.has(c.id)),
    clubs:       allClubs,
    courts:      allCourts,
  };

  return (
    <PendingMatchesClient
      matches={pendingMatches}
      filterOptions={filterOptions}
    />
  );
}

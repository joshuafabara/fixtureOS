import { db } from "@/lib/db";
import { fixtureDates, matches, tournaments, categories, teams, courts, fixtureVersions, organizations } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Calendar, Clock, Pin } from "lucide-react";

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-EC", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const PHASE_LABEL: Record<string, string> = {
  regular: "", group: "Fase de grupos", semifinal: "Semifinal",
  final: "Final", quarterfinal: "Cuartos",
};

export default async function PublicFixtureDatePage({ params }: { params: { slug: string } }) {
  const [fixtureDate] = await db
    .select()
    .from(fixtureDates)
    .where(eq(fixtureDates.publicSlug, params.slug))
    .limit(1);

  if (!fixtureDate || fixtureDate.state !== "published") notFound();

  const [version] = await db
    .select({ tournamentId: fixtureVersions.tournamentId, organizationId: fixtureVersions.organizationId })
    .from(fixtureVersions)
    .where(eq(fixtureVersions.id, fixtureDate.fixtureVersionId))
    .limit(1);

  if (!version) notFound();

  const [tournament] = await db
    .select({ name: tournaments.name, sport: tournaments.sport })
    .from(tournaments)
    .where(eq(tournaments.id, version.tournamentId))
    .limit(1);

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, version.organizationId))
    .limit(1);

  // Load all team names
  const allTeams = await db.select({ id: teams.id, name: teams.name }).from(teams).where(eq(teams.organizationId, version.organizationId));
  const teamMap = new Map(allTeams.map((t) => [t.id, t.name]));

  const dayMatches = await db
    .select({
      id: matches.id,
      startTime: matches.startTime,
      endTime: matches.endTime,
      status: matches.status,
      phase: matches.phase,
      homeTeamId: matches.homeTeamId,
      awayTeamId: matches.awayTeamId,
      homeTeamName: teams.name,
      courtName: courts.name,
      categoryName: categories.name,
      categoryColorHex: categories.colorHex,
    })
    .from(matches)
    .leftJoin(categories, eq(matches.categoryId, categories.id))
    .leftJoin(teams, eq(matches.homeTeamId, teams.id))
    .leftJoin(courts, eq(matches.courtId, courts.id))
    .where(eq(matches.fixtureDateId, fixtureDate.id))
    .orderBy(asc(matches.startTime));

  const matchesWithAway = dayMatches.map((m) => ({
    ...m,
    awayTeamName: m.awayTeamId ? (teamMap.get(m.awayTeamId) ?? null) : null,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
            {org?.name}
          </p>
          <h1 className="text-xl font-bold">{tournament?.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">{formatDate(fixtureDate.date)}</span>
          </div>
        </div>
      </header>

      {/* Matches */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {matchesWithAway.length} partido{matchesWithAway.length !== 1 ? "s" : ""}
        </p>

        {matchesWithAway.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Sin partidos programados.</p>
          </div>
        ) : (
          matchesWithAway.map((m) => (
            <div
              key={m.id}
              className="bg-card border rounded-xl px-4 py-4 space-y-2"
            >
              {/* Category + phase */}
              <div className="flex items-center gap-2">
                {m.categoryColorHex && (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: m.categoryColorHex }}
                  />
                )}
                <span className="text-xs font-semibold text-muted-foreground">
                  {m.categoryName}
                  {m.phase && m.phase !== "regular" ? ` · ${PHASE_LABEL[m.phase] ?? m.phase}` : ""}
                </span>
              </div>

              {/* Teams */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-bold flex-1">{m.homeTeamName ?? "—"}</span>
                <span className="text-xs font-bold text-muted-foreground px-2">vs</span>
                <span className="text-base font-bold flex-1 text-right">{m.awayTeamName ?? "—"}</span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {m.startTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {m.startTime.slice(0, 5)}
                    {m.endTime ? ` – ${m.endTime.slice(0, 5)}` : ""}
                  </span>
                )}
                {m.courtName && (
                  <span className="flex items-center gap-1">
                    <Pin className="h-3 w-3" />
                    {m.courtName}
                  </span>
                )}
                {m.status === "played" && (
                  <span className="text-emerald-600 font-semibold">Jugado</span>
                )}
                {m.status === "forfeit" && (
                  <span className="text-red-600 font-semibold">Forfeit</span>
                )}
              </div>
            </div>
          ))
        )}
      </main>

      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-xs text-muted-foreground border-t mt-6">
        Generado por FixtureOS · {org?.name}
      </footer>
    </div>
  );
}

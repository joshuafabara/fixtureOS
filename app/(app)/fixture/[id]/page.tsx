import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  fixtureVersions, matches,
  tournaments, categories, teams, courts,
} from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar, Clock, Pin, History, ChevronLeft,
  Lock, CheckCircle2, XCircle, MinusCircle, Edit2,
} from "lucide-react";
import { FixturePublishControls } from "@/components/fixture/fixture-publish-controls";

const STATE_BADGE: Record<string, "draft" | "published" | "archived"> = {
  draft: "draft", published: "published", archived: "archived",
};
const STATE_LABEL: Record<string, string> = {
  draft: "Borrador", published: "Publicado", archived: "Archivado",
};
const MATCH_STATUS_ICON: Record<string, React.ReactNode> = {
  scheduled: <Clock className="h-3 w-3 text-muted-foreground" />,
  played:    <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
  forfeit:   <XCircle className="h-3 w-3 text-red-500" />,
  cancelled: <MinusCircle className="h-3 w-3 text-muted-foreground" />,
};
const MATCH_STATUS_LABEL: Record<string, string> = {
  scheduled: "Programado", played: "Jugado", forfeit: "Forfeit", cancelled: "Cancelado",
};
const PHASE_LABEL: Record<string, string> = {
  regular: "", group: "Grupos", semifinal: "Semifinal",
  final: "Final", quarterfinal: "Cuartos",
};

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-EC", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export default async function FixtureViewerPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { v?: string; cat?: string };
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

  if (allVersions.length === 0) {
    return (
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/fixture" className="hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" /> Fixtures
          </Link>
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

  const allCategories = await db
    .select({ id: categories.id, name: categories.name, colorHex: categories.colorHex })
    .from(categories)
    .where(and(eq(categories.tournamentId, tournamentId), eq(categories.organizationId, orgId)))
    .orderBy(asc(categories.name));

  // Load matches with home team and court
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

  // Load all team names for away team lookup
  const allTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.organizationId, orgId));
  const teamMap = new Map(allTeams.map((t) => [t.id, t.name]));

  const catFilter = searchParams.cat ?? null;
  const filteredMatches = catFilter
    ? rawMatches.filter((m) => m.categoryId === catFilter)
    : rawMatches;

  type MatchRow = (typeof filteredMatches)[0] & { awayTeamName: string | null };
  const matchesWithAway: MatchRow[] = filteredMatches.map((m) => ({
    ...m,
    awayTeamName: m.awayTeamId ? (teamMap.get(m.awayTeamId) ?? null) : null,
  }));

  const byDate = new Map<string, MatchRow[]>();
  for (const m of matchesWithAway) {
    if (!m.scheduledDate) continue;
    if (!byDate.has(m.scheduledDate)) byDate.set(m.scheduledDate, []);
    byDate.get(m.scheduledDate)!.push(m);
  }
  const sortedDates = [...byDate.keys()].sort();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/fixture" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Fixtures
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{tournament.name}</span>
      </div>

      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <Badge variant={STATE_BADGE[selectedVersion.state] ?? "draft"}>
              {STATE_LABEL[selectedVersion.state] ?? selectedVersion.state}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredMatches.length} partido{filteredMatches.length !== 1 ? "s" : ""} ·{" "}
            {sortedDates.length} fecha{sortedDates.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            defaultValue={selectedVersion.versionNumber}
            onChange={(e) => {
              const cat = catFilter ? `&cat=${catFilter}` : "";
              window.location.href = `/fixture/${tournamentId}?v=${e.target.value}${cat}`;
            }}
            className="text-sm border border-border rounded-md px-2 py-1.5 bg-background"
          >
            {allVersions.map((v) => (
              <option key={v.id} value={v.versionNumber}>
                V{v.versionNumber} · {STATE_LABEL[v.state] ?? v.state}
              </option>
            ))}
          </select>
          <FixturePublishControls
            versionId={selectedVersion.id}
            state={selectedVersion.state as "draft" | "published" | "archived"}
            versionNumber={selectedVersion.versionNumber}
          />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/fixture/${tournamentId}/edit?v=${selectedVersion.versionNumber}`}>
              <Edit2 className="h-4 w-4" /> Editar
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/fixture/${tournamentId}/history`}>
              <History className="h-4 w-4" /> Historial
            </Link>
          </Button>
        </div>
      </div>

      {/* Category filter */}
      {allCategories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium shrink-0">Filtrar:</span>
          <Link
            href={`/fixture/${tournamentId}?v=${selectedVersion.versionNumber}`}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              !catFilter
                ? "bg-foreground text-background border-foreground"
                : "border-border hover:border-foreground/40"
            }`}
          >
            Todos
          </Link>
          {allCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/fixture/${tournamentId}?v=${selectedVersion.versionNumber}&cat=${cat.id}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                catFilter === cat.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: cat.colorHex ?? "#6b7280" }}
              />
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Date cards */}
      {sortedDates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-sm">
              {catFilter ? "Sin partidos para esta categoría." : "Sin partidos en esta versión."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {sortedDates.map((dateStr) => {
            const dayMatches = byDate.get(dateStr)!;
            return (
              <div key={dateStr}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold capitalize">{formatDate(dateStr)}</h2>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {dayMatches.length} partido{dayMatches.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <Card>
                  <CardContent className="p-0 divide-y">
                    {dayMatches.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono w-20 shrink-0">
                          <Clock className="h-3 w-3 shrink-0" />
                          {m.startTime?.slice(0, 5) ?? "—"}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground w-24 shrink-0">
                          <Pin className="h-3 w-3 shrink-0" />
                          {m.courtName ?? "—"}
                        </div>
                        <div className="flex items-center gap-1.5 w-28 shrink-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: m.categoryColorHex ?? "#6b7280" }}
                          />
                          <span className="text-xs font-medium text-muted-foreground truncate">
                            {m.categoryName}
                          </span>
                        </div>
                        {m.phase && m.phase !== "regular" && (
                          <span className="text-xs text-muted-foreground italic shrink-0">
                            {PHASE_LABEL[m.phase] ?? m.phase}
                          </span>
                        )}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm font-semibold truncate">{m.homeTeamName ?? "—"}</span>
                          <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded font-bold shrink-0">vs</span>
                          <span className="text-sm font-semibold truncate">{m.awayTeamName ?? "—"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {m.isLocked && <Lock className="h-3 w-3 text-amber-500" />}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {MATCH_STATUS_ICON[m.status] ?? null}
                            {MATCH_STATUS_LABEL[m.status] ?? m.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

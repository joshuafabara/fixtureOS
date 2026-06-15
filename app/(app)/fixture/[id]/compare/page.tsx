import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fixtureVersions, matches, tournaments, categories, teams, courts } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompare, ChevronLeft, Plus, Minus, ArrowRight, Calendar, Clock, Pin } from "lucide-react";

type MatchSnapshot = {
  key: string; // homeTeamId+awayTeamId+categoryId
  id: string;
  scheduledDate: string | null;
  startTime: string | null;
  endTime: string | null;
  courtName: string | null;
  categoryName: string | null;
  categoryColorHex: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  phase: string;
};

type DiffRow =
  | { type: "added"; b: MatchSnapshot }
  | { type: "removed"; a: MatchSnapshot }
  | { type: "moved"; a: MatchSnapshot; b: MatchSnapshot };

function matchKey(m: { homeTeamId: string | null; awayTeamId: string | null; categoryId: string }) {
  return `${m.homeTeamId}|${m.awayTeamId}|${m.categoryId}`;
}

function diffMatches(a: MatchSnapshot[], b: MatchSnapshot[]): DiffRow[] {
  const aMap = new Map(a.map((m) => [m.key, m]));
  const bMap = new Map(b.map((m) => [m.key, m]));
  const rows: DiffRow[] = [];

  for (const [key, bMatch] of bMap) {
    const aMatch = aMap.get(key);
    if (!aMatch) {
      rows.push({ type: "added", b: bMatch });
    } else if (
      aMatch.scheduledDate !== bMatch.scheduledDate ||
      aMatch.startTime !== bMatch.startTime ||
      aMatch.courtName !== bMatch.courtName
    ) {
      rows.push({ type: "moved", a: aMatch, b: bMatch });
    }
  }
  for (const [key, aMatch] of aMap) {
    if (!bMap.has(key)) {
      rows.push({ type: "removed", a: aMatch });
    }
  }

  // Sort: moved first, then added, then removed
  rows.sort((x, y) => {
    const order = { moved: 0, added: 1, removed: 2 };
    return order[x.type] - order[y.type];
  });

  return rows;
}

function fmt(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-EC", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export default async function FixtureComparePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { a?: string; b?: string };
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
    .orderBy(asc(fixtureVersions.versionNumber));

  const aNum = searchParams.a ? parseInt(searchParams.a) : (allVersions[0]?.versionNumber ?? null);
  const bNum = searchParams.b ? parseInt(searchParams.b) : (allVersions[1]?.versionNumber ?? null);

  const vA = aNum !== null ? allVersions.find((v) => v.versionNumber === aNum) : null;
  const vB = bNum !== null ? allVersions.find((v) => v.versionNumber === bNum) : null;

  const allTeams = await db.select({ id: teams.id, name: teams.name }).from(teams).where(eq(teams.organizationId, orgId));
  const teamMap = new Map(allTeams.map((t) => [t.id, t.name]));

  async function loadMatches(versionId: string): Promise<MatchSnapshot[]> {
    const rows = await db
      .select({
        id: matches.id,
        homeTeamId: matches.homeTeamId,
        awayTeamId: matches.awayTeamId,
        categoryId: matches.categoryId,
        scheduledDate: matches.scheduledDate,
        startTime: matches.startTime,
        endTime: matches.endTime,
        phase: matches.phase,
        categoryName: categories.name,
        categoryColorHex: categories.colorHex,
        homeTeamName: teams.name,
        courtName: courts.name,
      })
      .from(matches)
      .leftJoin(categories, eq(matches.categoryId, categories.id))
      .leftJoin(teams, eq(matches.homeTeamId, teams.id))
      .leftJoin(courts, eq(matches.courtId, courts.id))
      .where(eq(matches.fixtureVersionId, versionId))
      .orderBy(asc(matches.scheduledDate), asc(matches.startTime));

    return rows.map((r) => ({
      key: matchKey({ homeTeamId: r.homeTeamId, awayTeamId: r.awayTeamId, categoryId: r.categoryId ?? "" }),
      id: r.id,
      scheduledDate: r.scheduledDate,
      startTime: r.startTime,
      endTime: r.endTime,
      courtName: r.courtName,
      categoryName: r.categoryName,
      categoryColorHex: r.categoryColorHex,
      homeTeamName: r.homeTeamName,
      awayTeamName: r.awayTeamId ? (teamMap.get(r.awayTeamId) ?? null) : null,
      phase: r.phase,
    }));
  }

  const [matchesA, matchesB] = await Promise.all([
    vA ? loadMatches(vA.id) : Promise.resolve([]),
    vB ? loadMatches(vB.id) : Promise.resolve([]),
  ]);

  const diff = vA && vB ? diffMatches(matchesA, matchesB) : [];
  const added = diff.filter((d) => d.type === "added").length;
  const removed = diff.filter((d) => d.type === "removed").length;
  const moved = diff.filter((d) => d.type === "moved").length;
  const unchanged = matchesA.length - removed - moved;

  const STATE_LABEL: Record<string, string> = { draft: "Borrador", published: "Publicado", archived: "Archivado" };
  const STATE_BADGE: Record<string, "draft" | "published" | "archived"> = { draft: "draft", published: "published", archived: "archived" };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/fixture" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Fixtures
        </Link>
        <span>/</span>
        <Link href={`/fixture/${tournamentId}`} className="hover:text-foreground">{tournament.name}</Link>
        <span>/</span>
        <Link href={`/fixture/${tournamentId}/history`} className="hover:text-foreground">Historial</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Comparar</span>
      </div>

      <div className="flex items-center gap-2">
        <GitCompare className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Comparar versiones</h1>
      </div>

      {/* Version pickers */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Versión A (base)", current: aNum, other: bNum, param: "a" },
          { label: "Versión B (nueva)", current: bNum, other: aNum, param: "b" },
        ].map(({ label, current, other, param }) => (
          <div key={param}>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              {label}
            </label>
            <select
              defaultValue={current ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                const otherParam = param === "a" ? "b" : "a";
                window.location.href = `/fixture/${tournamentId}/compare?${param}=${val}&${otherParam}=${other ?? ""}`;
              }}
              className="w-full text-sm border border-border rounded-md px-2 py-2 bg-background"
            >
              <option value="">-- Seleccionar versión --</option>
              {allVersions.map((v) => (
                <option key={v.id} value={v.versionNumber}>
                  V{v.versionNumber} · {STATE_LABEL[v.state] ?? v.state}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {vA && vB ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Añadidos", count: added, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200", icon: <Plus className="h-4 w-4" /> },
              { label: "Eliminados", count: removed, color: "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200", icon: <Minus className="h-4 w-4" /> },
              { label: "Movidos", count: moved, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200", icon: <ArrowRight className="h-4 w-4" /> },
              { label: "Sin cambios", count: unchanged, color: "text-muted-foreground bg-muted/50 border-border", icon: null },
            ].map(({ label, count, color, icon }) => (
              <div key={label} className={`p-4 rounded-xl border ${color}`}>
                <div className="flex items-center justify-between mb-1">
                  {icon && <div>{icon}</div>}
                  <span className="stat-num text-2xl font-bold ml-auto">{count}</span>
                </div>
                <div className="text-xs font-medium">{label}</div>
              </div>
            ))}
          </div>

          {/* Version labels */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">V{vA.versionNumber}</span>
              <Badge variant={STATE_BADGE[vA.state] ?? "draft"}>{STATE_LABEL[vA.state]}</Badge>
              <span className="text-muted-foreground">({matchesA.length} partidos)</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <span className="font-semibold">V{vB.versionNumber}</span>
              <Badge variant={STATE_BADGE[vB.state] ?? "draft"}>{STATE_LABEL[vB.state]}</Badge>
              <span className="text-muted-foreground">({matchesB.length} partidos)</span>
            </div>
          </div>

          {/* Diff rows */}
          {diff.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <p className="text-sm">Las versiones son idénticas.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {diff.map((row, i) => {
                if (row.type === "added") {
                  const m = row.b;
                  return (
                    <Card key={i} className="border-emerald-200 dark:border-emerald-800">
                      <CardContent className="py-3 px-4 flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 text-xs font-bold shrink-0">
                          <Plus className="h-3 w-3" /> Añadido
                        </span>
                        {m.categoryColorHex && (
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.categoryColorHex }} />
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">{m.categoryName}</span>
                        <span className="font-semibold text-sm flex-1 min-w-0">{m.homeTeamName} vs {m.awayTeamName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3" /> {fmt(m.scheduledDate)}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" /> {m.startTime?.slice(0, 5) ?? "—"}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <Pin className="h-3 w-3" /> {m.courtName ?? "—"}
                        </span>
                      </CardContent>
                    </Card>
                  );
                }

                if (row.type === "removed") {
                  const m = row.a;
                  return (
                    <Card key={i} className="border-red-200 dark:border-red-800 opacity-70">
                      <CardContent className="py-3 px-4 flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 text-xs font-bold shrink-0">
                          <Minus className="h-3 w-3" /> Eliminado
                        </span>
                        {m.categoryColorHex && (
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.categoryColorHex }} />
                        )}
                        <span className="text-xs text-muted-foreground shrink-0">{m.categoryName}</span>
                        <span className="font-semibold text-sm flex-1 min-w-0 line-through">{m.homeTeamName} vs {m.awayTeamName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3" /> {fmt(m.scheduledDate)}
                        </span>
                      </CardContent>
                    </Card>
                  );
                }

                // moved
                const { a: ma, b: mb } = row;
                return (
                  <Card key={i} className="border-amber-200 dark:border-amber-800">
                    <CardContent className="py-3 px-4 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 text-xs font-bold shrink-0">
                          <ArrowRight className="h-3 w-3" /> Movido
                        </span>
                        {mb.categoryColorHex && (
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: mb.categoryColorHex }} />
                        )}
                        <span className="text-xs text-muted-foreground">{mb.categoryName}</span>
                        <span className="font-semibold text-sm">{mb.homeTeamName} vs {mb.awayTeamName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1 line-through">
                          <Calendar className="h-3 w-3" /> {fmt(ma.scheduledDate)} · {ma.startTime?.slice(0, 5)} · {ma.courtName}
                        </span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                          <Calendar className="h-3 w-3" /> {fmt(mb.scheduledDate)} · {mb.startTime?.slice(0, 5)} · {mb.courtName}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <p className="text-sm">Selecciona dos versiones para comparar.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

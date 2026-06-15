import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  dryRuns, dryRunChanges, tournaments, teams, categories,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap, Plus, AlertTriangle, X, ArrowRight, RefreshCw,
  CheckCircle, Calendar, Clock, Pin, ChevronLeft,
} from "lucide-react";
import { DryRunActions } from "@/components/dry-run/dry-run-actions";

type MatchData = {
  categoryId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  courtName?: string;
  phase?: string;
  roundIndex?: number;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Generando", ready: "Pendiente revisión",
  approved: "Aprobado", rejected: "Rechazado", expired: "Expirado",
};
const STATUS_BADGE: Record<string, "default" | "warning" | "success" | "error" | "secondary"> = {
  pending: "warning", ready: "warning", approved: "success", rejected: "error", expired: "secondary",
};

export default async function DryRunDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { filter?: string };
}) {
  const orgId = await requireOrg();

  const [dryRun] = await db
    .select()
    .from(dryRuns)
    .where(and(eq(dryRuns.id, params.id), eq(dryRuns.organizationId, orgId)))
    .limit(1);

  if (!dryRun) notFound();

  const [tournament] = await db
    .select({ name: tournaments.name })
    .from(tournaments)
    .where(eq(tournaments.id, dryRun.tournamentId))
    .limit(1);

  // Load changes
  const changes = await db
    .select()
    .from(dryRunChanges)
    .where(eq(dryRunChanges.dryRunId, dryRun.id));

  // Build team name lookup
  const allTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.organizationId, orgId));
  const teamMap = new Map(allTeams.map((t) => [t.id, t.name]));

  const allCategories = await db
    .select({ id: categories.id, name: categories.name, colorHex: categories.colorHex })
    .from(categories)
    .where(eq(categories.organizationId, orgId));
  const catMap = new Map(allCategories.map((c) => [c.id, c]));

  const addChanges = changes.filter((c) => c.changeType === "add");
  const conflictChanges = changes.filter((c) => c.changeType === "conflict");
  const warningChanges = changes.filter((c) => c.changeType === "warning");

  const hasConflicts = conflictChanges.length > 0;
  const summary = (dryRun.summary ?? {}) as Record<string, unknown>;

  const filter = searchParams.filter ?? "all";
  const displayedChanges = filter === "added" ? addChanges
    : filter === "conflict" ? conflictChanges
    : filter === "warning" ? warningChanges
    : changes;

  function formatDate(dateStr: string) {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("es-EC", {
      weekday: "short", day: "numeric", month: "short",
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-32">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/dry-run" className="hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" /> Dry Runs
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{dryRun.reason ?? "Revisión"}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Revisión de cambios</h1>
              <Badge variant={STATUS_BADGE[dryRun.status] ?? "default"}>
                {STATUS_LABELS[dryRun.status] ?? dryRun.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {tournament?.name} · Generado {new Date(dryRun.createdAt).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          {dryRun.status === "ready" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dry-run/generate?tournamentId=${dryRun.tournamentId}`}>
                <RefreshCw className="h-4 w-4" /> Regenerar
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="flex gap-3 flex-wrap">
        {([
          { key: "added", label: "Añadidos", count: addChanges.length, icon: <Plus className="h-4 w-4" />, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" },
          { key: "conflict", label: "Conflictos", count: conflictChanges.length, icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
          { key: "warning", label: "Advertencias", count: warningChanges.length, icon: <AlertTriangle className="h-4 w-4" />, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
        ] as const).map(({ key, label, count, icon, color }) => (
          <Link
            key={key}
            href={`/dry-run/${params.id}?filter=${filter === key ? "all" : key}`}
            className={`flex-1 min-w-[140px] p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
              filter === key ? color : "bg-background border-border hover:border-foreground/20"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={filter === key ? "" : "text-muted-foreground"}>{icon}</div>
              <span className="stat-num text-2xl font-bold">{count}</span>
            </div>
            <div className="text-sm font-medium text-muted-foreground">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Changes list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {filter === "all" ? `${changes.length} cambios totales` : `${displayedChanges.length} ${filter === "added" ? "partidos añadidos" : filter === "conflict" ? "conflictos" : "advertencias"}`}
            </h2>
            {filter !== "all" && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dry-run/${params.id}`}>Ver todos</Link>
              </Button>
            )}
          </div>

          {displayedChanges.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sin {filter === "conflict" ? "conflictos" : filter === "warning" ? "advertencias" : "cambios"}</p>
              </CardContent>
            </Card>
          ) : (
            displayedChanges.map((change, i) => {
              const isConflict = change.changeType === "conflict";
              const isWarning = change.changeType === "warning";
              const match = change.afterJson as MatchData | null;
              const cat = match?.categoryId ? catMap.get(match.categoryId) : null;
              const homeName = match?.homeTeamId ? teamMap.get(match.homeTeamId) ?? match.homeTeamId.slice(0, 8) : "—";
              const awayName = match?.awayTeamId ? teamMap.get(match.awayTeamId) ?? match.awayTeamId.slice(0, 8) : "—";

              return (
                <Card
                  key={change.id}
                  className={`overflow-hidden ${
                    isConflict ? "border-red-200 dark:border-red-800" : ""
                  }`}
                >
                  <div className={`flex items-center gap-3 px-4 py-3 border-b flex-wrap ${
                    isConflict ? "bg-red-50/50 dark:bg-red-900/10" : isWarning ? "bg-amber-50/50 dark:bg-amber-900/10" : "bg-muted/20"
                  }`}>
                    {isConflict ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-800">
                        <AlertTriangle className="h-3 w-3" /> Conflicto
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="h-3 w-3" /> Advertencia
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                        <Plus className="h-3 w-3" /> Añadido
                      </span>
                    )}
                    {cat && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: cat.colorHex ?? "#6b7280" }} />
                        <span className="text-xs font-semibold text-muted-foreground">{cat.name}</span>
                      </div>
                    )}
                    {!isConflict && !isWarning && match?.date && (
                      <span className="ml-auto text-xs text-muted-foreground font-mono">
                        Ronda {(match.roundIndex ?? 0) + 1}
                      </span>
                    )}
                  </div>

                  <CardContent className="py-3 px-4">
                    {isConflict || isWarning ? (
                      <p className="text-sm text-muted-foreground">{change.explanation}</p>
                    ) : match ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold flex-1">{homeName}</span>
                          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted font-bold">vs</span>
                          <span className="text-sm font-bold flex-1 text-right">{awayName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {match.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className="capitalize">{formatDate(match.date)}</span>
                            </span>
                          )}
                          {match.startTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {match.startTime} – {match.endTime}
                            </span>
                          )}
                          {match.courtName && (
                            <span className="flex items-center gap-1">
                              <Pin className="h-3 w-3" />
                              {match.courtName}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{change.explanation}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Right panel: eligibility + approve/reject */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Resumen del dry run</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ["Categorías elegibles", String(summary.categoriesEligible ?? "—")],
                ["Categorías omitidas", String(summary.categoriesSkipped ?? "—")],
                ["Partidos programados", String(summary.matchesScheduled ?? addChanges.length)],
                ["Sin slot disponible", String(summary.matchesUnscheduled ?? "0")],
                ["Conflictos", String(conflictChanges.length)],
                ["Advertencias", String(warningChanges.length)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-1 border-b last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-bold stat-num">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Skipped categories */}
          {Array.isArray(summary.eligibilityReasons) && (summary.eligibilityReasons as unknown[]).length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Categorías omitidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(summary.eligibilityReasons as Array<{ name: string; reasons: string[] }>).map((r) => (
                  <div key={r.name} className="text-xs">
                    <span className="font-semibold">{r.name}</span>
                    <ul className="text-muted-foreground mt-0.5 space-y-0.5">
                      {r.reasons.map((reason) => (
                        <li key={reason} className="flex items-center gap-1.5">
                          <X className="h-3 w-3 text-red-500 shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                  <Link href="/context">Completar configuración</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Approve / Reject */}
          {(dryRun.status === "ready" || dryRun.status === "pending") && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Decisión</CardTitle>
              </CardHeader>
              <CardContent>
                <DryRunActions
                  dryRunId={dryRun.id}
                  status={dryRun.status}
                  hasConflicts={hasConflicts}
                  totalChanges={addChanges.length}
                />
              </CardContent>
            </Card>
          )}

          {(dryRun.status === "approved" || dryRun.status === "rejected") && (
            <Card>
              <CardContent className="pt-5 text-center">
                <Badge variant={STATUS_BADGE[dryRun.status] ?? "default"} className="mb-2">
                  {STATUS_LABELS[dryRun.status]}
                </Badge>
                <p className="text-xs text-muted-foreground">Este dry run ya fue procesado.</p>
                {dryRun.status === "approved" && (
                  <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                    <Link href="/fixture">Ver fixture</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

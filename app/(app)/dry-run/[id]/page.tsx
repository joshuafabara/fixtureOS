import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  dryRuns, dryRunChanges, tournaments, teams, categories, aiAuditReports,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { AuditReport } from "@/lib/ai/fixture-auditor";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, RefreshCw, ChevronLeft } from "lucide-react";
import { DryRunActions } from "@/components/dry-run/dry-run-actions";
import { DryRunChangesViewer, type DryRunMatchRow } from "@/components/dry-run/dry-run-changes-viewer";

type MatchData = {
  categoryId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  courtId?: string;
  courtName?: string;
  phase?: string;
  roundIndex?: number;
  isPlaceholder?: boolean;
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
}: {
  params: { id: string };
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

  const changes = await db
    .select()
    .from(dryRunChanges)
    .where(eq(dryRunChanges.dryRunId, dryRun.id));

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

  // Load most recent AI audit report
  const [latestAudit] = await db
    .select()
    .from(aiAuditReports)
    .where(and(eq(aiAuditReports.dryRunId, dryRun.id), eq(aiAuditReports.organizationId, orgId)))
    .orderBy(desc(aiAuditReports.createdAt))
    .limit(1);
  const initialAuditReport = (latestAudit?.reportJson ?? null) as AuditReport | null;

  // Resolve all change rows server-side for the client viewer
  const resolvedRows: DryRunMatchRow[] = changes.map((change) => {
    const m = (change.afterJson ?? {}) as MatchData;
    const cat = m.categoryId ? catMap.get(m.categoryId) : null;
    return {
      id: change.entityId ?? change.id,
      changeType: change.changeType,
      severity: change.severity,
      explanation: change.explanation,
      categoryId: m.categoryId ?? "",
      categoryName: cat?.name ?? "—",
      categoryColorHex: cat?.colorHex ?? null,
      homeTeamId: m.homeTeamId ?? null,
      homeTeamName: m.homeTeamId ? (teamMap.get(m.homeTeamId) ?? m.homeTeamId.slice(0, 8)) : "—",
      awayTeamId: m.awayTeamId ?? null,
      awayTeamName: m.awayTeamId ? (teamMap.get(m.awayTeamId) ?? m.awayTeamId.slice(0, 8)) : "—",
      scheduledDate: m.date ?? null,
      startTime: m.startTime ?? null,
      endTime: m.endTime ?? null,
      courtName: m.courtName ?? null,
      phase: m.phase ?? "regular",
      roundIndex: m.roundIndex ?? 0,
      isPlaceholder: m.isPlaceholder ?? false,
    };
  });

  const addChanges      = changes.filter((c) => c.changeType === "add");
  const conflictChanges = changes.filter((c) => c.changeType === "conflict");
  const warningChanges  = changes.filter((c) => c.changeType === "warning");
  const hasConflicts    = conflictChanges.length > 0;
  const summary         = (dryRun.summary ?? {}) as Record<string, unknown>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-32">
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

      {/* Stat chips */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Añadidos",    count: addChanges.length,      color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" },
          { label: "Conflictos",  count: conflictChanges.length, color: "text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" },
          { label: "Advertencias",count: warningChanges.length,  color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${color}`}>
            <span className="stat-num text-xl font-bold">{count}</span>
            <span className="font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

        {/* Left: Calendar viewer (default) + cards toggle */}
        <DryRunChangesViewer rows={resolvedRows} dryRunId={dryRun.id} />

        {/* Right panel */}
        <div className="space-y-4 lg:sticky lg:top-6">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Resumen del dry run</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ["Categorías elegibles", String(summary.categoriesEligible ?? "—")],
                ["Categorías omitidas",  String(summary.categoriesSkipped  ?? "—")],
                ["Partidos programados", String(summary.matchesScheduled   ?? addChanges.length)],
                ["Sin slot disponible",  String(summary.matchesUnscheduled ?? "0")],
                ["Conflictos",           String(conflictChanges.length)],
                ["Advertencias",         String(warningChanges.length)],
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
                  initialAuditReport={initialAuditReport}
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

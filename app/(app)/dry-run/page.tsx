import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { dryRuns, tournaments, categories } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ChevronRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { DryRunGenerate } from "@/components/dry-run/dry-run-generate";

const STATUS: Record<string, "default" | "warning" | "success" | "error" | "secondary"> = {
  pending: "warning", ready: "warning", approved: "success", rejected: "error", expired: "secondary",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Generando", ready: "Pendiente revisión",
  approved: "Aprobado", rejected: "Rechazado", expired: "Expirado",
};

export default async function DryRunListPage() {
  const orgId = await requireOrg();

  const runs = await db
    .select({
      id: dryRuns.id,
      status: dryRuns.status,
      reason: dryRuns.reason,
      createdAt: dryRuns.createdAt,
      tournamentName: tournaments.name,
      summary: dryRuns.summary,
    })
    .from(dryRuns)
    .leftJoin(tournaments, eq(dryRuns.tournamentId, tournaments.id))
    .where(eq(dryRuns.organizationId, orgId))
    .orderBy(desc(dryRuns.createdAt))
    .limit(20);

  // Get active tournament for generate button
  const [activeTournament] = await db
    .select({ id: tournaments.id, name: tournaments.name })
    .from(tournaments)
    .where(and(eq(tournaments.organizationId, orgId), eq(tournaments.status, "active")))
    .limit(1);

  // Count eligible categories for the active tournament
  let eligibleCount = 0;
  if (activeTournament) {
    const [row] = await db
      .select({ count: count() })
      .from(categories)
      .where(
        and(
          eq(categories.organizationId, orgId),
          eq(categories.tournamentId, activeTournament.id),
          eq(categories.isActiveForFixture, true)
        )
      );
    eligibleCount = row?.count ?? 0;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Revisiones (Dry Runs)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Propuestas de cambio al fixture · aprueba o rechaza antes de confirmar
          </p>
        </div>
      </div>

      {/* Generate panel */}
      {activeTournament ? (
        <Card className="bg-brand-50/50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-brand-600" />
              Generar fixture
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {eligibleCount > 0
                ? `${eligibleCount} categor${eligibleCount === 1 ? "ía elegible" : "ías elegibles"} en ${activeTournament.name}`
                : `${activeTournament.name} · sin categorías elegibles aún`}
            </p>
          </CardHeader>
          <CardContent>
            {eligibleCount === 0 ? (
              <div className="flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-3">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <div>
                  Configura fecha de inicio y modo de juego en al menos una categoría para continuar.{" "}
                  <Link href="/context" className="underline font-medium hover:no-underline">
                    Ir a contexto →
                  </Link>
                </div>
              </div>
            ) : (
              <DryRunGenerate
                tournamentId={activeTournament.id}
                tournamentName={activeTournament.name}
                eligibleCount={eligibleCount}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            <p className="text-sm">Sin torneos activos. Activa un torneo para generar fixtures.</p>
            <Link href="/tournaments" className="text-sm text-brand-600 underline mt-1 inline-block">
              Ver torneos →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Dry run list */}
      {runs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Historial de revisiones
          </h2>
          <div className="space-y-3">
            {runs.map((dr) => {
              const sum = (dr.summary ?? {}) as Record<string, unknown>;
              return (
                <Link key={dr.id} href={`/dry-run/${dr.id}`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer hover:border-primary/30">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        dr.status === "approved" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                        : dr.status === "rejected" ? "bg-red-50 dark:bg-red-900/20 text-red-600"
                        : "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                      }`}>
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate text-sm">{dr.reason ?? "Revisión de cambios"}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">{dr.tournamentName}</span>
                          {sum.matchesScheduled != null && (
                            <span className="text-xs text-muted-foreground stat-num">{String(sum.matchesScheduled)} partidos</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(dr.createdAt).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                      <Badge variant={STATUS[dr.status] ?? "default"}>
                        {STATUS_LABELS[dr.status] ?? dr.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {runs.length === 0 && !activeTournament && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
            <p className="font-medium">Sin dry runs aún</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los dry runs aparecen al generar un fixture
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { contextVersions, categories, tournaments, users } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Layers, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

const SCOPE_LABELS: Record<string, string> = {
  organization: "Organización",
  tournament: "Torneo",
  category: "Categoría",
  date: "Fecha",
};

const SCOPE_BADGE: Record<string, "default" | "secondary" | "info" | "warning"> = {
  organization: "default",
  tournament: "info",
  category: "secondary",
  date: "warning",
};

export default async function ImpactSimulatorPage() {
  const orgId = await requireOrg();

  // Recent context versions
  const recentVersions = await db
    .select({
      id: contextVersions.id,
      scope: contextVersions.scope,
      scopeId: contextVersions.scopeId,
      rawPrompt: contextVersions.rawPrompt,
      parsedConstraints: contextVersions.parsedConstraints,
      versionNumber: contextVersions.versionNumber,
      createdAt: contextVersions.createdAt,
      userName: users.name,
    })
    .from(contextVersions)
    .leftJoin(users, eq(contextVersions.createdBy, users.id))
    .where(eq(contextVersions.organizationId, orgId))
    .orderBy(desc(contextVersions.createdAt))
    .limit(10);

  // Eligible categories
  const eligibleCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      colorHex: categories.colorHex,
      startDate: categories.startDate,
      isActiveForFixture: categories.isActiveForFixture,
      tournamentName: tournaments.name,
    })
    .from(categories)
    .leftJoin(tournaments, eq(categories.tournamentId, tournaments.id))
    .where(eq(categories.organizationId, orgId));

  const eligible = eligibleCategories.filter((c) => c.isActiveForFixture);
  const incomplete = eligibleCategories.filter((c) => !c.isActiveForFixture);

  // Simulate impact summary from most recent context
  const latestVersion = recentVersions[0] ?? null;
  const constraints = (latestVersion?.parsedConstraints ?? {}) as Record<string, unknown>;

  function describeConstraint(key: string, val: unknown): string {
    if (key === "courts" && Array.isArray(val)) return `Canchas: ${(val as string[]).join(", ")}`;
    if (key === "playDays" && Array.isArray(val)) {
      const map: Record<string, string> = { monday: "Lun", tuesday: "Mar", wednesday: "Mié", thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom" };
      return `Días: ${(val as string[]).map((d) => map[d] ?? d).join(", ")}`;
    }
    if (key === "timeWindow" && typeof val === "object" && val !== null) {
      const tw = val as { start?: string; end?: string };
      return `Horario: ${tw.start ?? "?"} – ${tw.end ?? "?"}`;
    }
    if (key === "defaultMatchDurationMinutes") return `Duración: ${val} min`;
    if (key === "clubGrouping" && typeof val === "object" && val !== null) {
      const cg = val as { enabled?: boolean };
      return `Agrupación de clubes: ${cg.enabled ? "activada" : "desactivada"}`;
    }
    if (key === "blackoutDates" && Array.isArray(val)) return `Fechas bloqueadas: ${(val as string[]).join(", ")}`;
    return `${key}: ${JSON.stringify(val)}`;
  }

  const activeConstraints = Object.entries(constraints)
    .filter(([k]) => k !== "scope" && k !== "warnings")
    .map(([k, v]) => describeConstraint(k, v));

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/context" className="hover:text-foreground">Contexto</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Simulador de impacto</span>
        </div>
        <h1 className="text-2xl font-bold">Simulador de impacto</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Previsualiza cómo un cambio de contexto afectaría el fixture antes de generar un dry run completo.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Contextos guardados", value: recentVersions.length, icon: <Target className="h-5 w-5" />, color: "text-brand-600 bg-brand-50 dark:bg-brand-900/20" },
          { label: "Categorías elegibles", value: eligible.length, icon: <CheckCircle className="h-5 w-5" />, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Config. pendiente", value: incomplete.length, icon: <AlertTriangle className="h-5 w-5" />, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
          { label: "Reglas activas", value: activeConstraints.length, icon: <Layers className="h-5 w-5" />, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
        ].map(({ label, value, icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-5">
              <div className={`inline-flex rounded-lg p-2 mb-3 ${color}`}>{icon}</div>
              <div className="stat-num text-2xl font-bold">{value}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active rules from latest context */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reglas activas</CardTitle>
            {latestVersion && (
              <div className="flex items-center gap-2">
                <Badge variant={SCOPE_BADGE[latestVersion.scope] ?? "default"} className="text-xs">
                  {SCOPE_LABELS[latestVersion.scope]}
                </Badge>
                <span className="text-xs text-muted-foreground">V{latestVersion.versionNumber}</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {activeConstraints.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin contextos guardados aún.</p>
            ) : (
              activeConstraints.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs py-2 border-b last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                  <span className="text-muted-foreground">{c}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Category eligibility status */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Estado de categorías</CardTitle>
            <p className="text-xs text-muted-foreground">Solo elegibles se incluyen en el fixture</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {eligibleCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin categorías aún.</p>
            ) : (
              eligibleCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/context/category/${cat.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.colorHex ?? "#6b7280" }} />
                  <span className="text-sm flex-1 truncate">{cat.name}</span>
                  {cat.isActiveForFixture
                    ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent context changes */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Cambios recientes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/context/history">Historial</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentVersions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cambios aún.</p>
            ) : (
              recentVersions.slice(0, 6).map((v) => (
                <div key={v.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={SCOPE_BADGE[v.scope] ?? "default"} className="text-xs shrink-0">
                        {SCOPE_LABELS[v.scope]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">V{v.versionNumber}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {v.rawPrompt.slice(0, 60)}…
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <Card className="bg-brand-50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800">
        <CardContent className="py-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <p className="font-bold text-brand-900 dark:text-brand-100">
              Listo para generar el fixture
            </p>
            <p className="text-sm text-brand-700 dark:text-brand-300 mt-1">
              {eligible.length > 0
                ? `${eligible.length} categor${eligible.length === 1 ? "ía elegible" : "ías elegibles"} · el dry run mostrará los cambios antes de confirmar.`
                : "Completa la configuración de al menos una categoría para continuar."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" asChild>
              <Link href="/context">
                <ArrowRight className="h-4 w-4" /> Ver panel de contexto
              </Link>
            </Button>
            <Button disabled={eligible.length === 0} asChild={eligible.length > 0}>
              {eligible.length > 0 ? (
                <Link href="/dry-run">Generar Dry Run</Link>
              ) : (
                <span>Generar Dry Run</span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { contextVersions, categories, tournaments } from "@/lib/db/schema";
import { eq, and, count, desc, max } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Trophy, Layers, Calendar, AlertCircle, ArrowRight, Sliders, History, GitCompare, Target } from "lucide-react";
import Link from "next/link";

export default async function ContextDashboardPage() {
  const orgId = await requireOrg();

  // Context version counts per scope
  const scopeCounts = await db
    .select({
      scope: contextVersions.scope,
      count: count(),
      latestAt: max(contextVersions.createdAt),
    })
    .from(contextVersions)
    .where(eq(contextVersions.organizationId, orgId))
    .groupBy(contextVersions.scope);

  const countMap = Object.fromEntries(
    scopeCounts.map((r) => [r.scope, { count: r.count, latestAt: r.latestAt }])
  );

  // Recent context changes
  const recentVersions = await db
    .select()
    .from(contextVersions)
    .where(eq(contextVersions.organizationId, orgId))
    .orderBy(desc(contextVersions.createdAt))
    .limit(8);

  // Incomplete categories
  const incompleteCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      startDate: categories.startDate,
      gameModeId: categories.gameModeId,
    })
    .from(categories)
    .where(
      and(
        eq(categories.organizationId, orgId),
        eq(categories.isActiveForFixture, false)
      )
    )
    .limit(5);

  const SCOPE_META = [
    { scope: "organization", label: "Organización", icon: Building2, href: "/context/organization", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { scope: "tournament", label: "Torneos", icon: Trophy, href: "/tournaments", color: "text-brand-600", bg: "bg-brand-50 dark:bg-brand-900/20" },
    { scope: "category", label: "Categorías", icon: Layers, href: "/tournaments", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { scope: "date", label: "Fechas", icon: Calendar, href: "/context/date", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  const SCOPE_LABELS: Record<string, string> = {
    organization: "Organización",
    tournament: "Torneo",
    category: "Categoría",
    date: "Fecha",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de Contexto</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona las reglas que controlan la generación de fixtures
        </p>
      </div>

      {/* Constraint hierarchy explainer */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Jerarquía de prioridad (mayor → menor)
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              "Partidos bloqueados",
              "Sobrescrituras manuales",
              "Contexto de Fecha",
              "Contexto de Categoría",
              "Contexto de Torneo",
              "Contexto de Organización",
              "Sistema por defecto",
            ].map((label, i, arr) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-xs px-2 py-1 rounded-md bg-background border font-medium">{label}</span>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scope cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SCOPE_META.map((meta) => {
          const Icon = meta.icon;
          const data = countMap[meta.scope];
          return (
            <Link key={meta.scope} href={meta.href}>
              <Card className="hover:shadow-md transition-all cursor-pointer hover:border-primary/30">
                <CardContent className="pt-5 pb-5">
                  <div className={`inline-flex rounded-lg p-2.5 mb-3 ${meta.bg} ${meta.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="stat-num text-2xl font-bold">{data?.count ?? 0}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    Versiones · {meta.label}
                  </div>
                  {data?.latestAt && (
                    <div className="text-xs text-muted-foreground/70 mt-1">
                      Últ. {new Date(data.latestAt).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Contexto de Organización", icon: Building2, href: "/context/organization" },
              { label: "Contexto de Torneo", icon: Trophy, href: "/tournaments" },
              { label: "Contexto de Fecha", icon: Calendar, href: "/context/date" },
              { label: "Historial de contextos", icon: History, href: "/context/history" },
              { label: "Comparar versiones", icon: GitCompare, href: "/context/compare" },
              { label: "Simulador de impacto", icon: Target, href: "/context/impact-simulator" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Incomplete categories */}
        {incompleteCategories.length > 0 && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                Configuración pendiente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                Estas categorías no son elegibles para fixture por falta de fecha o modo de juego.
              </p>
              {incompleteCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/context/category/${cat.id}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent transition-colors"
                >
                  <span className="text-sm font-medium">{cat.name}</span>
                  <div className="flex items-center gap-1">
                    {!cat.startDate && <Badge variant="error" className="text-xs">Sin fecha</Badge>}
                    {!cat.gameModeId && <Badge variant="error" className="text-xs">Sin modo</Badge>}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent changes */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Cambios recientes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/context/history">Ver historial</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentVersions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin cambios aún
              </p>
            ) : (
              recentVersions.map((v) => (
                <div key={v.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {SCOPE_LABELS[v.scope] ?? v.scope}
                      </Badge>
                      <span className="text-xs text-muted-foreground">V{v.versionNumber}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {v.rawPrompt.slice(0, 80)}…
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { requireOrg } from "@/lib/auth/session";
import { getDashboardStats, getRecentActivity } from "@/lib/db/queries/dashboard";
import { db } from "@/lib/db";
import { tournaments, dryRuns, categories } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Calendar, MessageSquare, Clock, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const orgId = await requireOrg();

  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(orgId),
    getRecentActivity(orgId, 8),
  ]);

  const recentTournaments = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.organizationId, orgId))
    .orderBy(desc(tournaments.updatedAt))
    .limit(5);

  const pendingDryRunsList = await db
    .select()
    .from(dryRuns)
    .where(and(eq(dryRuns.organizationId, orgId), eq(dryRuns.status, "ready")))
    .orderBy(desc(dryRuns.createdAt))
    .limit(5);

  const incompleteCategories = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.organizationId, orgId),
        eq(categories.isActiveForFixture, false)
      )
    )
    .limit(5);

  const ACTION_LABELS: Record<string, string> = {
    CREATE_TOURNAMENT: "Creó torneo",
    APPROVE_DRY_RUN: "Aprobó dry run",
    REJECT_DRY_RUN: "Rechazó dry run",
    CREATE_CONTEXT_VERSION: "Guardó contexto",
    UPDATE_CLUB_CONTACT: "Actualizó contacto",
    PUBLISH_FIXTURE_DATE: "Publicó fecha",
    CREATE_FIXTURE_VERSION: "Creó versión",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel principal</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumen de actividad — Liga Deportiva Quito
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Torneos activos"
          value={stats.activeTournaments}
          href="/tournaments"
          color="text-brand-600"
          bg="bg-brand-50 dark:bg-brand-900/20"
        />
        <StatCard
          icon={<Zap className="h-5 w-5" />}
          label="Dry runs pendientes"
          value={stats.pendingDryRuns}
          href="/dry-run"
          color="text-amber-600"
          bg="bg-amber-50 dark:bg-amber-900/20"
          urgent={stats.pendingDryRuns > 0}
        />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Fechas publicadas"
          value={stats.publishedDates}
          href="/fixture"
          color="text-blue-600"
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="Contactos sin WhatsApp"
          value={stats.missingContacts}
          href="/clubs"
          color="text-red-600"
          bg="bg-red-50 dark:bg-red-900/20"
          urgent={stats.missingContacts > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending dry runs */}
          {pendingDryRunsList.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Por revisar — Dry Runs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingDryRunsList.map((dr) => (
                  <Link
                    key={dr.id}
                    href={`/dry-run/${dr.id}`}
                    className="flex items-center justify-between rounded-md px-3 py-2.5 hover:bg-accent transition-colors border"
                  >
                    <div>
                      <p className="text-sm font-medium">{dr.reason ?? "Revisión de cambios"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(dr.createdAt).toLocaleDateString("es-EC", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Pendiente</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent tournaments */}
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">Torneos recientes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tournaments">Ver todos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentTournaments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay torneos. <Link href="/tournaments" className="text-primary hover:underline">Crear torneo</Link>
                </p>
              ) : (
                <div className="space-y-2">
                  {recentTournaments.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tournaments/${t.id}`}
                      className="flex items-center justify-between rounded-md px-3 py-2.5 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{t.sport ?? "Deporte"}</p>
                        </div>
                      </div>
                      <TournamentStatusBadge status={t.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incomplete categories warning */}
          {incompleteCategories.length > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Categorías sin elegibilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Estas categorías no tienen fecha de inicio o modo de juego configurado y no pueden incluirse en el fixture.
                </p>
                <div className="space-y-1">
                  {incompleteCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between text-sm py-1">
                      <div className="flex items-center gap-2">
                        {cat.colorHex && (
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: cat.colorHex }}
                          />
                        )}
                        <span>{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!cat.startDate && (
                          <Badge variant="error" className="text-xs">Sin fecha</Badge>
                        )}
                        {!cat.gameModeId && (
                          <Badge variant="error" className="text-xs">Sin modo</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                  <Link href="/context">Configurar contextos</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — Activity */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actividad reciente</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin actividad aún
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-tight">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.userName ?? "Sistema"} ·{" "}
                          {new Date(log.createdAt).toLocaleDateString("es-EC", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, href, color, bg, urgent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  color: string;
  bg: string;
  urgent?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${urgent ? "ring-2 ring-amber-400 dark:ring-amber-600" : ""}`}>
        <CardContent className="pt-5 pb-5">
          <div className={`inline-flex rounded-lg p-2.5 ${bg} ${color} mb-3`}>
            {icon}
          </div>
          <div className="stat-num text-3xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TournamentStatusBadge({ status }: { status: string }) {
  const map: Record<string, "draft" | "published" | "archived" | "success" | "warning"> = {
    draft: "draft",
    active: "success",
    completed: "archived",
    archived: "archived",
  };
  const labels: Record<string, string> = {
    draft: "Borrador", active: "Activo", completed: "Completado", archived: "Archivado",
  };
  return <Badge variant={map[status] ?? "draft"}>{labels[status] ?? status}</Badge>;
}

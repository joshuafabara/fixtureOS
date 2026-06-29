import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tournaments, categories, teams, fixtureVersions, contextVersions } from "@/lib/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Zap, GitCompare, Download, Plus, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function TournamentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const orgId = await requireOrg();

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(and(eq(tournaments.id, params.id), eq(tournaments.organizationId, orgId)))
    .limit(1);

  if (!tournament) notFound();

  const [categoryList, versionList] = await Promise.all([
    db
      .select({
        id: categories.id,
        name: categories.name,
        colorHex: categories.colorHex,
        startDate: categories.startDate,
        gameModeId: categories.gameModeId,
        isActiveForFixture: categories.isActiveForFixture,
        priority: categories.priority,
        teamCount: count(teams.id),
      })
      .from(categories)
      .leftJoin(teams, eq(teams.categoryId, categories.id))
      .where(
        and(
          eq(categories.tournamentId, tournament.id),
          eq(categories.organizationId, orgId)
        )
      )
      .groupBy(categories.id)
      .orderBy(categories.name),
    db
      .select()
      .from(fixtureVersions)
      .where(
        and(
          eq(fixtureVersions.tournamentId, tournament.id),
          eq(fixtureVersions.organizationId, orgId)
        )
      )
      .orderBy(desc(fixtureVersions.versionNumber))
      .limit(5),
  ]);

  const eligibleCount = categoryList.filter((c) => c.isActiveForFixture).length;
  const ineligibleCount = categoryList.length - eligibleCount;

  const STATUS_BADGE: Record<string, "draft" | "published" | "archived"> = {
    draft: "draft",
    published: "published",
    archived: "archived",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/tournaments" className="hover:text-foreground">Torneos</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{tournament.name}</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {tournament.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <TournamentStatusBadge status={tournament.status} />
            <span className="text-sm text-muted-foreground capitalize">
              {tournament.sport ?? "Deporte"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/fixture/${tournament.id}`}>
              <GitCompare className="h-4 w-4" /> Ver fixture
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dry-run">
              <Zap className="h-4 w-4" /> Generar dry run
            </Link>
          </Button>
        </div>
      </div>

      {/* Ineligible warning */}
      {ineligibleCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {ineligibleCount} categoría{ineligibleCount !== 1 ? "s" : ""} sin fecha de inicio
            o modo de juego. No se incluirán en el fixture.{" "}
            <Link href="/context" className="underline font-medium">
              Configurar contextos
            </Link>
          </span>
        </div>
      )}

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">
            Categorías ({categoryList.length})
          </TabsTrigger>
          <TabsTrigger value="fixture">Fixture</TabsTrigger>
          <TabsTrigger value="context">Contexto</TabsTrigger>
          <TabsTrigger value="versions">Versiones</TabsTrigger>
          <TabsTrigger value="exports">Exportes</TabsTrigger>
        </TabsList>

        {/* Categories tab */}
        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base">Categorías</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {eligibleCount} elegibles · {ineligibleCount} incompletas
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pb-3 font-medium text-muted-foreground">Categoría</th>
                    <th className="text-left py-2 pb-3 font-medium text-muted-foreground">Equipos</th>
                    <th className="text-left py-2 pb-3 font-medium text-muted-foreground">Fecha inicio</th>
                    <th className="text-left py-2 pb-3 font-medium text-muted-foreground">Modo de juego</th>
                    <th className="text-left py-2 pb-3 font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categoryList.map((cat) => (
                    <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {cat.colorHex && (
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: cat.colorHex }}
                            />
                          )}
                          <Link
                            href={`/context/category/${cat.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {cat.name}
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 pr-4 stat-num">{cat.teamCount}</td>
                      <td className="py-3 pr-4">
                        {cat.startDate ? (
                          <span className="text-foreground">
                            {new Date(cat.startDate + "T12:00:00").toLocaleDateString("es-EC", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" /> Falta
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {cat.gameModeId ? (
                          <span className="text-foreground">Configurado</span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" /> Falta
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {cat.isActiveForFixture ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <Check className="h-3 w-3" /> Elegible
                          </Badge>
                        ) : (
                          <Badge variant="error">No elegible</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fixture tab */}
        <TabsContent value="fixture" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                {versionList.length === 0
                  ? "No hay versiones de fixture aún."
                  : `${versionList.length} versión(es) disponibles.`}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button asChild>
                  <Link href={`/fixture/${tournament.id}`}>
                    Ver fixture
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/fixture/${tournament.id}`}>
                    <Zap className="h-4 w-4" /> Constructor
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Context tab */}
        <TabsContent value="context" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Contexto de Organización", href: "/context/organization", desc: "Reglas globales para todos los torneos" },
              { label: "Contexto de Torneo", href: `/context/tournament/${tournament.id}`, desc: "Reglas específicas de este torneo" },
              { label: "Contexto de Categorías", href: "/context", desc: "Configurar categorías individuales" },
              { label: "Contexto de Fechas", href: "/context/date", desc: "Restricciones por fecha específica" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="hover:shadow-md transition-all cursor-pointer hover:border-primary/30 h-full">
                  <CardContent className="py-4">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        {/* Versions tab */}
        <TabsContent value="versions" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Historial de versiones</CardTitle>
            </CardHeader>
            <CardContent>
              {versionList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin versiones de fixture aún
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Versión</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Estado</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Razón</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Fecha</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {versionList.map((v) => (
                      <tr key={v.id}>
                        <td className="py-2.5 stat-num font-bold">V{v.versionNumber}</td>
                        <td className="py-2.5">
                          <Badge variant={STATUS_BADGE[v.state] ?? "draft"}>
                            {v.state === "draft" ? "Borrador" : v.state === "published" ? "Publicado" : "Archivado"}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-muted-foreground">{v.reason ?? "—"}</td>
                        <td className="py-2.5 text-muted-foreground">
                          {new Date(v.createdAt).toLocaleDateString("es-EC")}
                        </td>
                        <td className="py-2.5">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/fixture/${tournament.id}`}>Ver</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exports tab */}
        <TabsContent value="exports" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center">
              <Download className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Centro de exportación</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Exporta el fixture en Excel, PDF o imagen
              </p>
              <Button asChild>
                <Link href="/exports">Ir a Exportes</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TournamentStatusBadge({ status }: { status: string }) {
  const map: Record<string, "draft" | "success" | "archived"> = {
    draft: "draft", active: "success", completed: "archived", archived: "archived",
  };
  const labels: Record<string, string> = {
    draft: "Borrador", active: "Activo", completed: "Completado", archived: "Archivado",
  };
  return <Badge variant={map[status] ?? "draft"}>{labels[status] ?? status}</Badge>;
}

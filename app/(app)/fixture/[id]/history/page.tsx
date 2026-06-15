import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fixtureVersions, tournaments, users, matches } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, ChevronLeft, GitCompare, Eye } from "lucide-react";
import { FixtureRestoreButton } from "@/components/fixture/fixture-publish-controls";

const STATE_BADGE: Record<string, "draft" | "published" | "archived"> = {
  draft: "draft", published: "published", archived: "archived",
};
const STATE_LABEL: Record<string, string> = {
  draft: "Borrador", published: "Publicado", archived: "Archivado",
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-EC", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default async function FixtureHistoryPage({ params }: { params: { id: string } }) {
  const orgId = await requireOrg();
  const tournamentId = params.id;

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(and(eq(tournaments.id, tournamentId), eq(tournaments.organizationId, orgId)))
    .limit(1);

  if (!tournament) notFound();

  const versions = await db
    .select({
      id: fixtureVersions.id,
      versionNumber: fixtureVersions.versionNumber,
      state: fixtureVersions.state,
      reason: fixtureVersions.reason,
      createdAt: fixtureVersions.createdAt,
      parentVersionId: fixtureVersions.parentVersionId,
      createdByName: users.name,
    })
    .from(fixtureVersions)
    .leftJoin(users, eq(fixtureVersions.createdBy, users.id))
    .where(
      and(
        eq(fixtureVersions.tournamentId, tournamentId),
        eq(fixtureVersions.organizationId, orgId)
      )
    )
    .orderBy(desc(fixtureVersions.versionNumber));

  // Match counts per version
  const matchCounts = await db
    .select({ fixtureVersionId: matches.fixtureVersionId, count: count() })
    .from(matches)
    .where(eq(matches.organizationId, orgId))
    .groupBy(matches.fixtureVersionId);
  const matchCountMap = new Map(matchCounts.map((r) => [r.fixtureVersionId, r.count]));

  const latestVersion = versions[0];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/fixture" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Fixtures
        </Link>
        <span>/</span>
        <Link href={`/fixture/${tournamentId}`} className="hover:text-foreground">
          {tournament.name}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Historial</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Historial de versiones</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {tournament.name} · {versions.length} versión{versions.length !== 1 ? "es" : ""}
          </p>
        </div>
        {versions.length >= 2 && (
          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/fixture/${tournamentId}/compare?a=${versions[1].versionNumber}&b=${versions[0].versionNumber}`}
            >
              <GitCompare className="h-4 w-4" /> Comparar últimas 2
            </Link>
          </Button>
        )}
      </div>

      {versions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Sin versiones aún.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {versions.map((v, idx) => {
            const isLatest = idx === 0;
            const matchCount = matchCountMap.get(v.id) ?? 0;
            return (
              <Card
                key={v.id}
                className={isLatest ? "border-brand-300 dark:border-brand-700 shadow-sm" : ""}
              >
                <CardContent className="flex items-center gap-4 py-4 flex-wrap">
                  {/* Version number */}
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 font-bold text-sm">
                    V{v.versionNumber}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {v.reason ?? `Versión ${v.versionNumber}`}
                      </span>
                      <Badge variant={STATE_BADGE[v.state] ?? "draft"}>
                        {STATE_LABEL[v.state] ?? v.state}
                      </Badge>
                      {isLatest && (
                        <Badge variant="info">Actual</Badge>
                      )}
                      {v.parentVersionId && (
                        <span className="text-xs text-muted-foreground">
                          Restaurado desde otra versión
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span>{v.createdByName ?? "—"}</span>
                      <span>·</span>
                      <span>{formatDate(v.createdAt)}</span>
                      <span>·</span>
                      <span className="stat-num">{matchCount} partidos</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/fixture/${tournamentId}?v=${v.versionNumber}`}>
                        <Eye className="h-4 w-4" /> Ver
                      </Link>
                    </Button>
                    {versions.length >= 2 && !isLatest && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/fixture/${tournamentId}/compare?a=${v.versionNumber}&b=${latestVersion.versionNumber}`}
                        >
                          <GitCompare className="h-4 w-4" /> Comparar
                        </Link>
                      </Button>
                    )}
                    {!isLatest && (
                      <FixtureRestoreButton
                        versionId={v.id}
                        versionNumber={v.versionNumber}
                        tournamentId={tournamentId}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-muted/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">¿Cómo funciona el historial?</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>• Cada aprobación de dry run crea una nueva versión inmutable.</p>
          <p>• Restaurar una versión antigua crea una nueva versión como copia — las versiones anteriores nunca se borran.</p>
          <p>• Solo las fechas de versiones publicadas son visibles al público.</p>
        </CardContent>
      </Card>
    </div>
  );
}

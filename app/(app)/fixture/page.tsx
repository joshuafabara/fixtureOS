import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fixtureVersions, tournaments } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function FixtureListPage() {
  const orgId = await requireOrg();

  const versions = await db
    .select({
      id: fixtureVersions.id,
      versionNumber: fixtureVersions.versionNumber,
      state: fixtureVersions.state,
      reason: fixtureVersions.reason,
      createdAt: fixtureVersions.createdAt,
      tournamentName: tournaments.name,
      tournamentId: tournaments.id,
    })
    .from(fixtureVersions)
    .leftJoin(tournaments, eq(fixtureVersions.tournamentId, tournaments.id))
    .where(eq(fixtureVersions.organizationId, orgId))
    .orderBy(desc(fixtureVersions.createdAt))
    .limit(20);

  const STATUS_BADGE: Record<string, "draft" | "published" | "archived"> = {
    draft: "draft", published: "published", archived: "archived",
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Fixtures</h1>
      {versions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Sin fixtures aún</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Genera el primer fixture desde un torneo
            </p>
            <Button asChild><Link href="/tournaments">Ver torneos</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {versions.map((v) => (
            <Link key={v.id} href={`/fixture/${v.tournamentId}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer">
                <CardContent className="flex items-center gap-4 py-4">
                  <div>
                    <p className="font-semibold">{v.tournamentName}</p>
                    <p className="text-xs text-muted-foreground">Versión V{v.versionNumber} · {v.reason ?? "Sin razón"}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <Badge variant={STATUS_BADGE[v.state] ?? "draft"}>
                      {v.state === "draft" ? "Borrador" : v.state === "published" ? "Publicado" : "Archivado"}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

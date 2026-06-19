import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tournaments, categories } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { DeleteTournamentButton } from "@/components/tournaments/delete-tournament-button";

export default async function TournamentsPage() {
  const orgId = await requireOrg();

  const tournamentList = await db
    .select({
      id: tournaments.id,
      name: tournaments.name,
      sport: tournaments.sport,
      status: tournaments.status,
      createdAt: tournaments.createdAt,
    })
    .from(tournaments)
    .where(eq(tournaments.organizationId, orgId))
    .orderBy(desc(tournaments.updatedAt));

  // Category counts per tournament
  const catCounts = await db
    .select({
      tournamentId: categories.tournamentId,
      total: count(),
    })
    .from(categories)
    .where(eq(categories.organizationId, orgId))
    .groupBy(categories.tournamentId);

  const catCountMap = Object.fromEntries(
    catCounts.map((r) => [r.tournamentId, r.total])
  );

  const STATUS_LABELS: Record<string, string> = {
    draft: "Borrador",
    active: "Activo",
    completed: "Completado",
    archived: "Archivado",
  };
  const STATUS_BADGE: Record<string, "draft" | "success" | "archived" | "secondary"> = {
    draft: "draft",
    active: "success",
    completed: "archived",
    archived: "archived",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Torneos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tournamentList.length} torneo{tournamentList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/tournaments/new">
            <Plus className="h-4 w-4" /> Nuevo torneo
          </Link>
        </Button>
      </div>

      {tournamentList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Sin torneos aún</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Crea tu primer torneo para comenzar
            </p>
            <Button asChild>
              <Link href="/tournaments/new">
                <Plus className="h-4 w-4" /> Crear torneo
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tournamentList.map((t) => (
            <div key={t.id} className="flex items-stretch rounded-xl border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
              <Link href={`/tournaments/${t.id}`} className="flex flex-1 items-center gap-4 px-4 py-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{t.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground capitalize">
                      {t.sport ?? "Deporte"}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {catCountMap[t.id] ?? 0} categoría
                      {(catCountMap[t.id] ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={STATUS_BADGE[t.status] ?? "draft"}>
                    {STATUS_LABELS[t.status] ?? t.status}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
              <div className="flex items-center pr-3 pl-1">
                <DeleteTournamentButton id={t.id} name={t.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

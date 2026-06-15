import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { standingsImports, standingsRows, teams, categories, tournaments } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ClipboardList } from "lucide-react";

export default async function StandingsReviewPage({ params }: { params: { id: string } }) {
  const orgId = await requireOrg();

  const [importRecord] = await db.select()
    .from(standingsImports)
    .where(and(eq(standingsImports.id, params.id), eq(standingsImports.organizationId, orgId)))
    .limit(1);

  if (!importRecord) notFound();

  const [category] = await db.select({ name: categories.name, colorHex: categories.colorHex })
    .from(categories).where(eq(categories.id, importRecord.categoryId)).limit(1);

  const [tournament] = await db.select({ name: tournaments.name })
    .from(tournaments).where(eq(tournaments.id, importRecord.tournamentId)).limit(1);

  const rowList = await db.select({
    id: standingsRows.id,
    position: standingsRows.position,
    teamId: standingsRows.teamId,
    teamName: teams.name,
  })
  .from(standingsRows)
  .leftJoin(teams, eq(standingsRows.teamId, teams.id))
  .where(and(eq(standingsRows.sourceImportId, params.id), eq(standingsRows.organizationId, orgId)))
  .orderBy(asc(standingsRows.position));

  const STATUS_LABEL: Record<string, string> = { pending: "Pendiente", confirmed: "Confirmado", applied: "Aplicado" };
  const STATUS_VARIANT: Record<string, "default" | "secondary" | "success"> = {
    pending: "secondary", confirmed: "success", applied: "default",
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/standings/import" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Importar posiciones
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Revisar</span>
      </div>

      <div className="flex items-center gap-3">
        <ClipboardList className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <h1 className="text-xl font-bold">Posiciones — {category?.name}</h1>
          <p className="text-sm text-muted-foreground">{tournament?.name}</p>
        </div>
        <Badge variant={STATUS_VARIANT[importRecord.status] ?? "secondary"}>
          {STATUS_LABEL[importRecord.status] ?? importRecord.status}
        </Badge>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {rowList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin posiciones registradas.</p>
          ) : (
            rowList.map((row) => (
              <div key={row.id} className="flex items-center gap-4 px-4 py-3">
                <span className="text-base font-bold text-muted-foreground w-8 text-right shrink-0">
                  {row.position}°
                </span>
                <span className="text-sm font-medium">{row.teamName ?? row.teamId}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/standings/import">← Nueva importación</Link>
        </Button>
      </div>
    </div>
  );
}

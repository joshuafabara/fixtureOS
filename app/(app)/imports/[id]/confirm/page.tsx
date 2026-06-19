import { notFound, redirect } from "next/navigation";
import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { importBatches, tournaments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { CheckCircle2, Building2, Layers, Users, SkipForward } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ConfirmImportButton } from "@/components/import/confirm-button";

export const metadata = { title: "Confirmar Importación — FixtureOS" };

export default async function ConfirmPage({ params }: { params: { id: string } }) {
  const orgId = await requireOrg();

  const [batch] = await db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.id, params.id), eq(importBatches.organizationId, orgId)))
    .limit(1);

  if (!batch) notFound();

  // Already confirmed — show success
  if (batch.status === "confirmed") {
    const summary = batch.summary as Record<string, number> | null;
    const tId = batch.tournamentId;

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex flex-col items-center text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-9 h-9 text-green-500" />
          </div>
          <h1 className="text-2xl font-extrabold">Importación confirmada</h1>
          <p className="text-muted-foreground mt-1.5">Los datos han sido importados exitosamente.</p>
        </div>

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {([
              ["Clubes creados",     summary.clubsCreated ?? 0,      Building2,   "#3b82f6"],
              ["Categorías creadas", summary.categoriesCreated ?? 0, Layers,      "#3b82f6"],
              ["Equipos nuevos",     summary.teamsCreated ?? 0,      Users,       "#16a34a"],
              ["Equipos omitidos",   summary.teamsSkipped ?? 0,      SkipForward, "#6b7280"],
            ] as const).map(([label, value, Icon, tone]) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${tone}1f`, color: tone }}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">{label}</span>
                  </div>
                  <div className="text-2xl font-bold tabular-nums mt-2 tracking-tight">{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild variant="outline">
            <Link href="/imports">Ver historial</Link>
          </Button>
          {tId && (
            <Button asChild>
              <Link href={`/tournaments/${tId}`}>Ir al torneo</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Not ready — redirect back to diff
  if (batch.status !== "ready") {
    redirect(`/imports/${batch.id}/diff`);
  }

  const tId = batch.tournamentId;
  let tournamentName = "";
  if (tId) {
    const [t] = await db.select({ name: tournaments.name }).from(tournaments).where(eq(tournaments.id, tId)).limit(1);
    tournamentName = t?.name ?? "";
  }

  const diffData = batch.diffData as Record<string, unknown> | null;
  // Prefer the stored summary (fast); fall back to counting diff rows
  const storedSummary = diffData?.summary as Record<string, number> | null;
  const diff = (diffData?.diff ?? []) as { type: string }[];
  const newTeams = storedSummary?.newteams ?? diff.filter((r) => r.type === "newteam").length;
  const newCats  = storedSummary?.newcats  ?? diff.filter((r) => r.type === "newcat").length;
  const newClubs = storedSummary?.newclubs ?? diff.filter((r) => r.type === "newclub").length;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-xl font-extrabold">Confirmar importación</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Se aplicarán los cambios al torneo <strong>{tournamentName || "seleccionado"}</strong>. Esta acción no borrará datos existentes.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col gap-3">
          {([
            ["Clubes nuevos",     newClubs, "#16a34a"],
            ["Categorías nuevas", newCats,  "#16a34a"],
            ["Equipos nuevos",    newTeams, "#16a34a"],
          ] as const).map(([label, value, tone]) => (
            <div key={label} className="flex items-center justify-between py-1 border-b border-zinc-100 last:border-0">
              <span className="text-[13px] font-semibold text-muted-foreground">{label}</span>
              <span className="font-extrabold tabular-nums text-[15px]" style={{ color: tone }}>{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-center flex-wrap">
        <Button asChild variant="outline">
          <Link href={`/imports/${batch.id}/diff`}>Revisar cambios</Link>
        </Button>
        <ConfirmImportButton batchId={batch.id} />
      </div>
    </div>
  );
}

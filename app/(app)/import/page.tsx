import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { Upload } from "lucide-react";
import { ImportWizard } from "@/components/import/import-wizard";

export const metadata = { title: "Importar datos — FixtureOS" };

export default async function ImportPage({ searchParams }: { searchParams: { mode?: string; source?: string; tournamentId?: string } }) {
  const orgId = await requireOrg();

  const tournamentList = await db
    .select({ id: tournaments.id, name: tournaments.name })
    .from(tournaments)
    .where(eq(tournaments.organizationId, orgId))
    .orderBy(asc(tournaments.name));

  const mode = (searchParams.mode === "create" ? "create" : "update") as "create" | "update";
  const source = (["excel", "csv", "image", "drupal"].includes(searchParams.source ?? "") ? searchParams.source : "excel") as "excel" | "csv" | "image" | "drupal";

  // If a tournamentId was passed (e.g. from /tournaments/new), look up its name so the wizard can pre-fill it
  const preCreatedTournament = searchParams.tournamentId
    ? tournamentList.find((t) => t.id === searchParams.tournamentId) ?? null
    : null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Torneos</p>
          <h1 className="text-xl font-extrabold">Importar Datos del Torneo</h1>
          <p className="text-sm text-muted-foreground">Carga clubes, categorías y equipos. Nada cambia el fixture hasta aprobar un dry run.</p>
        </div>
      </div>
      <ImportWizard
        tournaments={tournamentList}
        defaultMode={mode}
        defaultSource={source}
        defaultTournamentId={searchParams.tournamentId}
        defaultTournamentName={preCreatedTournament?.name}
      />
    </div>
  );
}

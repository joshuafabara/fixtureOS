import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { Upload } from "lucide-react";
import { ExcelImporter } from "@/components/import/excel-importer";

export default async function ImportPage() {
  const orgId = await requireOrg();

  const tournamentList = await db
    .select({ id: tournaments.id, name: tournaments.name })
    .from(tournaments)
    .where(eq(tournaments.organizationId, orgId))
    .orderBy(asc(tournaments.name));

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Importar equipos</h1>
          <p className="text-sm text-muted-foreground">Importa clubes, categorías y equipos desde Excel.</p>
        </div>
      </div>

      {tournamentList.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-5 py-4 text-sm text-amber-700 dark:text-amber-400">
          Crea al menos un torneo antes de importar equipos.
        </div>
      ) : (
        <ExcelImporter tournaments={tournamentList} />
      )}
    </div>
  );
}

import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tournaments, categories, teams } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { StandingsImportWizard } from "./standings-import-wizard";

export default async function StandingsImportPage() {
  const orgId = await requireOrg();

  const tournamentList = await db
    .select({ id: tournaments.id, name: tournaments.name })
    .from(tournaments)
    .where(eq(tournaments.organizationId, orgId))
    .orderBy(asc(tournaments.name));

  const categoryList = await db
    .select({
      id: categories.id,
      name: categories.name,
      colorHex: categories.colorHex,
      tournamentId: categories.tournamentId,
    })
    .from(categories)
    .where(eq(categories.organizationId, orgId))
    .orderBy(asc(categories.name));

  const teamList = await db
    .select({ id: teams.id, name: teams.name, categoryId: teams.categoryId })
    .from(teams)
    .where(eq(teams.organizationId, orgId))
    .orderBy(asc(teams.name));

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">Importar posiciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registra las posiciones finales de fase regular para generar el cuadro de playoffs.
        </p>
      </div>
      <StandingsImportWizard
        tournaments={tournamentList}
        categories={categoryList}
        teams={teamList}
      />
    </div>
  );
}

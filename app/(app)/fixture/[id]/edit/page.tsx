import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  fixtureVersions, matches, tournaments,
  categories, teams, courts,
} from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, History } from "lucide-react";
import { MatchEditor } from "@/components/fixture/match-editor";

const STATE_LABEL: Record<string, string> = {
  draft: "Borrador", published: "Publicado", archived: "Archivado",
};
const STATE_BADGE: Record<string, "draft" | "published" | "archived"> = {
  draft: "draft", published: "published", archived: "archived",
};

export default async function ManualEditPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { v?: string };
}) {
  const orgId = await requireOrg();
  const tournamentId = params.id;

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(and(eq(tournaments.id, tournamentId), eq(tournaments.organizationId, orgId)))
    .limit(1);

  if (!tournament) notFound();

  // Resolve version (latest by default)
  const allVersions = await db
    .select({
      id: fixtureVersions.id,
      versionNumber: fixtureVersions.versionNumber,
      state: fixtureVersions.state,
    })
    .from(fixtureVersions)
    .where(
      and(
        eq(fixtureVersions.tournamentId, tournamentId),
        eq(fixtureVersions.organizationId, orgId)
      )
    )
    .orderBy(desc(fixtureVersions.versionNumber));

  if (allVersions.length === 0) notFound();

  const requestedV = searchParams.v ? parseInt(searchParams.v) : null;
  const version = requestedV
    ? (allVersions.find((v) => v.versionNumber === requestedV) ?? allVersions[0])
    : allVersions[0];

  // Load matches with joined data
  const allTeams = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.organizationId, orgId));
  const teamMap = new Map(allTeams.map((t) => [t.id, t.name]));

  const rawMatches = await db
    .select({
      id: matches.id,
      scheduledDate: matches.scheduledDate,
      startTime: matches.startTime,
      endTime: matches.endTime,
      status: matches.status,
      phase: matches.phase,
      isLocked: matches.isLocked,
      categoryId: matches.categoryId,
      categoryName: categories.name,
      categoryColorHex: categories.colorHex,
      homeTeamId: matches.homeTeamId,
      homeTeamName: teams.name,
      awayTeamId: matches.awayTeamId,
      courtId: matches.courtId,
      courtName: courts.name,
    })
    .from(matches)
    .leftJoin(categories, eq(matches.categoryId, categories.id))
    .leftJoin(teams, eq(matches.homeTeamId, teams.id))
    .leftJoin(courts, eq(matches.courtId, courts.id))
    .where(eq(matches.fixtureVersionId, version.id))
    .orderBy(asc(matches.scheduledDate), asc(matches.startTime));

  const matchData = rawMatches.map((m) => ({
    id: m.id,
    scheduledDate: m.scheduledDate,
    startTime: m.startTime,
    endTime: m.endTime,
    courtId: m.courtId,
    courtName: m.courtName,
    categoryId: m.categoryId ?? "",
    categoryName: m.categoryName,
    categoryColorHex: m.categoryColorHex,
    homeTeamName: m.homeTeamName,
    awayTeamName: m.awayTeamId ? (teamMap.get(m.awayTeamId) ?? null) : null,
    status: m.status,
    isLocked: m.isLocked,
    phase: m.phase,
  }));

  // Load active courts
  const courtList = await db
    .select({ id: courts.id, name: courts.name })
    .from(courts)
    .where(and(eq(courts.organizationId, orgId), eq(courts.isActive, true)))
    .orderBy(asc(courts.name));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/fixture" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Fixtures
        </Link>
        <span>/</span>
        <Link href={`/fixture/${tournamentId}`} className="hover:text-foreground">
          {tournament.name}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Edición manual</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">Edición manual</h1>
            <Badge variant={STATE_BADGE[version.state] ?? "draft"}>
              V{version.versionNumber} · {STATE_LABEL[version.state] ?? version.state}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {tournament.name} · {matchData.length} partido{matchData.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Version switcher */}
          {allVersions.length > 1 && (
            <select
              defaultValue={version.versionNumber}
              onChange={(e) => {
                window.location.href = `/fixture/${tournamentId}/edit?v=${e.target.value}`;
              }}
              className="text-sm border border-border rounded-md px-2 py-1.5 bg-background"
            >
              {allVersions.map((v) => (
                <option key={v.id} value={v.versionNumber}>
                  V{v.versionNumber} · {STATE_LABEL[v.state] ?? v.state}
                </option>
              ))}
            </select>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/fixture/${tournamentId}/history`}>
              <History className="h-4 w-4" /> Historial
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/fixture/${tournamentId}?v=${version.versionNumber}`}>
              Ver fixture
            </Link>
          </Button>
        </div>
      </div>

      {/* Instruction callout */}
      <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Cómo funciona la edición manual</p>
        <p>• <strong>✏️ Editar</strong> — cambia fecha, hora o cancha de un partido.</p>
        <p>• <strong>⇄ Swap</strong> — selecciona dos partidos para intercambiar sus slots completos (fecha + hora + cancha).</p>
        <p>• <strong>⚡ Forfeit</strong> — marca un partido como forfeit o restáuralo a programado.</p>
        <p>Los cambios son locales hasta que presiones <strong>"Confirmar cambios"</strong>. Al confirmar se crea una nueva versión inmutable (V{version.versionNumber + 1}).</p>
      </div>

      <MatchEditor
        versionId={version.id}
        tournamentId={tournamentId}
        versionNumber={version.versionNumber}
        matches={matchData}
        courts={courtList}
      />
    </div>
  );
}

import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tournaments, contextVersions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { TournamentContextEditor } from "@/components/context/tournament-context-editor";

export default async function TournamentContextPage({
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

  // Latest tournament context
  const [latestTournContext] = await db
    .select()
    .from(contextVersions)
    .where(
      and(
        eq(contextVersions.organizationId, orgId),
        eq(contextVersions.scope, "tournament"),
        eq(contextVersions.scopeId, params.id)
      )
    )
    .orderBy(desc(contextVersions.versionNumber))
    .limit(1);

  // Org context for inherited rules
  const [orgContext] = await db
    .select()
    .from(contextVersions)
    .where(
      and(
        eq(contextVersions.organizationId, orgId),
        eq(contextVersions.scope, "organization")
      )
    )
    .orderBy(desc(contextVersions.versionNumber))
    .limit(1);

  type InheritedRule = {
    type: "duration" | "courts" | "days" | "time" | "grouping" | "restriction";
    label: string;
    text: string;
    from: "org";
  };

  const inheritedRules: InheritedRule[] = [];
  if (orgContext?.parsedConstraints) {
    const c = orgContext.parsedConstraints as Record<string, unknown>;
    if (c.defaultMatchDurationMinutes) {
      inheritedRules.push({ type: "duration", label: "Duración", text: `Duración por defecto: ${c.defaultMatchDurationMinutes} min`, from: "org" });
    }
    if (Array.isArray(c.courts) && c.courts.length > 0) {
      inheritedRules.push({ type: "courts", label: "Canchas", text: `Canchas: ${(c.courts as string[]).join(", ")}`, from: "org" });
    }
    if (Array.isArray(c.playDays) && c.playDays.length > 0) {
      const dayMap: Record<string, string> = {
        monday: "Lun", tuesday: "Mar", wednesday: "Mié",
        thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom",
      };
      inheritedRules.push({ type: "days", label: "Días de juego", text: `Días: ${(c.playDays as string[]).map((d) => dayMap[d] ?? d).join(", ")}`, from: "org" });
    }
    if (c.timeWindow && typeof c.timeWindow === "object") {
      const tw = c.timeWindow as { start?: string; end?: string };
      inheritedRules.push({ type: "time", label: "Horario", text: `Horario: ${tw.start ?? "08:00"} – ${tw.end ?? "21:00"}`, from: "org" });
    }
    if (c.clubGrouping && (c.clubGrouping as { enabled?: boolean }).enabled) {
      inheritedRules.push({ type: "grouping", label: "Agrupación", text: "Agrupación de clubes: activada (suave)", from: "org" });
    }
  }

  // Current tournament overrides from latest context
  type TournamentOverride = {
    type: "courts" | "restriction" | "time" | "priority";
    label: string;
    text: string;
  };
  const currentOverrides: TournamentOverride[] = [];
  if (latestTournContext?.parsedConstraints) {
    const c = latestTournContext.parsedConstraints as Record<string, unknown>;
    if (Array.isArray(c.courts)) currentOverrides.push({ type: "courts", label: "Canchas", text: `Canchas: ${(c.courts as string[]).join(", ")}` });
    if (c.timeWindow && typeof c.timeWindow === "object") {
      const tw = c.timeWindow as { start?: string; end?: string };
      currentOverrides.push({ type: "time", label: "Horario", text: `Horario: ${tw.start} – ${tw.end}` });
    }
    if (c.defaultMatchDurationMinutes) currentOverrides.push({ type: "restriction", label: "Duración", text: `${c.defaultMatchDurationMinutes} min por partido` });
    if (Array.isArray(c.blackoutDates) && (c.blackoutDates as string[]).length > 0) {
      currentOverrides.push({ type: "restriction", label: "Fechas bloqueadas", text: (c.blackoutDates as string[]).join(", ") });
    }
    if (c.priority) currentOverrides.push({ type: "priority", label: "Prioridad", text: `Prioridad: ${c.priority}` });
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/context" className="hover:text-foreground">Contexto</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Torneo</span>
          </div>
          <h1 className="text-2xl font-bold">Contexto de Torneo · {tournament.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sobrescribe las reglas de organización para este torneo.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/context/history">Historial</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dry-run">
              <Zap className="h-4 w-4" /> Generar Dry Run
            </Link>
          </Button>
        </div>
      </div>

      <TournamentContextEditor
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        inheritedRules={inheritedRules}
        currentOverrides={currentOverrides}
        initialPrompt={latestTournContext?.rawPrompt ?? ""}
        versionNumber={latestTournContext?.versionNumber ?? 0}
      />
    </div>
  );
}

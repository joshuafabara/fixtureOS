import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  categories, contextVersions, teams, tournaments, clubs,
} from "@/lib/db/schema";
import { eq, and, count, desc, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { CategoryContextEditor } from "@/components/context/category-context-editor";

export default async function CategoryContextPage({
  params,
}: {
  params: { id: string };
}) {
  const orgId = await requireOrg();

  // Load the category
  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, params.id), eq(categories.organizationId, orgId)))
    .limit(1);

  if (!category) notFound();

  // All categories in same tournament (for pill nav)
  const allCatsRaw = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.tournamentId, category.tournamentId),
        eq(categories.organizationId, orgId)
      )
    )
    .orderBy(categories.name);

  // Team counts per category
  const teamCounts = await db
    .select({ categoryId: teams.categoryId, count: count() })
    .from(teams)
    .where(eq(teams.organizationId, orgId))
    .groupBy(teams.categoryId);

  const countMap = Object.fromEntries(teamCounts.map((r) => [r.categoryId, r.count]));

  const allCategories = allCatsRaw.map((c) => ({
    ...c,
    teamCount: countMap[c.id] ?? 0,
  }));

  const currentCatFull = allCategories.find((c) => c.id === params.id) ?? {
    ...category,
    teamCount: countMap[category.id] ?? 0,
  };

  // Latest context version for this category
  const [latestVersion] = await db
    .select()
    .from(contextVersions)
    .where(
      and(
        eq(contextVersions.organizationId, orgId),
        eq(contextVersions.scope, "category"),
        eq(contextVersions.scopeId, params.id)
      )
    )
    .orderBy(desc(contextVersions.versionNumber))
    .limit(1);

  // Org's latest context for inherited rules
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

  // Teams in this category (with club name for display)
  const categoryTeams = await db
    .select({ id: teams.id, name: teams.name, clubName: clubs.name })
    .from(teams)
    .leftJoin(clubs, eq(teams.clubId, clubs.id))
    .where(and(eq(teams.categoryId, params.id), eq(teams.organizationId, orgId)))
    .orderBy(asc(teams.name));

  // Tournament name
  const [tournament] = await db
    .select({ name: tournaments.name })
    .from(tournaments)
    .where(eq(tournaments.id, category.tournamentId))
    .limit(1);

  // Build inherited rules from org context parsedConstraints
  type InheritedRule = {
    type: "duration" | "courts" | "days" | "time" | "grouping" | "restriction";
    label: string;
    text: string;
    from: "org" | "tournament";
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
      const days = (c.playDays as string[]).map((d) => dayMap[d] ?? d).join(", ");
      inheritedRules.push({ type: "days", label: "Días de juego", text: `Días: ${days}`, from: "org" });
    }
    if (c.timeWindow && typeof c.timeWindow === "object") {
      const tw = c.timeWindow as { start?: string; end?: string };
      inheritedRules.push({ type: "time", label: "Horario", text: `Horario: ${tw.start ?? "08:00"} – ${tw.end ?? "21:00"}`, from: "org" });
    }
    if (c.clubGrouping && (c.clubGrouping as { enabled?: boolean }).enabled) {
      inheritedRules.push({ type: "grouping", label: "Agrupación", text: "Agrupación de clubes: activada (suave)", from: "org" });
    }
  }

  const eligible = currentCatFull.isActiveForFixture;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/context" className="hover:text-foreground">Contexto</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Categoría</span>
          </div>
          <h1 className="text-2xl font-bold">Contexto de Categoría</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define elegibilidad, fecha de inicio, modo de juego y restricciones · {tournament?.name ?? "Torneo"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/context/history">Historial</Link>
          </Button>
          <Button
            size="sm"
            disabled={!eligible}
            asChild={eligible}
            className={eligible ? "" : "opacity-50 cursor-not-allowed"}
          >
            {eligible ? (
              <Link href="/dry-run">
                <Zap className="h-4 w-4" /> Generar Dry Run
              </Link>
            ) : (
              <span><Zap className="h-4 w-4" /> Generar Dry Run</span>
            )}
          </Button>
        </div>
      </div>

      <CategoryContextEditor
        category={currentCatFull}
        allCategories={allCategories}
        inheritedRules={inheritedRules}
        initialPrompt={latestVersion?.rawPrompt ?? ""}
        initialConstraints={(latestVersion?.parsedConstraints ?? null) as import("@/lib/context/mock-parser").ParsedConstraints | null}
        versionNumber={latestVersion?.versionNumber ?? 0}
        teams={categoryTeams.map((t) => ({ id: t.id, name: t.name, clubName: t.clubName ?? undefined }))}
      />
    </div>
  );
}

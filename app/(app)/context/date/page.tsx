import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { contextVersions, fixtureDates } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { DateContextEditor } from "@/components/context/date-context-editor";

export default async function DateContextPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const orgId = await requireOrg();

  // Load published fixture dates for this org
  const publishedDates = await db
    .select({
      date: fixtureDates.date,
      publicSlug: fixtureDates.publicSlug,
    })
    .from(fixtureDates)
    .where(eq(fixtureDates.organizationId, orgId))
    .orderBy(fixtureDates.date);

  // Load date-scope context versions
  const dateContexts = await db
    .select()
    .from(contextVersions)
    .where(
      and(
        eq(contextVersions.organizationId, orgId),
        eq(contextVersions.scope, "date")
      )
    )
    .orderBy(desc(contextVersions.versionNumber));

  // Group date contexts by effectiveDate for lookup
  type ExistingRule = {
    type: "restriction" | "time" | "courts" | "grouping";
    label: string;
    text: string;
  };

  const existingRulesByDate: Record<string, ExistingRule[]> = {};
  const versionsByDate: Record<string, number> = {};

  for (const ctx of dateContexts) {
    if (!ctx.effectiveDate) continue;
    if (versionsByDate[ctx.effectiveDate]) continue; // already got latest
    versionsByDate[ctx.effectiveDate] = ctx.versionNumber;

    const c = (ctx.parsedConstraints ?? {}) as Record<string, unknown>;
    const rules: ExistingRule[] = [];
    if (Array.isArray(c.teamRestrictions)) {
      (c.teamRestrictions as Array<{ teamPattern: string; restriction: string }>).forEach((r) => {
        rules.push({ type: "restriction", label: "Equipo", text: `${r.teamPattern}: ${r.restriction}` });
      });
    }
    if (Array.isArray(c.courtRestrictions)) {
      (c.courtRestrictions as Array<{ court: string; restriction: string }>).forEach((r) => {
        rules.push({ type: "courts", label: "Cancha", text: `${r.court}: ${r.restriction}` });
      });
    }
    if (Array.isArray(c.timeRestrictions)) {
      (c.timeRestrictions as Array<{ target: string; afterTime: string }>).forEach((r) => {
        rules.push({ type: "time", label: "Horario", text: `${r.target}: después de ${r.afterTime}` });
      });
    }
    existingRulesByDate[ctx.effectiveDate] = rules;
  }

  const fixtureDateList = publishedDates.map((d) => {
    const dt = new Date(d.date + "T12:00:00");
    const label = dt.toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" });
    return { date: d.date, label, matchCount: 0 };
  });

  const initialDate = searchParams.date ?? fixtureDateList[0]?.date ?? "";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/context" className="hover:text-foreground">Contexto</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Fecha</span>
          </div>
          <h1 className="text-2xl font-bold">Contexto de Fecha</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Restricciones específicas por fecha · sobrescriben categoría, torneo y organización.
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

      <DateContextEditor
        fixtureDates={fixtureDateList}
        existingRulesByDate={existingRulesByDate}
        initialDate={initialDate}
        versionsByDate={versionsByDate}
      />
    </div>
  );
}

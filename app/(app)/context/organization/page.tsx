import { requireOrg, getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { contextVersions } from "@/lib/db/schema";
import { eq, and, desc, max } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Check, History } from "lucide-react";
import Link from "next/link";
import { OrgContextEditor } from "./org-context-editor";
import type { ParsedConstraints } from "@/lib/context/mock-parser";

export default async function OrgContextPage() {
  const session = await getSession();
  const orgId = session.user.organizationId;

  // Latest org context version
  const [latestVersion] = await db
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

  const activeRules = latestVersion?.parsedConstraints
    ? Object.entries(latestVersion.parsedConstraints as ParsedConstraints).filter(
        ([k, v]) => k !== "scope" && k !== "warnings" && v !== undefined && v !== null
      )
    : [];

  const RULE_LABELS: Record<string, string> = {
    courts: "Canchas permitidas",
    playDays: "Días de juego",
    timeWindow: "Horario",
    defaultMatchDurationMinutes: "Duración predeterminada (min)",
    clubGrouping: "Agrupación por club",
  };

  function formatRuleValue(key: string, val: unknown): string {
    if (Array.isArray(val)) {
      if (key === "playDays") {
        const dayLabels: Record<string, string> = {
          monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
          thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
        };
        return (val as string[]).map((d) => dayLabels[d] ?? d).join(", ");
      }
      return (val as string[]).join(", ");
    }
    if (typeof val === "object" && val !== null) {
      if (key === "timeWindow") {
        const tw = val as { start: string; end: string };
        return `${tw.start} – ${tw.end}`;
      }
      if (key === "clubGrouping") {
        const cg = val as { enabled: boolean; type: string };
        return cg.enabled ? `Activado (${cg.type === "soft" ? "preferencial" : "estricto"})` : "Desactivado";
      }
      return JSON.stringify(val);
    }
    return String(val);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/context" className="hover:text-foreground">Contexto</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Organización</span>
          </div>
          <h1 className="text-2xl font-bold">Contexto de Organización</h1>
          {latestVersion && (
            <p className="text-sm text-muted-foreground mt-1">
              Versión actual: <span className="font-semibold">V{latestVersion.versionNumber}</span>
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/context/history">
            <History className="h-4 w-4" /> Historial
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Rules */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Reglas activas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin reglas configuradas aún</p>
            ) : (
              activeRules.map(([key, val]) => (
                <div key={key} className="flex items-start gap-2 py-1.5 border-b last:border-0">
                  <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{RULE_LABELS[key] ?? key}</p>
                    <p className="text-sm font-medium">{formatRuleValue(key, val)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        <div className="lg:col-span-2">
          <OrgContextEditor
            orgId={orgId}
            userId={session.user.id}
            currentVersionNumber={latestVersion?.versionNumber ?? 0}
            initialPrompt={latestVersion?.rawPrompt ?? ""}
          />
        </div>
      </div>
    </div>
  );
}

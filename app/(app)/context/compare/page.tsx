import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { contextVersions, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitCompare, ArrowRight, Plus, Minus, RefreshCw } from "lucide-react";

const SCOPE_LABELS: Record<string, string> = {
  organization: "Organización",
  tournament: "Torneo",
  category: "Categoría",
  date: "Fecha",
};

const SCOPE_BADGE: Record<string, "default" | "secondary" | "info" | "warning"> = {
  organization: "default",
  tournament: "info",
  category: "secondary",
  date: "warning",
};

type VersionRow = {
  id: string;
  scope: string;
  scopeId: string | null;
  effectiveDate: string | null;
  rawPrompt: string;
  parsedConstraints: Record<string, unknown> | null;
  versionNumber: number;
  createdAt: Date;
  userName: string | null;
};

function diffConstraints(
  a: Record<string, unknown>,
  b: Record<string, unknown>
) {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: Array<{ key: string; from: unknown; to: unknown }> = [];

  for (const key of allKeys) {
    if (key === "scope" || key === "warnings") continue;
    const hasA = key in a;
    const hasB = key in b;
    const valA = JSON.stringify(a[key]);
    const valB = JSON.stringify(b[key]);

    if (!hasA && hasB) {
      added.push(`${key}: ${JSON.stringify(b[key])}`);
    } else if (hasA && !hasB) {
      removed.push(`${key}: ${JSON.stringify(a[key])}`);
    } else if (valA !== valB) {
      changed.push({ key, from: a[key], to: b[key] });
    }
  }
  return { added, removed, changed };
}

export default async function ContextComparePage({
  searchParams,
}: {
  searchParams: { a?: string; b?: string };
}) {
  const orgId = await requireOrg();

  const allVersions = await db
    .select({
      id: contextVersions.id,
      scope: contextVersions.scope,
      scopeId: contextVersions.scopeId,
      effectiveDate: contextVersions.effectiveDate,
      rawPrompt: contextVersions.rawPrompt,
      parsedConstraints: contextVersions.parsedConstraints,
      versionNumber: contextVersions.versionNumber,
      createdAt: contextVersions.createdAt,
      userName: users.name,
    })
    .from(contextVersions)
    .leftJoin(users, eq(contextVersions.createdBy, users.id))
    .where(eq(contextVersions.organizationId, orgId))
    .orderBy(desc(contextVersions.createdAt))
    .limit(50);

  const versionA = searchParams.a
    ? allVersions.find((v) => v.id === searchParams.a) ?? null
    : null;
  const versionB = searchParams.b
    ? allVersions.find((v) => v.id === searchParams.b) ?? null
    : allVersions.find((v) => v.id !== searchParams.a) ?? null;

  const diff =
    versionA?.parsedConstraints && versionB?.parsedConstraints
      ? diffConstraints(
          versionA.parsedConstraints as Record<string, unknown>,
          versionB.parsedConstraints as Record<string, unknown>
        )
      : null;

  function formatVal(v: unknown): string {
    if (Array.isArray(v)) return (v as string[]).join(", ");
    if (typeof v === "object" && v !== null) return JSON.stringify(v);
    return String(v ?? "—");
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/context" className="hover:text-foreground">Contexto</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Comparar</span>
        </div>
        <h1 className="text-2xl font-bold">Comparar versiones de contexto</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona dos versiones para ver las diferencias entre sus reglas.
        </p>
      </div>

      {/* Version selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["a", "b"] as const).map((slot, si) => {
          const selected = slot === "a" ? versionA : versionB;
          return (
            <Card key={slot} className={selected ? "border-primary/30" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Versión {slot.toUpperCase()}
                  {selected && <Badge variant={SCOPE_BADGE[selected.scope] ?? "default"} className="ml-2">{SCOPE_LABELS[selected.scope]}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selected ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="stat-num font-bold text-lg">V{selected.versionNumber}</span>
                      <span className="text-xs text-muted-foreground">{selected.userName ?? "Sistema"}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(selected.createdAt).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{selected.rawPrompt}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-2">Selecciona desde el historial →</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Diff view */}
      {diff ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Diferencias detectadas</CardTitle>
              <div className="ml-auto flex items-center gap-2">
                {diff.added.length > 0 && <Badge variant="success">{diff.added.length} añadidas</Badge>}
                {diff.changed.length > 0 && <Badge variant="info">{diff.changed.length} cambiadas</Badge>}
                {diff.removed.length > 0 && <Badge variant="error">{diff.removed.length} eliminadas</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {diff.added.map((item, i) => (
              <div key={i} className="px-6 py-3 flex items-start gap-3 bg-emerald-50/50 dark:bg-emerald-900/10">
                <Plus className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <Badge variant="success" className="mb-1">Añadida</Badge>
                  <p className="text-sm text-emerald-800 dark:text-emerald-300">{item}</p>
                </div>
              </div>
            ))}
            {diff.changed.map((item, i) => (
              <div key={i} className="px-6 py-3 flex items-start gap-3">
                <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="info">Cambiada</Badge>
                    <span className="text-xs font-mono text-muted-foreground">{item.key}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2.5 py-1.5 rounded-lg bg-muted line-through text-muted-foreground">
                      {formatVal(item.from)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {formatVal(item.to)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {diff.removed.map((item, i) => (
              <div key={i} className="px-6 py-3 flex items-start gap-3 bg-red-50/50 dark:bg-red-900/10">
                <Minus className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <Badge variant="error" className="mb-1">Eliminada</Badge>
                  <p className="text-sm text-muted-foreground line-through">{item}</p>
                </div>
              </div>
            ))}
            {diff.added.length === 0 && diff.changed.length === 0 && diff.removed.length === 0 && (
              <div className="px-6 py-8 text-center text-muted-foreground">
                <GitCompare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Las versiones son idénticas en sus reglas parseadas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center text-muted-foreground gap-3">
            <GitCompare className="h-10 w-10 opacity-40" />
            <div>
              <p className="font-medium">Selecciona dos versiones para comparar</p>
              <p className="text-sm mt-1">Ve al historial y selecciona las versiones que quieres comparar.</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/context/history">Ver historial de contextos</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Version list for selecting */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Versiones recientes</CardTitle>
          <p className="text-xs text-muted-foreground">Clic para comparar · se asigna a A o B automáticamente</p>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4 font-medium text-xs text-muted-foreground">Versión</th>
                <th className="text-left py-2 px-4 font-medium text-xs text-muted-foreground">Alcance</th>
                <th className="text-left py-2 px-4 font-medium text-xs text-muted-foreground">Resumen</th>
                <th className="text-left py-2 px-4 font-medium text-xs text-muted-foreground">Fecha</th>
                <th className="py-2 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {allVersions.map((v) => {
                const isA = v.id === searchParams.a;
                const isB = v.id === searchParams.b;
                const nextA = isA ? searchParams.b : (searchParams.a ?? v.id);
                const nextB = isA ? v.id : (isB ? searchParams.a : v.id);
                return (
                  <tr key={v.id} className={`hover:bg-muted/30 ${isA || isB ? "bg-primary/5" : ""}`}>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        {isA && <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground">A</span>}
                        {isB && <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-muted text-foreground">B</span>}
                        <span className="stat-num font-bold">V{v.versionNumber}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={SCOPE_BADGE[v.scope] ?? "default"} className="text-xs">
                        {SCOPE_LABELS[v.scope] ?? v.scope}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 max-w-[280px]">
                      <p className="text-xs text-muted-foreground truncate">{v.rawPrompt.slice(0, 70)}{v.rawPrompt.length > 70 ? "…" : ""}</p>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(v.createdAt).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}
                    </td>
                    <td className="py-2.5 px-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/context/compare?a=${nextA}&b=${nextB}`}>
                          {isA ? "Quitar A" : isB ? "Quitar B" : "Comparar"}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

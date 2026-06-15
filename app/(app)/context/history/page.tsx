import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { contextVersions, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Eye, GitCompare } from "lucide-react";
import Link from "next/link";

export default async function ContextHistoryPage() {
  const orgId = await requireOrg();

  const versions = await db
    .select({
      id: contextVersions.id,
      scope: contextVersions.scope,
      scopeId: contextVersions.scopeId,
      effectiveDate: contextVersions.effectiveDate,
      rawPrompt: contextVersions.rawPrompt,
      versionNumber: contextVersions.versionNumber,
      createdAt: contextVersions.createdAt,
      userName: users.name,
    })
    .from(contextVersions)
    .leftJoin(users, eq(contextVersions.createdBy, users.id))
    .where(eq(contextVersions.organizationId, orgId))
    .orderBy(desc(contextVersions.createdAt))
    .limit(50);

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/context" className="hover:text-foreground">Contexto</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Historial</span>
        </div>
        <h1 className="text-2xl font-bold">Historial de Contextos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro inmutable de todos los cambios de reglas. Restaurar crea una nueva versión.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Sin historial aún</p>
              <p className="text-sm text-muted-foreground mt-1">
                Los cambios de contexto aparecerán aquí
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Versión</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Alcance</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Resumen</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Usuario</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fecha</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {versions.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 stat-num font-bold">V{v.versionNumber}</td>
                    <td className="py-3 px-4">
                      <Badge variant={SCOPE_BADGE[v.scope] ?? "default"}>
                        {SCOPE_LABELS[v.scope] ?? v.scope}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 max-w-[300px]">
                      <p className="text-sm text-muted-foreground truncate">
                        {v.rawPrompt.slice(0, 80)}{v.rawPrompt.length > 80 ? "…" : ""}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {v.userName ?? "Sistema"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(v.createdAt).toLocaleDateString("es-EC", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/context/compare?a=${v.id}`}>
                            <GitCompare className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

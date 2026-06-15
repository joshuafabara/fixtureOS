import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

const ACTION_LABELS: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }> = {
  CREATE_TOURNAMENT: { label: "Creó torneo", variant: "success" },
  APPROVE_DRY_RUN: { label: "Aprobó dry run", variant: "success" },
  REJECT_DRY_RUN: { label: "Rechazó dry run", variant: "error" },
  CREATE_CONTEXT_VERSION: { label: "Guardó contexto", variant: "default" },
  UPDATE_CLUB_CONTACT: { label: "Actualizó contacto", variant: "secondary" },
  PUBLISH_FIXTURE_DATE: { label: "Publicó fecha", variant: "success" },
  CREATE_FIXTURE_VERSION: { label: "Creó versión de fixture", variant: "default" },
  CREATE_DRY_RUN: { label: "Generó dry run", variant: "warning" },
};

export default async function AuditPage() {
  const orgId = await requireOrg();

  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      createdAt: auditLogs.createdAt,
      userName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(eq(auditLogs.organizationId, orgId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Auditoría</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro de acciones del sistema
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Sin registros aún</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Usuario</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Acción</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Entidad</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => {
                  const meta = ACTION_LABELS[log.action];
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString("es-EC", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4">{log.userName ?? "Sistema"}</td>
                      <td className="py-3 px-4">
                        <Badge variant={meta?.variant ?? "default"}>
                          {meta?.label ?? log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground capitalize">
                        {log.entityType.replace(/_/g, " ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

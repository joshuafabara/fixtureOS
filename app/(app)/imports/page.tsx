import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { importBatches, tournaments } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { History, Upload, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DeleteImportButton } from "@/components/import/delete-import-button";

export const metadata = { title: "Historial de Importaciones — FixtureOS" };

const STATUS_META: Record<string, { label: string; cls: string }> = {
  uploaded:  { label: "Subido",               cls: "bg-zinc-100 text-zinc-500 border-zinc-200" },
  parsing:   { label: "Procesando",           cls: "bg-blue-50 text-blue-600 border-blue-100" },
  mapping:   { label: "Requiere mapeo",       cls: "bg-blue-50 text-blue-600 border-blue-100" },
  review:    { label: "Requiere revisión",    cls: "bg-amber-50 text-amber-600 border-amber-200" },
  errors:    { label: "Resolver problemas",   cls: "bg-amber-50 text-amber-600 border-amber-200" },
  ready:     { label: "Listo",                cls: "bg-green-50 text-green-600 border-green-200" },
  confirmed: { label: "Confirmado",           cls: "bg-green-50 text-green-600 border-green-200" },
  rejected:  { label: "Rechazado",            cls: "bg-zinc-100 text-zinc-400 border-zinc-200" },
  failed:    { label: "Falló",                cls: "bg-red-50 text-red-500 border-red-200" },
};

const SOURCE_LABEL: Record<string, string> = { excel: "Excel", csv: "CSV", image: "Imagen", drupal: "Drupal" };

export default async function ImportsPage() {
  const orgId = await requireOrg();

  const rows = await db
    .select({
      id: importBatches.id,
      sourceType: importBatches.sourceType,
      mode: importBatches.mode,
      status: importBatches.status,
      summary: importBatches.summary,
      createdAt: importBatches.createdAt,
      tournamentName: tournaments.name,
      tournamentId: importBatches.tournamentId,
    })
    .from(importBatches)
    .leftJoin(tournaments, eq(importBatches.tournamentId, tournaments.id))
    .where(eq(importBatches.organizationId, orgId))
    .orderBy(desc(importBatches.createdAt))
    .limit(50);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center">
          <History className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold">Historial de Importaciones</h1>
          <p className="text-sm text-muted-foreground">Todas las importaciones de la organización.</p>
        </div>
        <Button asChild>
          <Link href="/import" className="gap-1.5">
            <Upload className="w-4 h-4" />Nueva importación
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-blue-500" />
            Importaciones
            <span className="font-normal text-muted-foreground ml-1">{rows.length} en total</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[780px]">
              <div className="grid grid-cols-[120px_1.4fr_90px_90px_160px_1.2fr_150px] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground border-b border-zinc-100">
                <div>Fecha</div><div>Torneo</div><div>Fuente</div><div>Modo</div><div>Estado</div><div>Resumen</div><div className="text-right">Acciones</div>
              </div>
              {rows.length === 0 && (
                <div className="px-4 py-12 text-center text-muted-foreground text-sm">
                  No hay importaciones todavía.
                </div>
              )}
              {rows.map((r, i) => {
                const s = STATUS_META[r.status] ?? STATUS_META.uploaded;
                const continuable = r.status === "review" || r.status === "errors" || r.status === "ready" || r.status === "mapping";
                const href = r.status === "errors" ? `/imports/${r.id}/errors`
                  : r.status === "mapping" ? `/imports/${r.id}/mapping`
                  : r.status === "ready" ? `/imports/${r.id}/confirm`
                  : `/imports/${r.id}/diff`;
                const summary = r.summary as Record<string, number> | null;
                const summaryText = summary
                  ? `${summary.clubsCreated ?? 0} clubes · ${summary.teamsCreated ?? 0} equipos`
                  : "—";

                return (
                  <div key={r.id} className={`grid grid-cols-[120px_1.4fr_90px_90px_160px_1.2fr_150px] items-center px-4 py-3.5 ${i < rows.length - 1 ? "border-b border-zinc-100" : ""}`}>
                    <div className="font-mono text-[12.5px] text-muted-foreground font-semibold">
                      {new Date(r.createdAt).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                    <div className="font-bold text-[13.5px] truncate pr-4">{r.tournamentName ?? "—"}</div>
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                        {SOURCE_LABEL[r.sourceType] ?? r.sourceType}
                      </span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-extrabold border ${r.mode === "update" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-green-50 text-green-600 border-green-200"}`}>
                        {r.mode === "update" ? "Actualizar" : "Crear"}
                      </span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-bold border ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>
                    <div className="text-[12.5px] text-muted-foreground">{summaryText}</div>
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant={continuable ? "default" : "outline"} size="sm" className="gap-1">
                        <Link href={href}>
                          {continuable ? "Continuar" : "Ver diff"}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                      <DeleteImportButton id={r.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

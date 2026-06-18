import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { importBatches } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { ErrorResolution } from "@/components/import/error-resolution";
import type { DiffRow } from "@/lib/imports/diff";

export const metadata = { title: "Resolver Problemas — FixtureOS" };

export default async function ErrorsPage({ params }: { params: { id: string } }) {
  const orgId = await requireOrg();

  const [batch] = await db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.id, params.id), eq(importBatches.organizationId, orgId)))
    .limit(1);

  if (!batch) notFound();

  const diffData = batch.diffData as Record<string, unknown> | null;
  const diff = (diffData?.diff ?? []) as DiffRow[];
  const errors = diff.filter((r) => r.needsError);

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Importación · resolución de problemas</p>
        <h1 className="text-xl font-extrabold">Resolver Problemas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Revisa cada fila ambigua o inválida y elige cómo resolverla. Nada se aplica hasta confirmar la importación.</p>
      </div>
      <ErrorResolution batchId={batch.id} errors={errors} />
    </div>
  );
}

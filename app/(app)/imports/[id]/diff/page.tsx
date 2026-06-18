import { notFound } from "next/navigation";
import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { importBatches } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { DiffReview } from "@/components/import/diff-review";
import type { DiffRow, DiffSummary } from "@/lib/imports/diff";

export const metadata = { title: "Revisión de cambios — FixtureOS" };

export default async function DiffPage({ params }: { params: { id: string } }) {
  const orgId = await requireOrg();

  const [batch] = await db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.id, params.id), eq(importBatches.organizationId, orgId)))
    .limit(1);

  if (!batch) notFound();

  const diffData = batch.diffData as Record<string, unknown> | null;
  const diff = (diffData?.diff ?? []) as DiffRow[];
  const summary = (diffData?.summary ?? { newclubs: 0, newcats: 0, newteams: 0, updates: 0, warnings: 0, impacts: 0 }) as DiffSummary;

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          Importación · {batch.sourceType.toUpperCase()} · {batch.mode === "update" ? "actualización" : "creación"}
        </p>
        <h1 className="text-xl font-extrabold">Revisión de Cambios</h1>
      </div>
      <DiffReview
        batchId={batch.id}
        sourceType={batch.sourceType}
        mode={batch.mode}
        diff={diff}
        summary={summary}
      />
    </div>
  );
}

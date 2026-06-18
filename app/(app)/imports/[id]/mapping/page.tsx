import { notFound, redirect } from "next/navigation";
import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { importBatches } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { MappingReview } from "@/components/import/mapping-review";
import type { ImportPreview } from "@/lib/imports/excel";
import type { ImageExtractedRow } from "@/lib/imports/image";

export const metadata = { title: "Mapeo — FixtureOS" };

export default async function MappingPage({ params }: { params: { id: string } }) {
  const orgId = await requireOrg();

  const [batch] = await db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.id, params.id), eq(importBatches.organizationId, orgId)))
    .limit(1);

  if (!batch) notFound();

  // If batch is still uploading/parsing, redirect back to import
  if (batch.status === "uploaded" || batch.status === "parsing") {
    redirect("/import");
  }

  const mappingData = batch.mappingData as Record<string, unknown> | null;
  const preview = (mappingData?.preview ?? { rows: [], clubs: [], categories: [], totalTeams: 0, warnings: [] }) as ImportPreview;
  const extractedRows = (mappingData?.extractedRows ?? undefined) as ImageExtractedRow[] | undefined;
  const warnings = (mappingData?.warnings ?? []) as string[];

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Importación · {batch.sourceType.toUpperCase()}</p>
        <h1 className="text-xl font-extrabold">
          {batch.sourceType === "image" ? "Revisar Extracción de Imagen" : "Revisar Mapeo"}
        </h1>
      </div>
      <MappingReview
        batchId={batch.id}
        sourceType={batch.sourceType}
        preview={preview}
        extractedRows={extractedRows}
        warnings={warnings}
      />
    </div>
  );
}

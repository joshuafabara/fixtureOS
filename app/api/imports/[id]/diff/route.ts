import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { importBatches } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const bodySchema = z.object({
  // per-row decision indexes: { [diffRowId]: number }
  decisions: z.record(z.number()),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [batch] = await db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.id, params.id), eq(importBatches.organizationId, session.user.organizationId)))
    .limit(1);

  if (!batch) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const existingDiff = (batch.diffData as Record<string, unknown>) ?? {};
  await db.update(importBatches).set({
    diffData: { ...existingDiff, decisions: parsed.data.decisions },
    status: "ready",
    updatedAt: new Date(),
  }).where(eq(importBatches.id, batch.id));

  return NextResponse.json({ ok: true });
}

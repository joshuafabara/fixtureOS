import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { importBatches } from "@/lib/db/schema";
import { z } from "zod";

const bodySchema = z.object({
  sourceType: z.enum(["excel", "csv", "image", "drupal"]),
  mode: z.enum(["create", "update"]),
  tournamentId: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const [batch] = await db.insert(importBatches).values({
    organizationId: session.user.organizationId,
    tournamentId: parsed.data.tournamentId ?? null,
    sourceType: parsed.data.sourceType,
    mode: parsed.data.mode,
    status: "uploaded",
    createdBy: session.user.id,
  }).returning();

  return NextResponse.json(batch, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1).optional(),
  sport: z.string().nullable().optional(),
  status: z.enum(["draft", "active", "completed", "archived"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
  if (parsed.data.sport !== undefined) updates.sport = parsed.data.sport?.trim() ?? null;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  const [updated] = await db
    .update(tournaments)
    .set(updates)
    .where(and(eq(tournaments.id, params.id), eq(tournaments.organizationId, session.user.organizationId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(updated);
}

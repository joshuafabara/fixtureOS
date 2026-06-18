import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1),
  sport: z.string().optional().nullable(),
  status: z.enum(["draft", "active", "completed", "archived"]).optional().default("draft"),
});

export async function POST(req: NextRequest) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });

  const { name, sport, status } = parsed.data;

  const [tournament] = await db.insert(tournaments).values({
    organizationId: session.user.organizationId,
    name: name.trim(),
    sport: sport?.trim() ?? null,
    status,
  }).returning();

  return NextResponse.json(tournament, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { standingsImports, tournaments, categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const rowSchema = z.object({
  position: z.number().int().min(1),
  teamId: z.string().uuid(),
});

const bodySchema = z.object({
  tournamentId: z.string().uuid(),
  categoryId: z.string().uuid(),
  rows: z.array(rowSchema).min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as typeof session.user & { organizationId: string; id: string };
  const orgId = user.organizationId;

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { tournamentId, categoryId, rows } = parsed.data;

  // Verify tournament + category belong to org
  const [cat] = await db.select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.organizationId, orgId), eq(categories.tournamentId, tournamentId)))
    .limit(1);

  if (!cat) return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });

  const [importRecord] = await db.insert(standingsImports).values({
    organizationId: orgId,
    tournamentId,
    categoryId,
    sourceType: "manual",
    parsedRows: rows,
    status: "pending",
    createdBy: user.id,
  }).returning();

  return NextResponse.json(importRecord, { status: 201 });
}

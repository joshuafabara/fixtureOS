import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { standingsImports, standingsRows, auditLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const rowSchema = z.object({ position: z.number().int().min(1), teamId: z.string().uuid() });
const bodySchema = z.object({ rows: z.array(rowSchema).min(1) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as typeof session.user & { organizationId: string; id: string };
  const orgId = user.organizationId;

  const [importRecord] = await db.select()
    .from(standingsImports)
    .where(and(eq(standingsImports.id, params.id), eq(standingsImports.organizationId, orgId)))
    .limit(1);

  if (!importRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (importRecord.status === "confirmed") return NextResponse.json({ error: "Ya confirmado." }, { status: 409 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Insert standings rows
  const rowsToInsert = parsed.data.rows.map((r) => ({
    organizationId: orgId,
    tournamentId: importRecord.tournamentId,
    categoryId: importRecord.categoryId,
    position: r.position,
    teamId: r.teamId,
    sourceImportId: importRecord.id,
  }));

  const inserted = await db.insert(standingsRows).values(rowsToInsert).returning();

  // Mark import confirmed
  await db.update(standingsImports)
    .set({ status: "confirmed" })
    .where(eq(standingsImports.id, importRecord.id));

  await db.insert(auditLogs).values({
    organizationId: orgId,
    userId: user.id,
    action: "STANDINGS_CONFIRMED",
    entityType: "standings_import",
    entityId: importRecord.id,
    afterJson: { rowsInserted: inserted.length },
  });

  return NextResponse.json({ rowsInserted: inserted.length });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { dryRuns, auditLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as typeof session.user & {
    organizationId: string;
    id: string;
  };

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const reason = parsed.success ? parsed.data.reason : undefined;

  const [dryRun] = await db
    .select()
    .from(dryRuns)
    .where(
      and(
        eq(dryRuns.id, params.id),
        eq(dryRuns.organizationId, user.organizationId)
      )
    )
    .limit(1);

  if (!dryRun) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!["ready", "pending"].includes(dryRun.status))
    return NextResponse.json({ error: `Cannot reject dry run with status: ${dryRun.status}` }, { status: 400 });

  await db
    .update(dryRuns)
    .set({ status: "rejected", reason: reason ?? dryRun.reason })
    .where(eq(dryRuns.id, dryRun.id));

  await db.insert(auditLogs).values({
    organizationId: user.organizationId,
    userId: user.id,
    action: "REJECT_DRY_RUN",
    entityType: "dry_run",
    entityId: dryRun.id,
    afterJson: { reason },
  });

  return NextResponse.json({ ok: true });
}

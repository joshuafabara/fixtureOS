import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { contextVersions, auditLogs } from "@/lib/db/schema";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(1).max(4000),
  parsedConstraints: z.record(z.unknown()),
  scope: z.enum(["organization", "tournament", "category", "date"]),
  scopeId: z.string().uuid().optional(),
  effectiveDate: z.string().optional(),
  versionNumber: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as typeof session.user & { organizationId: string; id: string };
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [version] = await db
    .insert(contextVersions)
    .values({
      organizationId: user.organizationId,
      scope: parsed.data.scope,
      scopeId: parsed.data.scopeId ?? null,
      effectiveDate: parsed.data.effectiveDate ?? null,
      rawPrompt: parsed.data.prompt,
      parsedConstraints: parsed.data.parsedConstraints,
      versionNumber: parsed.data.versionNumber,
      createdBy: user.id,
    })
    .returning();

  await db.insert(auditLogs).values({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CREATE_CONTEXT_VERSION",
    entityType: "context_version",
    entityId: version.id,
    afterJson: { scope: parsed.data.scope, versionNumber: parsed.data.versionNumber },
  });

  return NextResponse.json({ version });
}

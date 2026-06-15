import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { fixtureVersions, fixtureDates, auditLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  state: z.enum(["draft", "published", "archived"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as typeof session.user & { organizationId: string; id: string };

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });

  const { state } = parsed.data;

  const [version] = await db
    .select()
    .from(fixtureVersions)
    .where(
      and(
        eq(fixtureVersions.id, params.id),
        eq(fixtureVersions.organizationId, user.organizationId)
      )
    )
    .limit(1);

  if (!version)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db
    .update(fixtureVersions)
    .set({ state })
    .where(eq(fixtureVersions.id, version.id));

  // Cascade state to fixture dates
  await db
    .update(fixtureDates)
    .set({ state })
    .where(eq(fixtureDates.fixtureVersionId, version.id));

  await db.insert(auditLogs).values({
    organizationId: user.organizationId,
    userId: user.id,
    action: `FIXTURE_VERSION_${state.toUpperCase()}`,
    entityType: "fixture_version",
    entityId: version.id,
    beforeJson: { state: version.state },
    afterJson: { state },
  });

  return NextResponse.json({ id: version.id, state });
}

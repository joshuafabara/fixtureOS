import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { categories, contextVersions, gameModes, auditLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(1).max(4000),
  parsedConstraints: z.record(z.unknown()),
  versionNumber: z.number().int().positive(),
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

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [category] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.id, params.id),
        eq(categories.organizationId, user.organizationId)
      )
    )
    .limit(1);

  if (!category)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const constraints = parsed.data.parsedConstraints as Record<string, unknown>;

  // Save context version
  const [version] = await db
    .insert(contextVersions)
    .values({
      organizationId: user.organizationId,
      scope: "category",
      scopeId: category.id,
      rawPrompt: parsed.data.prompt,
      parsedConstraints: constraints,
      versionNumber: parsed.data.versionNumber,
      createdBy: user.id,
    })
    .returning();

  // Build category updates
  type CategoryUpdate = {
    updatedAt: Date;
    startDate?: string;
    gameModeId?: string;
    isActiveForFixture?: boolean;
  };
  const updates: CategoryUpdate = { updatedAt: new Date() };

  if (constraints.startDate && !category.startDate) {
    updates.startDate = constraints.startDate as string;
  }

  let newGameModeId = category.gameModeId;
  if (constraints.gameMode) {
    const gm = constraints.gameMode as Record<string, unknown>;
    const [gameMode] = await db
      .insert(gameModes)
      .values({
        organizationId: user.organizationId,
        tournamentId: category.tournamentId,
        categoryId: category.id,
        name: gm.type as string,
        source: "prompt",
        modeJson: gm,
      })
      .returning();
    updates.gameModeId = gameMode.id;
    newGameModeId = gameMode.id;
  }

  const effectiveStartDate = updates.startDate ?? category.startDate;
  updates.isActiveForFixture = !!(effectiveStartDate && newGameModeId);

  const [updatedCategory] = await db
    .update(categories)
    .set(updates)
    .where(eq(categories.id, category.id))
    .returning();

  await db.insert(auditLogs).values({
    organizationId: user.organizationId,
    userId: user.id,
    action: "CONFIRM_CATEGORY_CONTEXT",
    entityType: "category",
    entityId: category.id,
    beforeJson: {
      startDate: category.startDate,
      gameModeId: category.gameModeId,
      isActiveForFixture: category.isActiveForFixture,
    },
    afterJson: {
      startDate: updatedCategory.startDate,
      gameModeId: updatedCategory.gameModeId,
      isActiveForFixture: updatedCategory.isActiveForFixture,
    },
  });

  return NextResponse.json({ version, category: updatedCategory });
}

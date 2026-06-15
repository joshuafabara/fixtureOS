import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";
import { generateFixtureDryRun } from "@/lib/fixture-engine/generator";

const schema = z.object({
  tournamentId: z.string().uuid(),
  weeksAhead: z.number().int().min(1).max(52).optional(),
});

export async function POST(req: NextRequest) {
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

  try {
    const result = await generateFixtureDryRun(
      user.organizationId,
      user.id,
      parsed.data.tournamentId,
      { weeksAhead: parsed.data.weeksAhead }
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

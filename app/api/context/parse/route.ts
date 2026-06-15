import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { parseContextPrompt } from "@/lib/context/mock-parser";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(1).max(4000),
  scope: z.enum(["organization", "tournament", "category", "date"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = parseContextPrompt(parsed.data.prompt, parsed.data.scope);
  return NextResponse.json({ parsed: result });
}

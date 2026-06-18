import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { extractTeamsFromImage } from "@/lib/imports/image";

export async function POST(req: NextRequest) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const prompt = (formData.get("prompt") as string | null) ?? undefined;

  if (!file) return NextResponse.json({ error: "No se recibió imagen" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString("base64");
  const result = await extractTeamsFromImage(base64, file.type, prompt);

  return NextResponse.json(result);
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseCSVBuffer } from "@/lib/imports/csv";

export async function POST(req: NextRequest) {
  const session = await getSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const preview = await parseCSVBuffer(buf);
  return NextResponse.json(preview);
}

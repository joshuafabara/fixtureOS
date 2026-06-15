import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { parseExcelBuffer } from "@/lib/imports/excel";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No se recibió archivo." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const preview = await parseExcelBuffer(buffer);
    return NextResponse.json(preview);
  } catch (e) {
    return NextResponse.json(
      { error: `Error al procesar el archivo: ${e instanceof Error ? e.message : "Error desconocido"}` },
      { status: 422 }
    );
  }
}

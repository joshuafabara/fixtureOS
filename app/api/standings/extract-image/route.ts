import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { extractStandingsFromImage } from "@/lib/ai/standings-extractor";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "No se recibió imagen." }, { status: 400 });

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Formato no soportado. Usa PNG, JPG o WebP." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const result = await extractStandingsFromImage(base64, file.type);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: `Error al procesar imagen: ${e instanceof Error ? e.message : "Error desconocido"}` },
      { status: 422 }
    );
  }
}

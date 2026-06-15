import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clubContacts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const WHATSAPP_RE = /^[0-9]{10,15}$/;

const patchSchema = z.object({
  contactName: z.string().min(1).optional(),
  contactRole: z.string().nullable().optional(),
  whatsappNumber: z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || WHATSAPP_RE.test(v), { message: "Número inválido. Solo dígitos, 10-15 caracteres." }),
  isPrimary: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

async function verifyContact(contactId: string, clubId: string, orgId: string) {
  const [c] = await db.select({ id: clubContacts.id })
    .from(clubContacts)
    .where(and(eq(clubContacts.id, contactId), eq(clubContacts.clubId, clubId), eq(clubContacts.organizationId, orgId)))
    .limit(1);
  return c ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organizationId: string }).organizationId;

  if (!await verifyContact(params.contactId, params.id, orgId))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { isPrimary, ...rest } = parsed.data;

  if (isPrimary) {
    await db.update(clubContacts)
      .set({ isPrimary: false })
      .where(and(eq(clubContacts.clubId, params.id), eq(clubContacts.organizationId, orgId)));
  }

  const [updated] = await db.update(clubContacts)
    .set({ ...rest, ...(isPrimary !== undefined ? { isPrimary } : {}), updatedAt: new Date() })
    .where(eq(clubContacts.id, params.contactId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organizationId: string }).organizationId;

  if (!await verifyContact(params.contactId, params.id, orgId))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(clubContacts).where(eq(clubContacts.id, params.contactId));
  return new NextResponse(null, { status: 204 });
}

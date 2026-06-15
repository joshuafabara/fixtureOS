import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clubContacts, clubs } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

const WHATSAPP_RE = /^[0-9]{10,15}$/;

const createSchema = z.object({
  contactName: z.string().min(1),
  contactRole: z.string().nullable().optional(),
  whatsappNumber: z
    .string()
    .nullable()
    .optional()
    .refine((v) => !v || WHATSAPP_RE.test(v), { message: "Número inválido. Solo dígitos, 10-15 caracteres." }),
  isPrimary: z.boolean().optional().default(false),
  notes: z.string().nullable().optional(),
});

async function verifyClub(clubId: string, orgId: string) {
  const [club] = await db.select({ id: clubs.id })
    .from(clubs)
    .where(and(eq(clubs.id, clubId), eq(clubs.organizationId, orgId)))
    .limit(1);
  return club ?? null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organizationId: string }).organizationId;

  if (!await verifyClub(params.id, orgId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contacts = await db.select()
    .from(clubContacts)
    .where(and(eq(clubContacts.clubId, params.id), eq(clubContacts.organizationId, orgId)))
    .orderBy(asc(clubContacts.isPrimary), asc(clubContacts.contactName));

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organizationId: string }).organizationId;

  if (!await verifyClub(params.id, orgId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { isPrimary, ...rest } = parsed.data;

  // If new contact is primary, clear existing primary
  if (isPrimary) {
    await db.update(clubContacts)
      .set({ isPrimary: false })
      .where(and(eq(clubContacts.clubId, params.id), eq(clubContacts.organizationId, orgId)));
  }

  const [contact] = await db.insert(clubContacts).values({
    organizationId: orgId,
    clubId: params.id,
    ...rest,
    isPrimary,
    whatsappNumber: rest.whatsappNumber ?? null,
    contactRole: rest.contactRole ?? null,
    notes: rest.notes ?? null,
  }).returning();

  return NextResponse.json(contact, { status: 201 });
}

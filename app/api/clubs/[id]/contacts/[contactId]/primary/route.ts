import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { clubContacts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organizationId: string }).organizationId;

  const [contact] = await db.select({ id: clubContacts.id })
    .from(clubContacts)
    .where(and(eq(clubContacts.id, params.contactId), eq(clubContacts.clubId, params.id), eq(clubContacts.organizationId, orgId)))
    .limit(1);

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Clear current primary
  await db.update(clubContacts)
    .set({ isPrimary: false })
    .where(and(eq(clubContacts.clubId, params.id), eq(clubContacts.organizationId, orgId)));

  // Set new primary
  const [updated] = await db.update(clubContacts)
    .set({ isPrimary: true, updatedAt: new Date() })
    .where(eq(clubContacts.id, params.contactId))
    .returning();

  return NextResponse.json(updated);
}

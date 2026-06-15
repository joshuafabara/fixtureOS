import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { clubs, clubContacts, teams, categories } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { ClubsSearchBar } from "./clubs-search";
import { ClubsTable } from "./clubs-table";

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: { q?: string; whatsapp?: string; cat?: string };
}) {
  const orgId = await requireOrg();
  const q = searchParams.q;
  const whatsappFilter = searchParams.whatsapp;

  const clubList = await db
    .select({ id: clubs.id, name: clubs.name })
    .from(clubs)
    .where(eq(clubs.organizationId, orgId))
    .orderBy(clubs.name);

  const primaryContacts = await db
    .select({
      id: clubContacts.id,
      clubId: clubContacts.clubId,
      contactName: clubContacts.contactName,
      contactRole: clubContacts.contactRole,
      whatsappNumber: clubContacts.whatsappNumber,
    })
    .from(clubContacts)
    .where(and(eq(clubContacts.organizationId, orgId), eq(clubContacts.isPrimary, true)));

  const contactMap = Object.fromEntries(primaryContacts.map((c) => [c.clubId, c]));

  // Load categories per club via teams join
  const teamRows = await db
    .select({
      clubId: teams.clubId,
      categoryId: categories.id,
      categoryName: categories.name,
      categoryColorHex: categories.colorHex,
    })
    .from(teams)
    .leftJoin(categories, eq(teams.categoryId, categories.id))
    .where(eq(teams.organizationId, orgId));

  const clubCatsMap = new Map<string, { id: string; name: string; colorHex: string | null }[]>();
  for (const row of teamRows) {
    if (!row.clubId || !row.categoryId) continue;
    if (!clubCatsMap.has(row.clubId)) clubCatsMap.set(row.clubId, []);
    const existing = clubCatsMap.get(row.clubId)!;
    if (!existing.find((c) => c.id === row.categoryId)) {
      existing.push({ id: row.categoryId, name: row.categoryName!, colorHex: row.categoryColorHex ?? null });
    }
  }

  // Filter
  let filtered = clubList;
  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter((c) => c.name.toLowerCase().includes(lower));
  }
  if (whatsappFilter === "missing") {
    filtered = filtered.filter((c) => !contactMap[c.id]?.whatsappNumber);
  } else if (whatsappFilter === "present") {
    filtered = filtered.filter((c) => !!contactMap[c.id]?.whatsappNumber);
  }

  const rows = filtered.map((club) => ({
    id: club.id,
    name: club.name,
    categories: clubCatsMap.get(club.id) ?? [],
    contact: contactMap[club.id]
      ? {
          id: contactMap[club.id].id,
          contactName: contactMap[club.id].contactName,
          contactRole: contactMap[club.id].contactRole ?? null,
          whatsappNumber: contactMap[club.id].whatsappNumber ?? null,
        }
      : null,
  }));

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 48px", fontFamily: "var(--font-sans)" }}>
      <ClubsTable clubs={rows} totalCount={filtered.length} />
      <div style={{ marginTop: 16 }}>
        <ClubsSearchBar defaultQ={q} defaultWhatsapp={whatsappFilter} />
      </div>
    </div>
  );
}

import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { clubs, teams, categories, clubContacts } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Building2, Users } from "lucide-react";
import { ContactManager } from "@/components/clubs/contact-manager";

export default async function ClubDetailPage({ params }: { params: { id: string } }) {
  const orgId = await requireOrg();

  const [club] = await db
    .select()
    .from(clubs)
    .where(and(eq(clubs.id, params.id), eq(clubs.organizationId, orgId)))
    .limit(1);

  if (!club) notFound();

  const teamList = await db
    .select({
      id: teams.id,
      name: teams.name,
      status: teams.status,
      categoryId: teams.categoryId,
      categoryName: categories.name,
      categoryColor: categories.colorHex,
    })
    .from(teams)
    .leftJoin(categories, eq(teams.categoryId, categories.id))
    .where(and(eq(teams.clubId, club.id), eq(teams.organizationId, orgId)))
    .orderBy(asc(categories.name), asc(teams.name));

  const contactList = await db
    .select()
    .from(clubContacts)
    .where(and(eq(clubContacts.clubId, club.id), eq(clubContacts.organizationId, orgId)))
    .orderBy(asc(clubContacts.isPrimary), asc(clubContacts.contactName));

  // Group teams by category
  const byCategory = new Map<string, { catName: string; catColor: string | null; teams: typeof teamList }>();
  for (const t of teamList) {
    const key = t.categoryId;
    if (!byCategory.has(key)) byCategory.set(key, { catName: t.categoryName ?? "Sin categoría", catColor: t.categoryColor ?? null, teams: [] });
    byCategory.get(key)!.teams.push(t);
  }
  const categories_grouped = [...byCategory.values()];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/clubs" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Clubes
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{club.name}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{club.name}</h1>
          <p className="text-sm text-muted-foreground">{teamList.length} equipo{teamList.length !== 1 ? "s" : ""} en {categories_grouped.length} categoría{categories_grouped.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Teams by category */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" /> Equipos por categoría
          </h2>
          {categories_grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin equipos registrados.</p>
          ) : (
            categories_grouped.map((group) => (
              <Card key={group.catName}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: group.catColor ?? "#6b7280" }}
                    />
                    {group.catName}
                    <Badge variant="secondary" className="ml-auto text-xs">{group.teams.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-1">
                    {group.teams.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-sm">
                        <span>{t.name}</span>
                        {t.status !== "active" && (
                          <Badge variant="secondary" className="text-xs">{t.status}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Contacts */}
        <div className="lg:col-span-2">
          <ContactManager
            clubId={club.id}
            initialContacts={contactList.map((c) => ({
              id: c.id,
              contactName: c.contactName,
              contactRole: c.contactRole,
              whatsappNumber: c.whatsappNumber,
              isPrimary: c.isPrimary,
              notes: c.notes,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

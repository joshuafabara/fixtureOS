import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { clubs, clubContacts, teams, categories } from "@/lib/db/schema";
import { eq, and, isNull, isNotNull, like, sql } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { ClubsSearchBar } from "./clubs-search";

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: { q?: string; whatsapp?: string };
}) {
  const orgId = await requireOrg();
  const q = searchParams.q;
  const whatsappFilter = searchParams.whatsapp;

  const clubList = await db
    .select({
      id: clubs.id,
      name: clubs.name,
    })
    .from(clubs)
    .where(eq(clubs.organizationId, orgId))
    .orderBy(clubs.name);

  // Get primary contacts for each club
  const primaryContacts = await db
    .select({
      clubId: clubContacts.clubId,
      contactName: clubContacts.contactName,
      contactRole: clubContacts.contactRole,
      whatsappNumber: clubContacts.whatsappNumber,
    })
    .from(clubContacts)
    .where(
      and(
        eq(clubContacts.organizationId, orgId),
        eq(clubContacts.isPrimary, true)
      )
    );

  const primaryContactMap = Object.fromEntries(
    primaryContacts.map((c) => [c.clubId, c])
  );

  // Filter
  let filtered = clubList;
  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter((c) =>
      c.name.toLowerCase().includes(lower)
    );
  }
  if (whatsappFilter === "missing") {
    filtered = filtered.filter(
      (c) => !primaryContactMap[c.id]?.whatsappNumber
    );
  } else if (whatsappFilter === "present") {
    filtered = filtered.filter(
      (c) => !!primaryContactMap[c.id]?.whatsappNumber
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Directorio de Clubes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} club{filtered.length !== 1 ? "es" : ""}
          </p>
        </div>
      </div>

      <ClubsSearchBar defaultQ={q} defaultWhatsapp={whatsappFilter} />

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Sin clubes</p>
              <p className="text-sm text-muted-foreground mt-1">
                No se encontraron clubes con los filtros actuales
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Club</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contacto principal</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">WhatsApp</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((club) => {
                  const contact = primaryContactMap[club.id];
                  return (
                    <tr key={club.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{club.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {contact ? (
                          <div>
                            <p className="font-medium">{contact.contactName}</p>
                            {contact.contactRole && (
                              <p className="text-xs text-muted-foreground">{contact.contactRole}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {contact?.whatsappNumber ? (
                          <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                            +{contact.whatsappNumber}
                          </span>
                        ) : (
                          <Badge variant="warning" className="flex items-center gap-1 w-fit">
                            <AlertCircle className="h-3 w-3" /> Falta
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/clubs/${club.id}`}>
                            Ver <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

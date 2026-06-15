import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { clubs, clubContacts, teams } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Phone, Building2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function CommunicationsPage() {
  const orgId = await requireOrg();

  const clubList = await db
    .select({ id: clubs.id, name: clubs.name })
    .from(clubs)
    .where(eq(clubs.organizationId, orgId))
    .orderBy(asc(clubs.name));

  const contactList = await db
    .select()
    .from(clubContacts)
    .where(eq(clubContacts.organizationId, orgId))
    .orderBy(asc(clubContacts.clubId), asc(clubContacts.isPrimary));

  const teamRows = await db
    .select({ clubId: teams.clubId })
    .from(teams)
    .where(eq(teams.organizationId, orgId));

  const contactsByClub = new Map<string, typeof contactList>();
  for (const c of contactList) {
    if (!contactsByClub.has(c.clubId)) contactsByClub.set(c.clubId, []);
    contactsByClub.get(c.clubId)!.push(c);
  }

  const teamCountByClub = new Map<string, number>();
  for (const t of teamRows) {
    if (!t.clubId) continue;
    teamCountByClub.set(t.clubId, (teamCountByClub.get(t.clubId) ?? 0) + 1);
  }

  const total = clubList.length;
  const withWhatsApp = clubList.filter((cl) => {
    const contacts = contactsByClub.get(cl.id) ?? [];
    return contacts.some((c) => c.whatsappNumber && c.isPrimary);
  }).length;
  const withoutWhatsApp = total - withWhatsApp;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Directorio de WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Contactos principales por club para comunicaciones.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Clubes totales", value: total, color: "" },
          { label: "Con WhatsApp", value: withWhatsApp, color: "text-emerald-600" },
          { label: "Sin contacto", value: withoutWhatsApp, color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="py-3 text-center">
              <p className={`text-2xl font-bold stat-num ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {withoutWhatsApp > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {withoutWhatsApp} club{withoutWhatsApp !== 1 ? "s" : ""} sin contacto principal. Agrega contactos desde la página de cada club.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {clubList.map((club) => {
          const contacts = contactsByClub.get(club.id) ?? [];
          const primary = contacts.find((c) => c.isPrimary);
          const teamCount = teamCountByClub.get(club.id) ?? 0;

          return (
            <div key={club.id} className="flex items-center gap-4 rounded-lg border bg-muted/20 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/clubs/${club.id}`} className="text-sm font-semibold hover:underline">
                  {club.name}
                </Link>
                <p className="text-xs text-muted-foreground">{teamCount} equipo{teamCount !== 1 ? "s" : ""}</p>
              </div>
              {primary ? (
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">{primary.contactName}</p>
                  {primary.contactRole && <p className="text-xs text-muted-foreground">{primary.contactRole}</p>}
                  {primary.whatsappNumber ? (
                    <a
                      href={`https://wa.me/${primary.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline flex items-center gap-1 justify-end mt-0.5"
                    >
                      <Phone className="h-3 w-3" />+{primary.whatsappNumber}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin número</span>
                  )}
                </div>
              ) : (
                <Badge variant="secondary" className="text-xs text-amber-600 border-amber-300 shrink-0">
                  Sin contacto
                </Badge>
              )}
            </div>
          );
        })}
        {clubList.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Sin clubes registrados.</p>
        )}
      </div>
    </div>
  );
}

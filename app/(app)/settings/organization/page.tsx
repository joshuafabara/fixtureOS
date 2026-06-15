import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { OrgSettingsForm } from "./org-settings-form";

export default async function OrgSettingsPage() {
  const orgId = await requireOrg();

  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (!org) notFound();

  return (
    <div className="p-6 space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-bold">Configuración de organización</h1>
        <p className="text-sm text-muted-foreground mt-1">Nombre y preferencias generales.</p>
      </div>
      <OrgSettingsForm
        initialName={org.name}
        initialDuration={Number(org.defaultMatchDurationMinutes ?? 60)}
      />
    </div>
  );
}

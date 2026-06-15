import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { courts, courtAvailabilityRules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function CourtsPage() {
  const orgId = await requireOrg();

  const courtList = await db
    .select()
    .from(courts)
    .where(eq(courts.organizationId, orgId))
    .orderBy(courts.name);

  const availabilityList = await db
    .select()
    .from(courtAvailabilityRules)
    .where(
      and(...courtList.map((c) => eq(courtAvailabilityRules.courtId, c.id)))
    );

  const availMap: Record<string, typeof availabilityList> = {};
  for (const rule of availabilityList) {
    if (!availMap[rule.courtId]) availMap[rule.courtId] = [];
    availMap[rule.courtId].push(rule);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Canchas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {courtList.length} canca{courtList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" /> Nueva cancha
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courtList.map((court) => {
          const rules = availMap[court.id] ?? [];
          const dayRules = rules.filter((r) => r.dayOfWeek !== null && r.isAvailable);
          const days = Array.from(new Set(dayRules.map((r) => r.dayOfWeek!))).sort();

          return (
            <Card key={court.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{court.name}</CardTitle>
                  </div>
                  <Badge variant={court.isActive ? "success" : "secondary"}>
                    {court.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {rules.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin disponibilidad configurada</p>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Días disponibles</p>
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                          <span
                            key={d}
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              days.includes(d)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {DAY_LABELS[d]}
                          </span>
                        ))}
                      </div>
                    </div>
                    {dayRules[0] && (
                      <div>
                        <p className="text-xs text-muted-foreground">Horario</p>
                        <p className="text-sm font-medium">
                          {dayRules[0].startTime.slice(0, 5)} – {dayRules[0].endTime.slice(0, 5)}
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1">Editar</Button>
                  <Button variant="outline" size="sm" className="flex-1">Disponibilidad</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

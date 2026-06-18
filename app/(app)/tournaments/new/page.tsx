import { Trophy } from "lucide-react";
import { CreateTournamentForm } from "@/components/tournaments/create-tournament-form";

export const metadata = { title: "Crear Torneo — FixtureOS" };

export default function NewTournamentPage() {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Torneos</p>
          <h1 className="text-xl font-extrabold">Crear Torneo</h1>
        </div>
      </div>
      <CreateTournamentForm />
    </div>
  );
}

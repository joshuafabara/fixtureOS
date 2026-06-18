"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trophy, Upload, ExternalLink, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const SPORTS = ["Genérico", "Básquet", "Fútbol", "Vóley", "Futsal"];

const ACCENT_COLORS = [
  { id: "orange", hex: "#ea580c" },
  { id: "blue",   hex: "#2563eb" },
  { id: "violet", hex: "#7c3aed" },
  { id: "teal",   hex: "#0d9488" },
];

const START_OPTS = [
  { id: "empty",  Icon: Trophy,       title: "Crear torneo vacío",             desc: "Empieza sin datos y añade clubes, categorías y equipos manualmente." },
  { id: "import", Icon: Upload,       title: "Importar equipos / categorías",  desc: "Desde Excel, CSV o una imagen/captura. Revisas antes de confirmar." },
  { id: "drupal", Icon: ExternalLink, title: "Importar desde Drupal JSON:API", desc: "Conecta el sitio de la liga y sincroniza clubes y categorías." },
];

export function CreateTournamentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sport, setSport] = useState("Básquet");
  const [startMethod, setStartMethod] = useState<"empty" | "import" | "drupal">("import");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(then: "tournament" | "import") {
    if (!name.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), sport: sport !== "Genérico" ? sport : null, status: "draft" }),
      });
      if (!res.ok) throw new Error("Error al crear torneo");
      const tournament = await res.json() as { id: string };
      if (then === "import") {
        router.push(`/import?tournamentId=${tournament.id}&mode=create&source=${startMethod === "drupal" ? "drupal" : "excel"}`);
      } else {
        router.push(`/tournaments/${tournament.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      {/* Basic info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-4 h-4 text-blue-500" />
            Información básica
            <span className="text-xs font-normal text-muted-foreground ml-1">Estado inicial siempre es Borrador</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 flex items-baseline gap-2">
              Nombre del torneo
              <span className="text-xs font-bold text-blue-500">obligatorio</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Copa Apertura 2026"
              className={error && !name.trim() ? "border-red-400" : ""}
            />
          </div>
          <div>
            <Label className="mb-1.5 flex items-baseline gap-2">
              Deporte
              <span className="text-xs font-normal text-muted-foreground ml-auto">opcional</span>
            </Label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SPORTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5">Estado inicial</Label>
            <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted/30 text-sm text-muted-foreground font-semibold">
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-100 border border-zinc-200 text-zinc-500">Borrador</span>
              No visible públicamente hasta publicar
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start method */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">¿Cómo quieres empezar?</CardTitle>
          <p className="text-xs text-muted-foreground">Puedes cambiar de método más tarde</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {START_OPTS.map(({ id, Icon, title, desc }) => {
            const on = startMethod === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setStartMethod(id as typeof startMethod)}
                className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-all cursor-pointer font-sans ${on ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
              >
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${on ? "bg-white text-blue-500" : "bg-zinc-100 text-zinc-500"}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-extrabold text-[15px]">{title}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</span>
                </span>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${on ? "border-blue-500" : "border-zinc-300"}`}>
                  {on && <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" onClick={() => router.push("/tournaments")} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Cancelar
        </Button>
        <div className="flex-1" />
        <Button variant="outline" onClick={() => handleSave("tournament")} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Guardar Borrador
        </Button>
        <Button onClick={() => handleSave(startMethod === "empty" ? "tournament" : "import")} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {startMethod === "empty" ? "Crear torneo" : "Continuar a importar"}
          {!saving && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

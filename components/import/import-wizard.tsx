"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WizardSteps } from "./wizard-steps";
import {
  Upload, List, Eye, ExternalLink, GitCompare, RefreshCw,
  ChevronLeft, ChevronRight, Loader2, CheckCircle2, X, Trophy,
} from "lucide-react";

type SourceId = "excel" | "csv" | "image" | "drupal";
type ModeId = "create" | "update";

type Tournament = { id: string; name: string };
type Props = {
  tournaments: Tournament[];
  defaultMode?: ModeId;
  defaultSource?: SourceId;
  defaultTournamentId?: string;
  defaultTournamentName?: string;
};

const SOURCES: { id: SourceId; Icon: React.ElementType; label: string; hint: string; accept: string }[] = [
  { id: "excel",  Icon: Upload,       label: "Archivo Excel",    hint: "Sube una planilla .xlsx o .xls",                         accept: ".xlsx,.xls" },
  { id: "csv",    Icon: List,         label: "Archivo CSV",      hint: "Sube un .csv separado por comas",                       accept: ".csv" },
  { id: "image",  Icon: Eye,          label: "Imagen / captura", hint: "Extrae equipos desde una foto o screenshot con IA",     accept: ".png,.jpg,.jpeg,.webp" },
  { id: "drupal", Icon: ExternalLink, label: "Drupal JSON:API",  hint: "Conexión directa con el sitio de la liga",              accept: "" },
];

const IMG_PROMPT_CHIPS = [
  "Los equipos están en una tabla por columnas.",
  "Las categorías tienen colores de fondo.",
  "El listado está en español.",
  "Ignora los equipos tachados.",
];

export function ImportWizard({ tournaments, defaultMode = "update", defaultSource = "excel", defaultTournamentId, defaultTournamentName }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<ModeId>(defaultMode);
  const [source, setSource] = useState<SourceId>(defaultSource);
  const [targetId, setTargetId] = useState(defaultTournamentId ?? tournaments[0]?.id ?? "");
  const [newTournamentName, setNewTournamentName] = useState(defaultTournamentName ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [endpoint, setEndpoint] = useState("https://liga.example.org/jsonapi");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if ((source === "excel" || source === "csv" || source === "image") && !file) {
      setError("Selecciona un archivo para continuar."); return;
    }
    if (source === "drupal" && !endpoint.trim()) {
      setError("Ingresa el endpoint JSON:API."); return;
    }
    if (mode === "create" && !newTournamentName.trim()) {
      setError("Ingresa un nombre para el nuevo torneo."); return;
    }
    setLoading(true);
    setError("");

    try {
      // 0. For create mode, use pre-created tournament (from /tournaments/new) or create a new one
      let tournamentId: string | null = null;
      if (mode === "create") {
        if (defaultTournamentId) {
          // Tournament was already created by the /tournaments/new flow — use it directly
          tournamentId = defaultTournamentId;
        } else {
          const tRes = await fetch("/api/tournaments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newTournamentName.trim() }),
          });
          if (!tRes.ok) throw new Error("Error al crear el torneo");
          const t = await tRes.json() as { id: string };
          tournamentId = t.id;
        }
      }

      // 1. Create batch
      const batchRes = await fetch("/api/imports/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType: source, mode, tournamentId: mode === "update" ? targetId : tournamentId }),
      });
      if (!batchRes.ok) throw new Error("Error al crear importación");
      const batch = await batchRes.json() as { id: string };

      // 2. Trigger parse
      const fd = new FormData();
      if (file) fd.append("file", file);
      if (source === "drupal") { fd.append("endpoint", endpoint); }
      if (source === "image" && prompt) fd.append("prompt", prompt);

      const parseRes = await fetch(`/api/imports/${batch.id}/parse`, { method: "POST", body: fd });
      if (!parseRes.ok) {
        const err = await parseRes.json() as { error?: string };
        throw new Error(err.error ?? "Error al procesar archivo");
      }

      // Navigate to mapping step
      router.push(`/imports/${batch.id}/mapping`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setLoading(false);
    }
  }

  const activeSource = SOURCES.find((s) => s.id === source)!;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <WizardSteps current={0} />

      {/* Mode */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCompare className="w-4 h-4 text-blue-500" />
            Modo de importación
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            ["create", RefreshCw, "Crear nuevo torneo",             "Genera un dataset nuevo desde la fuente importada."],
            ["update", GitCompare, "Actualizar torneo existente",   "Compara contra los datos actuales y muestra un diff."],
          ] as const).map(([id, Icon, title, desc]) => {
            const on = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className={`flex gap-3 p-4 rounded-lg border text-left cursor-pointer font-sans transition-all ${on ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${on ? "bg-white text-blue-500" : "bg-zinc-100 text-zinc-500"}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-extrabold text-[14.5px]">{title}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</span>
                </span>
              </button>
            );
          })}
          {mode === "create" && (
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wide">Nombre del torneo</Label>
              {defaultTournamentId ? (
                // Tournament was pre-created in /tournaments/new — show name as read-only
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted/30 text-sm font-semibold text-foreground">
                  <Trophy className="w-4 h-4 text-primary shrink-0" />
                  {newTournamentName}
                </div>
              ) : (
                <Input
                  value={newTournamentName}
                  onChange={(e) => setNewTournamentName(e.target.value)}
                  placeholder="ej. Copa Alpha 2026"
                  className="font-semibold"
                />
              )}
            </div>
          )}
          {mode === "update" && (
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs font-bold text-muted-foreground uppercase tracking-wide">Torneo destino</Label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="w-4 h-4 text-blue-500" />
            Elegir fuente
            <span className="text-xs font-normal text-muted-foreground ml-1">Clubs, categorías, equipos y colores</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            {SOURCES.map(({ id, Icon, label, hint }) => {
              const on = source === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSource(id)}
                  className={`flex flex-col items-start gap-2.5 p-3.5 rounded-lg border text-left cursor-pointer font-sans transition-all ${on ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${on ? "bg-white text-blue-500" : "bg-zinc-100 text-zinc-500"}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="font-extrabold text-[13.5px] leading-tight">{label}</span>
                  <span className="text-[11.5px] text-muted-foreground leading-snug">{hint}</span>
                </button>
              );
            })}
          </div>

          {/* Per-source config */}
          {(source === "excel" || source === "csv") && (
            <>
              <input ref={fileRef} type="file" accept={activeSource.accept} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <div
                className="border-2 border-dashed border-zinc-200 rounded-lg p-8 text-center bg-zinc-50 cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0] ?? null); }}
              >
                <span className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </span>
                <p className="font-bold text-sm">Arrastra tu archivo {source === "excel" ? ".xlsx / .xls" : ".csv"} aquí</p>
                <p className="text-xs text-muted-foreground mt-1">o <span className="text-blue-500 font-bold">selecciona desde tu equipo</span></p>
                {file && (
                  <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    {file.name}
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-1 text-zinc-400 hover:text-zinc-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {source === "image" && (
            <div className="flex flex-col gap-4">
              <input ref={fileRef} type="file" accept={activeSource.accept} className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <div
                className="border-2 border-dashed border-zinc-200 rounded-lg p-8 text-center bg-zinc-50 cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0] ?? null); }}
              >
                <span className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                  <Eye className="w-6 h-6" />
                </span>
                <p className="font-bold text-sm">Sube una foto o captura del listado</p>
                <p className="text-xs text-muted-foreground mt-1">La IA extrae clubes, equipos, categorías y colores</p>
                {file && (
                  <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    {file.name}
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-1 text-zinc-400 hover:text-zinc-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <Label className="mb-1.5 flex items-baseline gap-2">
                  Instrucciones para la IA
                  <span className="text-xs font-normal text-muted-foreground ml-auto">opcional</span>
                </Label>
                <Textarea rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe cómo interpretar la imagen…" className="resize-none" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {IMG_PROMPT_CHIPS.map((p) => (
                    <button key={p} type="button" onClick={() => setPrompt((t) => (t ? t + " " : "") + p)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-zinc-200 bg-white text-zinc-500 text-[12px] font-semibold cursor-pointer hover:border-zinc-300 transition-colors">
                      + {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {source === "drupal" && (
            <div className="flex flex-col gap-4">
              <div>
                <Label className="mb-1.5 flex items-baseline gap-2">
                  Endpoint JSON:API
                  <span className="text-xs font-bold text-blue-500">obligatorio</span>
                </Label>
                <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="font-mono text-[13px]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5">Recurso de equipos</Label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>node--team</option>
                    <option>node--club</option>
                    <option>taxonomy_term--category</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 flex items-baseline gap-2">Token (Bearer) <span className="text-xs font-normal text-muted-foreground ml-auto">opcional</span></Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

      {/* Nav */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.push("/tournaments")} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Cancelar
        </Button>
        <div className="flex-1" />
        <Button onClick={handleContinue} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Continuar
          {!loading && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

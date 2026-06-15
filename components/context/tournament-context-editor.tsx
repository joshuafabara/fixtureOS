"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Save, X, AlertTriangle, Check, Plus, ArrowDown,
  Target, History, Clock, Pin, Flag, Users, Layers, Zap,
} from "lucide-react";

type ParsedConstraints = Record<string, unknown> & {
  courts?: string[];
  playDays?: string[];
  timeWindow?: { start: string; end: string };
  defaultMatchDurationMinutes?: number;
  blackoutDates?: string[];
  teamRestrictions?: Array<{ teamPattern: string; restriction: string }>;
  courtRestrictions?: Array<{ court: string; restriction: string }>;
  clubGrouping?: { enabled: boolean; type: string };
  priority?: number;
  warnings?: string[];
};

type InheritedRule = {
  type: "duration" | "courts" | "days" | "time" | "grouping" | "restriction";
  label: string;
  text: string;
  from: "org";
};

type TournamentOverride = {
  type: "courts" | "restriction" | "time" | "priority";
  label: string;
  text: string;
};

const EXAMPLE_PROMPTS = [
  "Los domingos usa solo Cancha A y Cancha B. La Cancha C está cerrada el domingo por mantenimiento.",
  "Sin partidos antes de las 09:00. Descanso mínimo 90 minutos entre partidos del mismo equipo.",
  "Prioriza las categorías menores en horarios tempranos.",
];

const DAY_LABELS: Record<string, string> = {
  monday: "Lun", tuesday: "Mar", wednesday: "Mié",
  thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom",
};

function InheritedRuleCard({ rule }: { rule: InheritedRule }) {
  const iconMap = {
    duration: <Clock className="h-3.5 w-3.5" />,
    courts: <Pin className="h-3.5 w-3.5" />,
    days: <Flag className="h-3.5 w-3.5" />,
    time: <Clock className="h-3.5 w-3.5" />,
    grouping: <Users className="h-3.5 w-3.5" />,
    restriction: <Layers className="h-3.5 w-3.5" />,
  };
  return (
    <div className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-muted/40 border-l-[3px] border-l-slate-400 border border-muted">
      <span className="p-1 rounded-md shrink-0 text-slate-500 bg-slate-50 dark:bg-slate-900/20">
        {iconMap[rule.type]}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{rule.label}</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium flex items-center gap-1">
            <ArrowDown className="h-2.5 w-2.5" /> Organización
          </span>
        </div>
        <p className="text-xs text-foreground/80">{rule.text}</p>
      </div>
    </div>
  );
}

function ParsedSection({
  title, icon, tone, items,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "ok" | "info" | "warn";
  items: string[];
}) {
  if (items.length === 0) return null;
  const colors = {
    ok: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    info: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    warn: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
  };
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${colors[tone]}`}>{icon}</div>
        <span className="text-xs font-bold">{title}</span>
        <span className="text-xs text-muted-foreground font-mono">{items.length}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className={`flex gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${colors[tone]}`}>
            {tone === "warn"
              ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              : <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
            {it}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TournamentContextEditor({
  tournamentId,
  tournamentName,
  inheritedRules,
  currentOverrides,
  initialPrompt,
  versionNumber,
}: {
  tournamentId: string;
  tournamentName: string;
  inheritedRules: InheritedRule[];
  currentOverrides: TournamentOverride[];
  initialPrompt: string;
  versionNumber: number;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [preview, setPreview] = useState<ParsedConstraints | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleParse() {
    if (!prompt.trim()) return;
    setParsing(true);
    setError("");
    try {
      const res = await fetch("/api/context/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, scope: "tournament" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreview(data.parsed);
    } catch {
      setError("Error al interpretar el contexto. Intenta de nuevo.");
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!preview || !prompt.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/context/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          parsedConstraints: preview,
          scope: "tournament",
          scopeId: tournamentId,
          versionNumber: versionNumber + 1,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => { router.refresh(); setSaved(false); }, 1500);
    } catch {
      setError("Error al guardar el contexto del torneo.");
    } finally {
      setSaving(false);
    }
  }

  // Build parsed sections for preview
  function buildParsedSections(p: ParsedConstraints) {
    const newRules: string[] = [];
    const changedRules: string[] = [];
    const warnings: string[] = p.warnings ?? [];

    if (p.courts?.length) newRules.push(`Canchas: ${p.courts.join(", ")}`);
    if (p.playDays?.length) {
      newRules.push(`Días de juego: ${p.playDays.map((d) => DAY_LABELS[d] ?? d).join(", ")}`);
    }
    if (p.timeWindow) newRules.push(`Horario: ${p.timeWindow.start} – ${p.timeWindow.end}`);
    if (p.defaultMatchDurationMinutes) {
      changedRules.push(`Duración: ${p.defaultMatchDurationMinutes} min`);
    }
    if (p.blackoutDates?.length) newRules.push(`Fechas bloqueadas: ${p.blackoutDates.join(", ")}`);
    if (p.clubGrouping?.enabled) newRules.push(`Agrupación de clubes: ${p.clubGrouping.type === "soft" ? "preferencial" : "estricta"}`);
    if (p.priority) changedRules.push(`Prioridad del torneo: ${p.priority}`);
    if (Array.isArray(p.courtRestrictions)) {
      p.courtRestrictions.forEach((r) => newRules.push(`${r.court}: ${r.restriction}`));
    }

    return { newRules, changedRules, warnings };
  }

  const parsedSections = preview ? buildParsedSections(preview) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-4 items-start">
        {/* Inherited + existing overrides */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
                Reglas heredadas
                <span className="text-xs text-muted-foreground font-normal">Organización</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inheritedRules.length === 0
                ? <p className="text-xs text-muted-foreground py-2">Sin reglas heredadas</p>
                : inheritedRules.map((r, i) => <InheritedRuleCard key={i} rule={r} />)
              }
            </CardContent>
          </Card>

          {currentOverrides.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Reglas del torneo</CardTitle>
                <p className="text-xs text-muted-foreground">Sobrescrituras de {tournamentName}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentOverrides.map((r, i) => (
                  <div key={i} className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-muted/40 border-l-[3px] border-l-brand-400 border border-muted">
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{r.label}</div>
                      <p className="text-xs text-foreground/80">{r.text}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Prompt editor */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 grid place-items-center shrink-0">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-bold text-sm">Editor de reglas del torneo</span>
            </div>

            <Textarea
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); setPreview(null); }}
              placeholder="Describe las reglas específicas de este torneo…"
              className="min-h-[160px] resize-none"
            />

            {!preview && prompt !== initialPrompt && (
              <p className="text-xs text-amber-600 font-bold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Cambios sin interpretar
              </p>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">Ejemplos</p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setPrompt((t) => t ? `${t} ${ex}` : ex); setPreview(null); }}
                    className="text-left text-xs px-2.5 py-1.5 rounded-full border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3 text-brand-500" /> {ex}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-2">
              <Button onClick={handleParse} disabled={!prompt.trim() || parsing} className="flex-1">
                <Zap className="h-4 w-4" />
                {parsing ? "Interpretando..." : "Interpretar"}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setPrompt(""); setPreview(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Parsed preview */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-sm">Vista previa interpretada</span>
              {preview
                ? <Badge variant="info">Interpretado</Badge>
                : <span className="text-xs text-muted-foreground font-bold">Pendiente</span>}
            </div>

            {parsedSections ? (
              <div>
                <ParsedSection title="Reglas nuevas" icon={<Plus className="h-3 w-3" />} tone="ok" items={parsedSections.newRules} />
                <ParsedSection title="Reglas cambiadas" icon={<Check className="h-3 w-3" />} tone="info" items={parsedSections.changedRules} />
                <ParsedSection title="Advertencias" icon={<AlertTriangle className="h-3 w-3" />} tone="warn" items={parsedSections.warnings} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <Zap className="h-6 w-6 opacity-40" />
                <p className="text-sm">Pulsa <strong className="text-foreground/60">Interpretar</strong>.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 pt-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => { setPrompt(initialPrompt); setPreview(null); }}>
          <X className="h-4 w-4" /> Descartar cambios
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" asChild>
          <a href="/context/impact-simulator">
            <Target className="h-4 w-4" /> Simular impacto
          </a>
        </Button>
        <Button onClick={handleSave} disabled={!preview || saving || saved}>
          {saved ? (
            <><Check className="h-4 w-4" /> Guardado</>
          ) : saving ? (
            "Guardando..."
          ) : (
            <><Save className="h-4 w-4" /> Guardar versión de contexto</>
          )}
        </Button>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Save, Trash2, AlertTriangle, Check, X, CheckCircle,
  Target, History, Zap, ArrowDown, Clock, Pin, Users, Layers, Flag,
} from "lucide-react";

type ParsedConstraints = Record<string, unknown> & {
  startDate?: string;
  gameMode?: {
    type?: string;
    groups?: number;
    groupRounds?: number;
    classification?: string;
    playoffs?: string[];
  };
  matchDurationMinutes?: number;
  defaultMatchDurationMinutes?: number;
  warnings?: string[];
};

type CategoryRow = {
  id: string;
  name: string;
  colorHex: string | null;
  startDate: string | null;
  gameModeId: string | null;
  isActiveForFixture: boolean;
  teamCount: number;
};

type InheritedRule = {
  type: "duration" | "courts" | "days" | "time" | "grouping" | "restriction";
  label: string;
  text: string;
  from: "org" | "tournament";
};

const EXAMPLE_PROMPTS = [
  "U16 empieza el 11 de julio. Doble round robin, partidos de 75 minutos.",
  "2 grupos, top 2 de cada grupo avanzan a semifinales y final.",
  "Solo round robin simple, todos contra todos una vez.",
];

const DAY_LABELS: Record<string, string> = {
  monday: "Lun", tuesday: "Mar", wednesday: "Mié",
  thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom",
};

const GAME_MODE_LABELS: Record<string, string> = {
  single_round_robin: "Round robin simple",
  double_round_robin: "Doble round robin",
  groups: "Fase de grupos + playoffs",
  playoffs: "Eliminación directa",
};

function EligibilityPanel({ category }: { category: CategoryRow }) {
  const eligible = category.isActiveForFixture;
  return (
    <div className="space-y-0 divide-y">
      <EligRow ok={!!category.startDate} label="Fecha de inicio" value={category.startDate ?? "Falta fecha"} />
      <EligRow ok={!!category.gameModeId} label="Modo de juego" value={category.gameModeId ? "Configurado" : "Falta modo"} />
      <EligRow ok label="Equipos inscritos" value={`${category.teamCount} equipos`} />
      <div className={`flex items-center gap-3 pt-3 mt-1 px-3 py-3 rounded-xl border ${eligible ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
        {eligible
          ? <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          : <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />}
        <div>
          <p className={`font-bold text-sm ${eligible ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
            {eligible ? "Categoría elegible" : "No elegible para fixture"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {eligible ? "Se incluirá en la generación del fixture." : "Completa fecha de inicio y modo de juego."}
          </p>
        </div>
      </div>
    </div>
  );
}

function EligRow({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      {ok
        ? <Check className="h-4 w-4 text-emerald-500 shrink-0" />
        : <X className="h-4 w-4 text-red-500 shrink-0" />}
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <span className={`text-sm font-semibold ${ok ? "text-foreground" : "text-red-600"}`}>{value}</span>
    </div>
  );
}

function InheritedRuleCard({ rule }: { rule: InheritedRule }) {
  const iconMap = {
    duration: <Clock className="h-3.5 w-3.5" />,
    courts: <Pin className="h-3.5 w-3.5" />,
    days: <Flag className="h-3.5 w-3.5" />,
    time: <Clock className="h-3.5 w-3.5" />,
    grouping: <Users className="h-3.5 w-3.5" />,
    restriction: <Layers className="h-3.5 w-3.5" />,
  };
  const colorMap = {
    duration: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    courts: "text-brand-600 bg-brand-50 dark:bg-brand-900/20",
    days: "text-brand-600 bg-brand-50 dark:bg-brand-900/20",
    time: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    grouping: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
    restriction: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
  };
  return (
    <div className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-muted/40 border border-l-[3px] border-muted-foreground/10 border-l-blue-400">
      <span className={`p-1 rounded-md shrink-0 ${colorMap[rule.type]}`}>
        {iconMap[rule.type]}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{rule.label}</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium flex items-center gap-1">
            <ArrowDown className="h-2.5 w-2.5" />
            {rule.from === "org" ? "Organización" : "Torneo"}
          </span>
        </div>
        <p className="text-xs text-foreground/80">{rule.text}</p>
      </div>
    </div>
  );
}

function GameModePreview({ constraints }: { constraints: ParsedConstraints }) {
  const gm = constraints.gameMode;
  if (!gm) return null;
  const duration = constraints.matchDurationMinutes ?? constraints.defaultMatchDurationMinutes;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          ["Tipo", GAME_MODE_LABELS[gm.type ?? ""] ?? gm.type ?? "—"],
          ["Grupos", gm.type === "groups" ? String(gm.groups ?? 2) : "—"],
          ["Clasifican", gm.classification === "top_2_per_group" ? "Top 2 por grupo" : (gm.classification ?? "—")],
          ["Playoffs", gm.playoffs?.join(" · ") ?? "—"],
          ["Duración", duration ? `${duration} min` : "Heredada"],
          ["Prioridad", "Heredada"],
        ].map(([l, v]) => (
          <div key={l} className="p-2.5 rounded-lg bg-muted/60 border">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">{l}</div>
            <div className="text-sm font-bold truncate">{v}</div>
          </div>
        ))}
      </div>

      {gm.type === "groups" && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-brand-500" /> Vista previa del cuadro
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {["A", "B"].slice(0, gm.groups ?? 2).map((g) => (
              <div key={g} className="bg-muted/60 border rounded-xl p-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Grupo {g}</div>
                <div className="space-y-1.5">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex items-center gap-2 bg-background border rounded-lg px-2.5 py-1.5">
                      <span className="text-xs font-bold text-brand-600 w-4">{g}{n}</span>
                      <span className="text-xs text-muted-foreground">Equipo {g}{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="bg-muted/60 border rounded-xl p-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Semifinales</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 bg-background border rounded-lg px-2.5 py-1.5">
                  <span className="text-xs font-bold text-brand-600 w-6">SF1</span>
                  <span className="text-xs text-muted-foreground">A1 vs B2</span>
                </div>
                <div className="flex items-center gap-2 bg-background border rounded-lg px-2.5 py-1.5">
                  <span className="text-xs font-bold text-brand-600 w-6">SF2</span>
                  <span className="text-xs text-muted-foreground">B1 vs A2</span>
                </div>
              </div>
            </div>
            <div className="text-muted-foreground text-xs">→</div>
            <div className="bg-gradient-to-br from-brand-50 to-background dark:from-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-3">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">Final</div>
              <div className="flex items-center gap-2 bg-background border rounded-lg px-2.5 py-1.5">
                <span className="text-xs font-bold text-brand-600 w-4">F</span>
                <span className="text-xs text-muted-foreground">SF1 vs SF2</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CategoryContextEditor({
  category,
  allCategories,
  inheritedRules,
  initialPrompt,
  versionNumber,
}: {
  category: CategoryRow;
  allCategories: CategoryRow[];
  inheritedRules: InheritedRule[];
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
        body: JSON.stringify({ prompt, scope: "category" }),
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

  async function handleConfirm() {
    if (!preview || !prompt.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/categories/${category.id}/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          parsedConstraints: preview,
          versionNumber: versionNumber + 1,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => {
        router.refresh();
        setSaved(false);
      }, 1500);
    } catch {
      setError("Error al guardar el contexto de categoría.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {allCategories.map((cat) => {
          const isCurrent = cat.id === category.id;
          return (
            <a
              key={cat.id}
              href={`/context/category/${cat.id}`}
              className={`flex-none flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all ${
                isCurrent
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: cat.colorHex ?? "#6b7280" }}
              />
              {cat.name}
              {!cat.isActiveForFixture && (
                <AlertTriangle className="h-3 w-3 text-amber-500" />
              )}
            </a>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
        {/* Left — Eligibility + Inherited */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: category.colorHex ?? "#6b7280" }}
                />
                <span className="font-bold text-sm">{category.name}</span>
                <span className="ml-auto text-xs text-muted-foreground font-mono font-bold">
                  {category.teamCount} eq.
                </span>
              </div>
              <EligibilityPanel category={category} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
                Reglas heredadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inheritedRules.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Sin reglas heredadas</p>
              ) : (
                inheritedRules.map((r, i) => <InheritedRuleCard key={i} rule={r} />)
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — Editor + Preview */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 grid place-items-center shrink-0">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="font-bold text-sm">Editor de contexto de categoría</span>
              </div>

              <Textarea
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); setPreview(null); }}
                placeholder="Ej: U17 empieza el 15 de junio. 2 grupos, round robin simple, top 2 a semifinales…"
                className="min-h-[120px] resize-none"
              />

              <div>
                <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">Ejemplos</p>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_PROMPTS.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => { setPrompt((t) => t ? `${t} ${ex}` : ex); setPreview(null); }}
                      className="text-left text-xs px-2.5 py-1.5 rounded-full border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-1"
                    >
                      <span className="text-brand-500 font-bold">+</span> {ex}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-center gap-2">
                <Button onClick={handleParse} disabled={!prompt.trim() || parsing} className="flex-1">
                  <Zap className="h-4 w-4" />
                  {parsing ? "Interpretando..." : "Interpretar contexto de categoría"}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { setPrompt(""); setPreview(null); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {preview && (
            <Card className="border-brand-200 dark:border-brand-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Modo de juego interpretado</CardTitle>
                  <Badge variant="info">Interpretado</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <GameModePreview constraints={preview} />

                {preview.startDate && (
                  <div className="flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-800 dark:text-emerald-300">
                      Fecha detectada: <strong>{preview.startDate}</strong>
                      {!category.startDate && " · se aplicará a la categoría"}
                    </span>
                  </div>
                )}

                {preview.warnings && preview.warnings.length > 0 && (
                  <div className="space-y-1">
                    {preview.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 pt-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => { setPrompt(initialPrompt); setPreview(null); }}>
          <X className="h-4 w-4" /> Descartar cambios
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" asChild>
          <a href="/context/history">
            <History className="h-4 w-4" /> Historial
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="/context/impact-simulator">
            <Target className="h-4 w-4" /> Simular impacto
          </a>
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!preview || saving || saved}
        >
          {saved ? (
            <><Check className="h-4 w-4" /> Guardado</>
          ) : saving ? (
            "Guardando..."
          ) : (
            <><Save className="h-4 w-4" /> Confirmar modo de juego</>
          )}
        </Button>
      </div>
    </div>
  );
}

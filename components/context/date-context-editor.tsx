"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Save, X, AlertTriangle, Check, Plus,
  Target, Zap, ChevronLeft, ChevronRight, Calendar, Layers, Clock, Pin, Users, Flag,
} from "lucide-react";

type ParsedConstraints = Record<string, unknown> & {
  teamRestrictions?: Array<{ teamPattern: string; restriction: string }>;
  courtRestrictions?: Array<{ court: string; restriction: string }>;
  timeRestrictions?: Array<{ target: string; afterTime: string }>;
  warnings?: string[];
};

type FixtureDate = {
  date: string; // YYYY-MM-DD
  label: string;
  matchCount: number;
};

type ExistingRule = {
  type: "restriction" | "time" | "courts" | "grouping";
  label: string;
  text: string;
};

const EXAMPLE_PROMPTS = [
  "Spartans U16 no puede jugar antes de las 11:00.",
  "Cancha C no disponible después de las 18:00.",
  "El cruce U14 solo después de las 14:00.",
];

const DOW_ES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function MiniCalendar({
  selected,
  onSelect,
  fixtureDates,
}: {
  selected: string;
  onSelect: (date: string) => void;
  fixtureDates: FixtureDate[];
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    selected ? parseInt(selected.slice(0, 4)) : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selected ? parseInt(selected.slice(5, 7)) - 1 : today.getMonth()
  );

  const fixtureDateSet = new Set(fixtureDates.map((f) => f.date));

  const first = new Date(viewYear, viewMonth, 1);
  const lead = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-7 h-7 rounded-lg border bg-background text-muted-foreground grid place-items-center hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-7 h-7 rounded-lg border bg-background text-muted-foreground grid place-items-center hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DOW_ES.map((d) => (
          <div key={d} className="text-center text-xs font-bold text-muted-foreground py-1">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isFixture = fixtureDateSet.has(dateStr);
          const isSelected = dateStr === selected;
          return (
            <button
              key={i}
              onClick={() => isFixture && onSelect(dateStr)}
              disabled={!isFixture}
              className={`aspect-square rounded-lg text-xs font-mono font-bold relative transition-colors ${
                isSelected
                  ? "bg-brand-600 text-white border border-brand-600"
                  : isFixture
                  ? "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/40"
                  : "text-muted-foreground/40 cursor-default"
              }`}
            >
              {d}
              {isFixture && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <span className="w-3 h-3 rounded-sm bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800" />
        Días del torneo
      </div>
    </div>
  );
}

function ExistingRuleCard({ rule }: { rule: ExistingRule }) {
  const iconMap = {
    restriction: <Layers className="h-3.5 w-3.5" />,
    time: <Clock className="h-3.5 w-3.5" />,
    courts: <Pin className="h-3.5 w-3.5" />,
    grouping: <Users className="h-3.5 w-3.5" />,
  };
  return (
    <div className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-muted/40 border border-muted border-l-[3px] border-l-amber-400">
      <span className="p-1 rounded-md shrink-0 text-amber-600 bg-amber-50 dark:bg-amber-900/20">
        {iconMap[rule.type]}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{rule.label}</div>
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
  tone: "warn" | "info" | "ok";
  items: string[];
}) {
  if (items.length === 0) return null;
  const colors = {
    warn: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    info: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    ok: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
  };
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${colors[tone]}`}>{icon}</div>
        <span className="text-xs font-bold">{title}</span>
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

export function DateContextEditor({
  fixtureDates,
  existingRulesByDate,
  initialDate,
  versionsByDate,
}: {
  fixtureDates: FixtureDate[];
  existingRulesByDate: Record<string, ExistingRule[]>;
  initialDate: string;
  versionsByDate: Record<string, number>;
}) {
  const router = useRouter();
  const defaultDate = initialDate || fixtureDates[0]?.date || "";
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState<ParsedConstraints | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const existingRules = existingRulesByDate[selectedDate] ?? [];
  const currentVersion = versionsByDate[selectedDate] ?? 0;

  const selectedFixtureDate = fixtureDates.find((f) => f.date === selectedDate);
  const formattedDate = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })
    : "";

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setPrompt("");
    setPreview(null);
    setError("");
  }

  async function handleParse() {
    if (!prompt.trim()) return;
    setParsing(true);
    setError("");
    try {
      const res = await fetch("/api/context/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, scope: "date" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreview(data.parsed);
    } catch {
      setError("Error al interpretar el contexto.");
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!preview || !prompt.trim() || !selectedDate) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/context/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          parsedConstraints: preview,
          scope: "date",
          effectiveDate: selectedDate,
          versionNumber: currentVersion + 1,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => { router.refresh(); setSaved(false); }, 1500);
    } catch {
      setError("Error al guardar el contexto de fecha.");
    } finally {
      setSaving(false);
    }
  }

  function buildParsedSections(p: ParsedConstraints) {
    const teamRestrictions: string[] = (p.teamRestrictions ?? []).map(
      (r) => `${r.teamPattern}: ${r.restriction}`
    );
    const courtRestrictions: string[] = (p.courtRestrictions ?? []).map(
      (r) => `${r.court}: ${r.restriction}`
    );
    const timeRestrictions: string[] = (p.timeRestrictions ?? []).map(
      (r) => `${r.target}: solo después de ${r.afterTime}`
    );
    return { teamRestrictions, courtRestrictions, timeRestrictions, warnings: p.warnings ?? [] };
  }

  const parsedSections = preview ? buildParsedSections(preview) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-4 items-start">
        {/* Calendar + existing rules */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              {fixtureDates.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Sin fechas de fixture aún</p>
                  <p className="text-xs mt-1">Las fechas aparecerán una vez publicado el fixture</p>
                </div>
              ) : (
                <MiniCalendar
                  selected={selectedDate}
                  onSelect={handleSelectDate}
                  fixtureDates={fixtureDates}
                />
              )}
            </CardContent>
          </Card>

          {selectedDate && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  Reglas existentes
                </CardTitle>
                {selectedFixtureDate && (
                  <p className="text-xs text-muted-foreground capitalize">{formattedDate}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {existingRules.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">Sin restricciones para esta fecha</p>
                ) : (
                  existingRules.map((r, i) => <ExistingRuleCard key={i} rule={r} />)
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Editor */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 grid place-items-center shrink-0">
                <Calendar className="h-4 w-4" />
              </span>
              <div>
                <div className="font-bold text-sm">
                  {selectedDate
                    ? `Restricciones para ${formattedDate}`
                    : "Selecciona una fecha del calendario"}
                </div>
                {selectedDate && (
                  <div className="text-xs text-muted-foreground font-mono">{selectedDate}</div>
                )}
              </div>
            </div>

            <Textarea
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); setPreview(null); }}
              placeholder="Describe las restricciones para esta fecha…"
              className="min-h-[140px] resize-none"
              disabled={!selectedDate}
            />

            <div>
              <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">Ejemplos</p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setPrompt((t) => t ? `${t} ${ex}` : ex); setPreview(null); }}
                    disabled={!selectedDate}
                    className="text-left text-xs px-2.5 py-1.5 rounded-full border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3 text-brand-500" /> {ex}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-2">
              <Button
                onClick={handleParse}
                disabled={!prompt.trim() || parsing || !selectedDate}
                className="flex-1"
              >
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
                <ParsedSection
                  title="Restricciones de equipo"
                  icon={<Users className="h-3 w-3" />}
                  tone="warn"
                  items={parsedSections.teamRestrictions}
                />
                <ParsedSection
                  title="Restricciones de cancha"
                  icon={<Pin className="h-3 w-3" />}
                  tone="info"
                  items={parsedSections.courtRestrictions}
                />
                <ParsedSection
                  title="Restricciones de horario"
                  icon={<Clock className="h-3 w-3" />}
                  tone="info"
                  items={parsedSections.timeRestrictions}
                />
                <ParsedSection
                  title="Advertencias"
                  icon={<AlertTriangle className="h-3 w-3" />}
                  tone="warn"
                  items={parsedSections.warnings}
                />
                {!parsedSections.teamRestrictions.length &&
                  !parsedSections.courtRestrictions.length &&
                  !parsedSections.timeRestrictions.length &&
                  !parsedSections.warnings.length && (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Sin restricciones detectadas. Intenta describir con más detalle.
                  </p>
                )}
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
        <Button variant="ghost" size="sm" onClick={() => { setPrompt(""); setPreview(null); }}>
          <X className="h-4 w-4" /> Descartar cambios
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" asChild>
          <a href="/context/impact-simulator">
            <Target className="h-4 w-4" /> Simular impacto
          </a>
        </Button>
        <Button
          onClick={handleSave}
          disabled={!preview || saving || saved || !selectedDate}
        >
          {saved ? (
            <><Check className="h-4 w-4" /> Guardado</>
          ) : saving ? (
            "Guardando..."
          ) : (
            <><Save className="h-4 w-4" /> Guardar contexto de fecha</>
          )}
        </Button>
      </div>
    </div>
  );
}

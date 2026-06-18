"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, ChevronLeft, Check, Loader2, List } from "lucide-react";
import type { DiffRow, DiffType } from "@/lib/imports/diff";

const ERROR_TYPE_META: Record<DiffType, { label: string; tone: string; ic: React.ElementType }> = {
  ambiguous:  { label: "Ambiguo",    tone: "#f59e0b", ic: AlertTriangle },
  duplicate:  { label: "Duplicado",  tone: "#f59e0b", ic: AlertTriangle },
  missing:    { label: "Faltante",   tone: "#f59e0b", ic: AlertTriangle },
  retired:    { label: "Retirado",   tone: "#6b7280", ic: AlertTriangle },
  rename:     { label: "Renombre",   tone: "#3b82f6", ic: AlertTriangle },
  color:      { label: "Color",      tone: "#3b82f6", ic: AlertTriangle },
  moved:      { label: "Movido",     tone: "#3b82f6", ic: AlertTriangle },
  newclub:    { label: "Club Nuevo", tone: "#16a34a", ic: CheckCircle2 },
  newcat:     { label: "Cat. Nueva", tone: "#16a34a", ic: CheckCircle2 },
  newteam:    { label: "Equipo Nuevo", tone: "#16a34a", ic: CheckCircle2 },
};

type Props = {
  batchId: string;
  errors: DiffRow[]; // rows where needsError === true
};

export function ErrorResolution({ batchId, errors }: Props) {
  const router = useRouter();
  const [sel, setSel] = useState(0);
  const [choice, setChoice] = useState<Record<string, number>>(() =>
    Object.fromEntries(errors.map((e) => [e.id, 0]))
  );
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const issue = errors[sel];
  const doneCount = Object.values(resolved).filter(Boolean).length;
  const allDone = doneCount === errors.length;
  const meta = issue ? ERROR_TYPE_META[issue.type] ?? ERROR_TYPE_META.ambiguous : null;

  function saveAndNext() {
    if (!issue) return;
    setResolved((r) => ({ ...r, [issue.id]: true }));
    if (sel < errors.length - 1) setSel(sel + 1);
  }

  async function applyResolutions() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/imports/${batchId}/errors`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutions: choice, allResolved: allDone }),
      });
      if (!res.ok) throw new Error("Error al guardar resoluciones");
      router.push(`/imports/${batchId}/diff`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setSaving(false);
    }
  }

  if (errors.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <p className="font-bold text-lg">Sin problemas que resolver</p>
        <p className="text-muted-foreground text-sm mt-1">Todos los cambios están listos para confirmar.</p>
        <Button className="mt-6" onClick={() => router.push(`/imports/${batchId}/diff`)}>
          Volver a cambios
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-4 pb-28">
      {/* Progress banner */}
      <div className={`flex items-center gap-3 p-3.5 rounded-lg border ${allDone ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
        {allDone
          ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          : <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />}
        <div className="font-bold text-[13px]">{doneCount} de {errors.length} problemas resueltos</div>
        <div className="flex-1 max-w-xs h-1.5 rounded-full bg-zinc-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${allDone ? "bg-green-500" : "bg-amber-400"}`}
            style={{ width: `${(doneCount / errors.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-4 items-start">
        {/* Issue list */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <List className="w-4 h-4 text-blue-500" />
              Problemas
              <span className="text-xs font-normal text-muted-foreground ml-1">{errors.length} en total</span>
            </CardTitle>
          </CardHeader>
          <div className="max-h-[480px] overflow-y-auto">
            {errors.map((e, i) => {
              const on = i === sel;
              const ok = resolved[e.id];
              const m = ERROR_TYPE_META[e.type] ?? ERROR_TYPE_META.ambiguous;
              const Icon = m.ic;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSel(i)}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-left cursor-pointer font-sans border-b border-zinc-100 last:border-0 transition-colors ${on ? "bg-blue-50" : "hover:bg-zinc-50"}`}
                  style={{ borderLeft: `3px solid ${on ? "#3b82f6" : "transparent"}` }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: on ? m.tone : `${m.tone}22`, color: on ? "#fff" : m.tone }}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.1} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-[12.5px] truncate">{m.label}</span>
                    <span className="block text-[11.5px] text-muted-foreground truncate mt-0.5">{e.entity}</span>
                  </span>
                  {ok
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" strokeWidth={2.1} />
                    : <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.tone }} />}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected issue detail */}
        {issue && meta && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between gap-2 text-sm flex-wrap">
                <span className="flex items-center gap-2">
                  <meta.ic className="w-4 h-4" style={{ color: meta.tone }} strokeWidth={2.1} />
                  {issue.entity}
                </span>
                {resolved[issue.id]
                  ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold bg-green-50 border border-green-200 text-green-600">Resuelto</span>
                  : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold border" style={{ background: `${meta.tone}18`, borderColor: `${meta.tone}40`, color: meta.tone }}>{meta.label}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Row data */}
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2">Datos importados</div>
              <div className="flex flex-wrap gap-3 p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 mb-3">
                <div>
                  <div className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Entidad</div>
                  <div className="text-[13.5px] font-bold">{issue.entity}</div>
                </div>
                <div>
                  <div className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Valor actual</div>
                  <div className="text-[13.5px] font-bold">{issue.current}</div>
                </div>
                <div>
                  <div className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Valor importado</div>
                  <div className="text-[13.5px] font-bold">{issue.imported}</div>
                </div>
              </div>
              {issue.note && (
                <div className="flex items-start gap-2 pb-4">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-zinc-400" />
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">{issue.note}</p>
                </div>
              )}

              {/* Resolution options */}
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2.5">Resolución sugerida</div>
              <div className="flex flex-col gap-2.5">
                {issue.decisions.map((opt, i) => {
                  const on = (choice[issue.id] ?? 0) === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setChoice((c) => ({ ...c, [issue.id]: i }))}
                      className={`flex items-center gap-3 p-3.5 rounded-lg border text-left cursor-pointer font-sans transition-all ${on ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${on ? "border-blue-500" : "border-zinc-300"}`}>
                        {on && <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                      </span>
                      <span className={`font-bold text-[13.5px] ${on ? "text-blue-700" : ""}`}>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-5 flex-wrap">
                <Button variant="ghost" disabled={sel === 0} onClick={() => setSel(Math.max(0, sel - 1))} className="gap-1.5">
                  <ChevronLeft className="w-4 h-4" />Anterior
                </Button>
                <div className="flex-1" />
                <Button onClick={saveAndNext} className="gap-1.5">
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                  {sel < errors.length - 1 ? "Guardar y siguiente" : "Guardar resolución"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

      {/* Sticky footer */}
      <div className="fixed left-0 sm:left-[var(--sidebar-w,234px)] right-0 bottom-0 bg-white border-t border-zinc-200 px-4 sm:px-8 py-3.5 flex items-center gap-3 shadow-[0_-6px_24px_rgba(15,23,42,.06)] z-10 flex-wrap transition-[left] duration-[180ms]">
        <Button variant="ghost" onClick={() => router.push(`/imports/${batchId}/diff`)} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" />Volver a cambios
        </Button>
        <div className="flex-1" />
        <Button
          variant={allDone ? "default" : "outline"}
          onClick={applyResolutions}
          disabled={saving || !allDone}
          className="gap-1.5"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Aplicar resoluciones
        </Button>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WizardSteps } from "./wizard-steps";
import { Building2, Layers, Plus, Shuffle, AlertTriangle, Zap, Lock, ArrowRight, Check, X, Loader2 } from "lucide-react";
import type { DiffRow, DiffSummary, DiffType } from "@/lib/imports/diff";

const DIFF_TYPE_META: Record<DiffType, { label: string; bg: string; t: string; ln: string }> = {
  newclub:   { label: "Club Nuevo",       bg: "rgb(240 253 244)", t: "rgb(22 163 74)",   ln: "rgb(187 247 208)" },
  newcat:    { label: "Cat. Nueva",       bg: "rgb(240 253 244)", t: "rgb(22 163 74)",   ln: "rgb(187 247 208)" },
  newteam:   { label: "Equipo Nuevo",     bg: "rgb(240 253 244)", t: "rgb(22 163 74)",   ln: "rgb(187 247 208)" },
  rename:    { label: "Renombre",         bg: "rgb(239 246 255)", t: "rgb(37 99 235)",   ln: "rgb(191 219 254)" },
  color:     { label: "Color",            bg: "rgb(239 246 255)", t: "rgb(37 99 235)",   ln: "rgb(191 219 254)" },
  moved:     { label: "Movido",           bg: "rgb(239 246 255)", t: "rgb(37 99 235)",   ln: "rgb(191 219 254)" },
  retired:   { label: "Retirado",         bg: "rgb(254 249 195)", t: "rgb(161 98 7)",    ln: "rgb(253 230 138)" },
  missing:   { label: "Faltante",         bg: "rgb(254 249 195)", t: "rgb(161 98 7)",    ln: "rgb(253 230 138)" },
  duplicate: { label: "Duplicado",        bg: "rgb(254 249 195)", t: "rgb(161 98 7)",    ln: "rgb(253 230 138)" },
  ambiguous: { label: "Ambiguo",          bg: "rgb(254 249 195)", t: "rgb(161 98 7)",    ln: "rgb(253 230 138)" },
};

function DiffTypeBadge({ type }: { type: DiffType }) {
  const m = DIFF_TYPE_META[type] ?? DIFF_TYPE_META.newteam;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold border"
      style={{ background: m.bg, color: m.t, borderColor: m.ln }}>
      {m.label}
    </span>
  );
}

function SummaryCard({ Icon, n, label, tone, active, onClick }: { Icon: React.ElementType; n: number; label: string; tone: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex-1 min-w-[120px] text-left p-4 rounded-lg border cursor-pointer font-sans transition-all shadow-sm hover:shadow"
      style={{ borderColor: active ? tone : undefined, boxShadow: active ? `0 0 0 3px ${tone}22` : undefined }}>
      <div className="flex items-center justify-between">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${tone}1f`, color: tone }}>
          <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
        </span>
        <span className="font-bold tabular-nums text-2xl tracking-tight" style={{ color: tone }}>{n}</span>
      </div>
      <div className="text-[12.5px] font-bold mt-2 text-muted-foreground">{label}</div>
    </button>
  );
}

function DiffDecision({ row, value, onChange }: { row: DiffRow; value: number; onChange: (v: number) => void }) {
  const danger = ["Equipo Retirado", "Marcar removido"];
  return (
    <div className="flex flex-wrap gap-1.5">
      {row.decisions.map((d, i) => {
        const on = value === i;
        const isDanger = danger.includes(d);
        return (
          <button key={d} type="button" onClick={() => onChange(i)}
            className={`px-2.5 py-1 rounded-lg text-[12px] font-bold cursor-pointer font-sans transition-all border inline-flex items-center gap-1
              ${on ? isDanger ? "border-amber-300 bg-amber-50 text-amber-700" : "border-blue-300 bg-blue-50 text-blue-700" : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"}`}>
            {on && <Check className="w-3 h-3 stroke-[2.5]" />}{d}
          </button>
        );
      })}
    </div>
  );
}

function DiffRowCard({ row, value, onChange, onResolve }: { row: DiffRow; value: number; onChange: (v: number) => void; onResolve: () => void }) {
  const m = DIFF_TYPE_META[row.type] ?? DIFF_TYPE_META.newteam;
  const isWarn = row.sev === "warn";
  return (
    <div className={`rounded-lg border overflow-hidden ${isWarn ? "border-amber-200 bg-amber-50/30" : "border-zinc-200 bg-white"}`}>
      {/* header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 flex-wrap">
        <DiffTypeBadge type={row.type} />
        <span className="font-extrabold text-[14px]">{row.entity}</span>
        <div className="ml-auto flex items-center gap-2">
          {row.impact && (
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-blue-500 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">
              <Zap className="w-3 h-3" strokeWidth={2.3} />Afecta fixture
            </span>
          )}
          {row.needsError && (
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-amber-600 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-3 h-3" strokeWidth={2.1} />Requiere resolución
            </span>
          )}
        </div>
      </div>
      {/* diff body */}
      <div className="flex items-stretch px-4 py-3 gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">Valor actual</div>
          <div className="text-[13px] font-semibold text-muted-foreground px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg min-h-[38px] flex items-center">{row.current}</div>
        </div>
        <div className="flex items-center self-center pt-5">
          <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: m.bg, color: m.t }}>
            <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: m.t }}>Valor importado</div>
          <div className="text-[13px] font-bold px-3 py-2 rounded-lg min-h-[38px] flex items-center" style={{ background: m.bg, border: `1px solid ${m.ln}`, color: "inherit" }}>{row.imported}</div>
        </div>
      </div>
      {/* note + decision */}
      <div className="flex items-center gap-3 px-4 pb-3 flex-wrap">
        {row.note && (
          <p className="flex items-start gap-2 flex-1 min-w-0 text-[12.5px] text-muted-foreground leading-relaxed">
            <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isWarn ? "text-amber-400" : "text-zinc-400"}`} />
            {row.note}
          </p>
        )}
        <div className={`${row.note ? "ml-auto" : ""} flex items-center gap-2 flex-wrap`}>
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">Decisión</span>
          {row.needsError
            ? <Button variant="ghost" size="sm" onClick={onResolve} className="gap-1.5 text-[12px]"><AlertTriangle className="w-3.5 h-3.5" />Resolver</Button>
            : <DiffDecision row={row} value={value} onChange={onChange} />}
        </div>
      </div>
    </div>
  );
}

const GROUP_FILTERS: { id: string; types: string[] }[] = [
  { id: "newclub",  types: ["newclub"] },
  { id: "newcat",   types: ["newcat"] },
  { id: "newteam",  types: ["newteam"] },
  { id: "update",   types: ["rename", "color", "moved"] },
  { id: "warn",     types: ["retired", "missing", "duplicate", "ambiguous"] },
];

type Props = {
  batchId: string;
  sourceType: string;
  mode: string;
  target?: string;
  fileName?: string;
  diff: DiffRow[];
  summary: DiffSummary;
};

export function DiffReview({ batchId, sourceType, mode, target, fileName, diff, summary }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [dec, setDec] = useState<Record<string, number>>(() => Object.fromEntries(diff.map((r) => [r.id, 0])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setRow = (id: string, v: number) => setDec((d) => ({ ...d, [id]: v }));
  const unresolved = diff.filter((r) => r.needsError).length;

  const filtered = diff.filter((r) => {
    if (filter === "all") return true;
    const g = GROUP_FILTERS.find((g) => g.id === filter);
    return g ? g.types.includes(r.type) : r.type === filter;
  });

  async function confirmDiff() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/imports/${batchId}/diff`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions: dec }),
      });
      if (!res.ok) throw new Error("Error al guardar decisiones");
      router.push(`/imports/${batchId}/confirm`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-4 pb-28">
      <WizardSteps current={2} backHref={(s) => s === 0 ? `/import` : `/imports/${batchId}/mapping`} />

      {/* Summary cards */}
      <div className="flex gap-3 flex-wrap">
        <SummaryCard Icon={Building2} n={summary.newclubs}  label="Clubes Nuevos"     tone="#16a34a" active={filter === "newclub"} onClick={() => setFilter(filter === "newclub" ? "all" : "newclub")} />
        <SummaryCard Icon={Layers}   n={summary.newcats}   label="Categorías Nuevas" tone="#16a34a" active={filter === "newcat"}  onClick={() => setFilter(filter === "newcat" ? "all" : "newcat")} />
        <SummaryCard Icon={Plus}     n={summary.newteams}  label="Equipos Nuevos"    tone="#16a34a" active={filter === "newteam"} onClick={() => setFilter(filter === "newteam" ? "all" : "newteam")} />
        <SummaryCard Icon={Shuffle}  n={summary.updates}   label="Actualizaciones"   tone="#3b82f6" active={filter === "update"}  onClick={() => setFilter(filter === "update" ? "all" : "update")} />
        <SummaryCard Icon={AlertTriangle} n={summary.warnings} label="Advertencias"  tone="#f59e0b" active={filter === "warn"}    onClick={() => setFilter(filter === "warn" ? "all" : "warn")} />
        <SummaryCard Icon={Zap}      n={summary.impacts}   label="Impactos fixture"  tone="#6366f1" active={false}                onClick={() => setFilter("all")} />
      </div>

      {/* Safety banner */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
        <Lock className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-[13.5px] text-blue-600">Los datos existentes nunca se eliminan automáticamente</p>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">Lo que falta en el archivo se marca como advertencia, no se borra. Las categorías nuevas quedan inactivas hasta tener fecha y modo de juego.</p>
        </div>
        {filter !== "all" && (
          <Button variant="ghost" size="sm" onClick={() => setFilter("all")} className="flex-shrink-0 gap-1.5">
            <X className="w-3.5 h-3.5" />Quitar filtro
          </Button>
        )}
      </div>

      {/* Diff rows */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-bold">No hay cambios en esta categoría</p>
            <Button variant="ghost" size="sm" onClick={() => setFilter("all")} className="mt-2">Ver todo</Button>
          </div>
        )}
        {filtered.map((r) => (
          <DiffRowCard key={r.id} row={r} value={dec[r.id] ?? 0} onChange={(v) => setRow(r.id, v)} onResolve={() => router.push(`/imports/${batchId}/errors`)} />
        ))}
      </div>

      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

      {/* Sticky footer */}
      <div className="fixed left-0 sm:left-[var(--sidebar-w,234px)] right-0 bottom-0 bg-white border-t border-zinc-200 px-4 sm:px-8 py-3.5 flex items-center gap-3 shadow-[0_-6px_24px_rgba(15,23,42,.06)] z-10 flex-wrap transition-[left] duration-[180ms]">
        <div className="hidden sm:block text-[13px] text-muted-foreground">
          <strong className="text-foreground">{diff.length} cambios</strong> ·{" "}
          {unresolved > 0
            ? <span className="text-amber-500 font-bold">{unresolved} requieren resolución</span>
            : <span className="text-green-500 font-bold">sin pendientes</span>}
        </div>
        <div className="flex-1" />
        <Button variant="ghost" onClick={() => router.push(`/tournaments`)} className="gap-1.5">
          <X className="w-4 h-4" />Cancelar
        </Button>
        <Button variant="outline" onClick={() => router.push(`/imports/${batchId}/errors`)} className="gap-1.5">
          <AlertTriangle className="w-4 h-4" />Resolver Advertencias{unresolved > 0 ? ` · ${unresolved}` : ""}
        </Button>
        <Button onClick={confirmDiff} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Confirmar Importación
        </Button>
      </div>
    </div>
  );
}

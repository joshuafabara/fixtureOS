"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WizardSteps } from "./wizard-steps";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Eye, List, Loader2, LayoutGrid, Users } from "lucide-react";
import type { ImportPreview } from "@/lib/imports/excel";
import type { ImageExtractedRow } from "@/lib/imports/image";

type Column = { col: string; detected: string; sample: string; target: string };

const MAP_TARGETS = [
  { id: "club",     label: "Club" },
  { id: "team",     label: "Equipo" },
  { id: "category", label: "Categoría" },
  { id: "color",    label: "Color" },
  { id: "status",   label: "Estado" },
  { id: "ignore",   label: "Ignorar columna" },
];

function mapPreviewToColumns(preview: ImportPreview): Column[] {
  if (!preview.rows[0]) return [];
  return [
    { col: "A", detected: "Club",      sample: preview.rows[0]?.clubName ?? "",       target: "club" },
    { col: "B", detected: "Equipo",    sample: preview.rows[0]?.teamName ?? "",       target: "team" },
    { col: "C", detected: "Categoría", sample: preview.rows[0]?.categoryName ?? "",   target: "category" },
    { col: "D", detected: "Color",     sample: preview.rows[0]?.categoryColor ?? "—", target: "color" },
  ];
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? "bg-green-500" : value >= 70 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums text-muted-foreground">{value}%</span>
    </div>
  );
}

function FlagTag({ flag }: { flag: string | null }) {
  if (!flag || flag === "new") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 text-[11px] font-bold">OK</span>;
  const map: Record<string, { cls: string; label: string }> = {
    dup:         { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "Duplicado" },
    missingclub: { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "Sin club" },
    ambiguous:   { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "Ambiguo" },
    lowconf:     { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "Revisar" },
    review:      { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "Revisar" },
  };
  const f = map[flag] ?? { cls: "bg-zinc-100 text-zinc-500 border-zinc-200", label: flag };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${f.cls}`}>{f.label}</span>;
}

// ── Por Categoría view ────────────────────────────────────────────────────────

function CategoryView({ preview }: { preview: ImportPreview }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      {preview.categories.map((cat) => {
        const catTeams = preview.rows.filter((r) => r.categoryName === cat.name);
        return (
          <div key={cat.name} className="rounded-lg border border-zinc-100 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-zinc-50 border-b border-zinc-100">
              {cat.color && (
                <span className="w-3 h-3 rounded-full flex-shrink-0 border border-zinc-200" style={{ background: cat.color }} />
              )}
              <span className="font-extrabold text-[13.5px]">{cat.name}</span>
              <span className="ml-auto text-[12px] font-semibold text-muted-foreground">{catTeams.length} equipos</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1 px-4 py-3">
              {catTeams.map((r, i) => (
                <span key={i} className="text-[12.5px] py-0.5 truncate text-muted-foreground font-medium">{r.teamName}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Por Club view ─────────────────────────────────────────────────────────────

function ClubView({ preview }: { preview: ImportPreview }) {
  // Group rows by clubName
  const clubMap = new Map<string, { categoryName: string; teamName: string }[]>();
  for (const r of preview.rows) {
    if (!clubMap.has(r.clubName)) clubMap.set(r.clubName, []);
    clubMap.get(r.clubName)!.push({ categoryName: r.categoryName, teamName: r.teamName });
  }
  const clubs = [...clubMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="flex flex-col gap-0 divide-y divide-zinc-100">
      {clubs.map(([clubName, entries]) => (
        <div key={clubName} className="grid grid-cols-[1.4fr_2fr] items-start gap-4 px-4 py-3">
          <div className="font-extrabold text-[13px] pt-0.5 truncate">{clubName}</div>
          <div className="flex flex-wrap gap-1.5">
            {entries.map((e, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 text-[11.5px] font-semibold">
                <span className="font-bold">{e.teamName}</span>
                <span className="text-zinc-400">·</span>
                <span className="text-[10.5px] text-zinc-500">{e.categoryName}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Image rows view ───────────────────────────────────────────────────────────

function ImageRowsView({ extractedRows }: { extractedRows: ImageExtractedRow[] }) {
  return (
    <div className="min-w-[640px]">
      <div className="grid grid-cols-[140px_1.1fr_1.3fr_90px_110px_110px] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground border-b border-zinc-100">
        <div>Confianza</div><div>Club</div><div>Equipo</div><div>Cat.</div><div>Estado</div><div className="text-right">Marca</div>
      </div>
      {extractedRows.slice(0, 20).map((r, i, arr) => (
        <div key={i} className={`grid grid-cols-[140px_1.1fr_1.3fr_90px_110px_110px] items-center px-4 py-3 ${i < arr.length - 1 ? "border-b border-zinc-100" : ""} ${r.flag && r.flag !== null ? "bg-amber-50/40" : ""}`}>
          <ConfidenceBar value={r.confidence} />
          <div className={`font-bold text-[13.5px] truncate ${r.clubName === "?" ? "text-amber-500" : ""}`}>{r.clubName}</div>
          <div className="text-[13px] text-muted-foreground truncate">{r.teamName}</div>
          <div className="text-[12.5px] font-semibold truncate">{r.categoryName}</div>
          <div className={`text-[12.5px] font-semibold ${r.status !== "active" ? "text-amber-500" : "text-muted-foreground"}`}>{r.status}</div>
          <div className="text-right"><FlagTag flag={r.flag} /></div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  batchId: string;
  sourceType: string;
  preview: ImportPreview;
  extractedRows?: ImageExtractedRow[];
  warnings: string[];
};

export function MappingReview({ batchId, sourceType, preview, extractedRows, warnings }: Props) {
  const router = useRouter();
  const isImage = sourceType === "image";
  const [cols, setCols] = useState<Column[]>(() => mapPreviewToColumns(preview));
  const [previewTab, setPreviewTab] = useState<"category" | "club">("category");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setColTarget = (i: number, val: string) =>
    setCols((cs) => cs.map((c, j) => j === i ? { ...c, target: val } : c));

  const issueRows = (extractedRows ?? []).filter((r) => r.flag && r.flag !== null);

  const validations = [
    { ok: preview.clubs.length > 0,      text: `${preview.clubs.length} clubs detectados` },
    { ok: preview.categories.length > 0, text: `${preview.categories.length} categorías detectadas` },
    { ok: preview.totalTeams > 0,        text: `${preview.totalTeams} equipos en total` },
    { ok: warnings.length === 0,         text: warnings.length === 0 ? "Sin advertencias" : `${warnings.length} advertencias` },
    ...(isImage ? [{ ok: issueRows.length === 0, text: `${issueRows.length} filas con baja confianza` }] : []),
  ];

  async function confirmMapping() {
    setSaving(true);
    setError("");
    const columnMapping = Object.fromEntries(cols.map((c) => [c.col, c.target]));
    try {
      const res = await fetch(`/api/imports/${batchId}/mapping`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnMapping, rows: preview.rows }),
      });
      if (!res.ok) throw new Error("Error al confirmar mapeo");
      router.push(`/imports/${batchId}/diff`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-4 pb-28">
      <WizardSteps current={1} backHref={(s) => s === 0 ? `/import` : `/imports/${batchId}/mapping`} />

      {/* Column mapping table — non-image only */}
      {!isImage && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <List className="w-4 h-4 text-blue-500" />
              Columnas detectadas
              <span className="text-xs font-normal text-muted-foreground ml-1">{cols.length} columnas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[580px]">
                <div className="grid grid-cols-[56px_1.1fr_1.3fr_1.4fr] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground border-b border-zinc-100">
                  <div>Col</div><div>Detectada</div><div>Ejemplo</div><div>Campo FixtureOS</div>
                </div>
                {cols.map((c, i) => (
                  <div key={c.col} className={`grid grid-cols-[56px_1.1fr_1.3fr_1.4fr] items-center px-4 py-3 ${i < cols.length - 1 ? "border-b border-zinc-100" : ""}`}>
                    <div className="font-extrabold text-[13px] text-blue-500 font-mono">{c.col}</div>
                    <div className="font-bold text-[13.5px]">{c.detected}</div>
                    <div className="font-mono text-[12.5px] text-muted-foreground truncate pr-4">{c.sample}</div>
                    <div className="max-w-[220px]">
                      <select
                        value={c.target}
                        onChange={(e) => setColTarget(i, e.target.value)}
                        className={`w-full py-1.5 px-2.5 rounded-lg border text-[12.5px] font-bold focus:outline-none focus:ring-2 focus:ring-blue-300 ${c.target === "ignore" ? "border-zinc-200 bg-zinc-50 text-zinc-400" : "border-blue-100 bg-blue-50 text-blue-700"}`}
                      >
                        {MAP_TARGETS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview card with tab switcher */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-base flex-1">
              <Eye className="w-4 h-4 text-blue-500" />
              {isImage ? "Datos extraídos" : "Vista previa"}
            </CardTitle>
            {!isImage && (
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-100">
                <button
                  type="button"
                  onClick={() => setPreviewTab("category")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all ${previewTab === "category" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Por Categoría
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("club")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold transition-all ${previewTab === "club" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Por Club
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isImage ? (
            <div className="overflow-x-auto">
              <ImageRowsView extractedRows={extractedRows ?? []} />
            </div>
          ) : previewTab === "category" ? (
            <CategoryView preview={preview} />
          ) : (
            <ClubView preview={preview} />
          )}
        </CardContent>
      </Card>

      {/* Validation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Validación
            <span className="text-xs font-normal text-muted-foreground ml-1">{validations.filter((v) => !v.ok).length} elementos requieren atención</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {validations.map((v, i) => (
              <div key={i} className={`flex items-center gap-2.5 p-3 rounded-lg border ${v.ok ? "border-zinc-200 bg-zinc-50" : "border-amber-200 bg-amber-50"}`}>
                {v.ok
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                <span className="text-[13px] font-bold">{v.text}</span>
              </div>
            ))}
          </div>
          {warnings.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {warnings.map((w, i) => (
                <p key={i} className="text-[12.5px] text-amber-600 font-semibold flex gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{w}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

      {/* Sticky footer */}
      <div className="fixed left-0 sm:left-[var(--sidebar-w,234px)] right-0 bottom-0 bg-white border-t border-zinc-200 px-4 sm:px-8 py-3.5 flex items-center gap-3 shadow-[0_-6px_24px_rgba(15,23,42,.06)] z-10 flex-wrap transition-[left] duration-[180ms]">
        <Button variant="ghost" onClick={() => router.push("/import")} className="gap-1.5">
          <ChevronLeft className="w-4 h-4" /> Volver
        </Button>
        <div className="hidden sm:block text-[13px] text-muted-foreground">
          <strong className="text-foreground">{validations.filter((v) => !v.ok).length} advertencias</strong> · puedes resolverlas ahora o en la revisión de cambios
        </div>
        <div className="flex-1" />
        <Button variant="outline" onClick={() => router.push(`/imports/${batchId}/errors`)}>
          <AlertTriangle className="w-4 h-4" /> Resolver Problemas
        </Button>
        <Button onClick={confirmMapping} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Confirmar Mapeo
          {!saving && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

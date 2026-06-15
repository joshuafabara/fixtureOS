"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle2,
  Loader2, ChevronRight, Download, X,
} from "lucide-react";

type ParsedRow = { clubName: string; teamName: string; categoryName: string; categoryColor: string | null };
type Preview = { rows: ParsedRow[]; clubs: string[]; categories: { name: string; color: string | null }[]; totalTeams: number; warnings: string[] };
type Tournament = { id: string; name: string };

type Props = { tournaments: Tournament[] };

const STEPS = ["Cargar archivo", "Vista previa", "Confirmar"] as const;

export function ExcelImporter({ tournaments }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState(tournaments[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ clubsCreated: number; categoriesCreated: number; teamsCreated: number; teamsSkipped: number } | null>(null);

  async function handleParse() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/imports/excel/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al analizar");
      setPreview(data as Preview);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!preview || !selectedTournamentId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/imports/excel/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: selectedTournamentId, rows: preview.rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al confirmar");
      setResult(data);
      setStep(2);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function downloadTemplate() {
    const res = await fetch("/api/imports/excel/template");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-importacion.xlsx";
    a.click();
  }

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-sm font-medium ${i === step ? "text-foreground" : i < step ? "text-emerald-600" : "text-muted-foreground"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" :
                i === step ? "bg-foreground text-background" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {label}
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 0: Upload */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-border hover:border-foreground/30 transition-colors p-8 text-center">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">Sube tu archivo Excel</p>
            <p className="text-sm text-muted-foreground mb-4">
              Columnas requeridas: <strong>Club</strong>, <strong>Equipo</strong>, <strong>Categoría</strong>. Columna opcional: <strong>Color</strong>.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button onClick={() => fileRef.current?.click()} variant="outline">
                <Upload className="h-4 w-4" /> Seleccionar archivo .xlsx
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4" /> Descargar plantilla
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
            />
          </div>
          {file && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle className="h-4 w-4" />{error}</p>}
          <Button onClick={handleParse} disabled={!file || loading} className="w-full">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analizando…</> : "Analizar archivo →"}
          </Button>
        </div>
      )}

      {/* Step 1: Preview */}
      {step === 1 && preview && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Clubes", value: preview.clubs.length },
              { label: "Categorías", value: preview.categories.length },
              { label: "Equipos", value: preview.totalTeams },
            ].map(({ label, value }) => (
              <Card key={label}>
                <CardContent className="py-3 text-center">
                  <p className="text-2xl font-bold stat-num">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Warnings */}
          {preview.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> {preview.warnings.length} advertencia{preview.warnings.length > 1 ? "s" : ""}
              </p>
              {preview.warnings.map((w, i) => <p key={i} className="text-xs text-amber-700 dark:text-amber-400">{w}</p>)}
            </div>
          )}

          {/* Category chips */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categorías detectadas</p>
            <div className="flex flex-wrap gap-2">
              {preview.categories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium">
                  {cat.color && <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />}
                  {cat.name}
                </div>
              ))}
            </div>
          </div>

          {/* Team preview table */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                    <tr>
                      <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Club</th>
                      <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Equipo</th>
                      <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Categoría</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.rows.slice(0, 100).map((r, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="py-2 px-4">{r.clubName}</td>
                        <td className="py-2 px-4">{r.teamName}</td>
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-1.5">
                            {r.categoryColor && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.categoryColor }} />}
                            {r.categoryName}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.rows.length > 100 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    … y {preview.rows.length - 100} equipos más
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tournament selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Torneo destino</label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Las categorías se asociarán a este torneo.</p>
          </div>

          {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle className="h-4 w-4" />{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setStep(0); setPreview(null); }}>← Volver</Button>
            <Button onClick={handleConfirm} disabled={loading || !selectedTournamentId} className="flex-1">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Importando…</> : `Confirmar importación (${preview.totalTeams} equipos)`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Done */}
      {step === 2 && result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-6 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold mb-1">Importación completada</h2>
            <p className="text-sm text-muted-foreground">Los datos han sido importados exitosamente.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Clubes creados", value: result.clubsCreated },
              { label: "Categorías creadas", value: result.categoriesCreated },
              { label: "Equipos creados", value: result.teamsCreated },
              { label: "Equipos existentes (omitidos)", value: result.teamsSkipped },
            ].map(({ label, value }) => (
              <Card key={label}>
                <CardContent className="py-3 text-center">
                  <p className="text-2xl font-bold stat-num">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setStep(0); setFile(null); setPreview(null); setResult(null); }} className="flex-1">
              Nueva importación
            </Button>
            <Button onClick={() => router.push("/tournaments")} className="flex-1">
              Ver torneos →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

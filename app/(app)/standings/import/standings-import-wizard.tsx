"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Loader2, GripVertical, ChevronRight, CheckCircle2 } from "lucide-react";

type Tournament = { id: string; name: string };
type Category = { id: string; name: string; colorHex: string | null; tournamentId: string };
type Team = { id: string; name: string; categoryId: string };

type Props = { tournaments: Tournament[]; categories: Category[]; teams: Team[] };
type RowEntry = { position: number; teamId: string };

export function StandingsImportWizard({ tournaments, categories, teams }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedTournamentId, setSelectedTournamentId] = useState(tournaments[0]?.id ?? "");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [rows, setRows] = useState<RowEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [importId, setImportId] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.tournamentId === selectedTournamentId),
    [categories, selectedTournamentId]
  );

  const filteredTeams = useMemo(
    () => teams.filter((t) => t.categoryId === selectedCategoryId),
    [teams, selectedCategoryId]
  );

  function initRows(catId: string) {
    const catTeams = teams.filter((t) => t.categoryId === catId);
    setRows(catTeams.map((t, i) => ({ position: i + 1, teamId: t.id })));
  }

  function moveRow(fromIdx: number, dir: -1 | 1) {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= rows.length) return;
    setRows((prev) => {
      const next = [...prev];
      [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
      return next.map((r, i) => ({ ...r, position: i + 1 }));
    });
  }

  function setTeamAtPosition(idx: number, teamId: string) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, teamId } : r));
  }

  async function handleSubmit() {
    if (!selectedTournamentId || !selectedCategoryId || rows.length === 0) {
      setError("Selecciona torneo, categoría y configura las posiciones.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      // Create import record
      const res = await fetch("/api/standings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId: selectedTournamentId, categoryId: selectedCategoryId, rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Error al guardar");
      setImportId(data.id);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm() {
    if (!importId) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/standings/import/${importId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Error al confirmar");
      setStep(3);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {["Selección", "Posiciones", "Revisar", "Listo"].map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              i < step ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" :
              i === step ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
            }`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`hidden sm:inline ${i === step ? "font-medium text-foreground" : "text-muted-foreground"}`}>{label}</span>
            {i < 3 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 0: Select tournament + category */}
      {step === 0 && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Torneo</label>
              <select
                value={selectedTournamentId}
                onChange={(e) => { setSelectedTournamentId(e.target.value); setSelectedCategoryId(""); }}
                className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
              >
                {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoría</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
                disabled={filteredCategories.length === 0}
              >
                <option value="">Selecciona categoría…</option>
                {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {filteredCategories.length === 0 && (
                <p className="text-xs text-muted-foreground">No hay categorías para este torneo.</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                disabled={!selectedCategoryId}
                onClick={() => { initRows(selectedCategoryId); setStep(1); }}
              >
                Siguiente →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Order teams */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Ordena los equipos de 1° a {rows.length}° lugar. Usa los botones ↑↓ o reordena seleccionando el equipo en cada posición.
          </p>
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2">
                <span className="text-sm font-bold text-muted-foreground w-6 text-right shrink-0">{idx + 1}°</span>
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  value={row.teamId}
                  onChange={(e) => setTeamAtPosition(idx, e.target.value)}
                  className="flex-1 text-sm border border-border rounded-md px-2 py-1.5 bg-background"
                >
                  {filteredTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => moveRow(idx, -1)} disabled={idx === 0}>↑</Button>
                  <Button variant="ghost" size="sm" onClick={() => moveRow(idx, 1)} disabled={idx === rows.length - 1}>↓</Button>
                </div>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle className="h-4 w-4" />{error}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>← Volver</Button>
            <Button onClick={() => setStep(2)} className="flex-1">Revisar posiciones →</Button>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Confirma las posiciones finales:</p>
          <Card>
            <CardContent className="p-0 divide-y">
              {rows.map((row, idx) => {
                const team = filteredTeams.find((t) => t.id === row.teamId);
                return (
                  <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-sm font-bold text-muted-foreground w-6 text-right">{idx + 1}°</span>
                    <span className="text-sm">{team?.name ?? row.teamId}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          {error && <p className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle className="h-4 w-4" />{error}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>← Editar</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : "Guardar y confirmar"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-6 py-8 text-center space-y-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <div>
            <h2 className="text-lg font-bold">Posiciones guardadas</h2>
            <p className="text-sm text-muted-foreground mt-1">{rows.length} equipos registrados en orden de posición.</p>
          </div>
          <Button onClick={() => { setStep(0); setRows([]); setImportId(null); }} variant="outline">
            Nueva importación
          </Button>
        </div>
      )}
    </div>
  );
}

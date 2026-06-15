"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Clock, Pin, Calendar, Edit2, ArrowLeftRight, Zap,
  CheckCircle2, AlertTriangle, Loader2, ChevronDown, ChevronUp, Lock,
} from "lucide-react";

export type MatchData = {
  id: string;
  scheduledDate: string | null;
  startTime: string | null;
  endTime: string | null;
  courtId: string | null;
  courtName: string | null;
  categoryId: string;
  categoryName: string | null;
  categoryColorHex: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  status: string;
  isLocked: boolean;
  phase: string;
};

export type CourtData = { id: string; name: string };

type Props = {
  versionId: string;
  tournamentId: string;
  versionNumber: number;
  matches: MatchData[];
  courts: CourtData[];
};

type PendingEdit = {
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  courtId: string | null;
  courtName: string | null;
  status: "scheduled" | "forfeit";
  changeType: "move" | "forfeit" | "unforfeit" | "swap_part" | "court_change";
};

type EditForm = {
  date: string;
  startTime: string;
  endTime: string;
  courtId: string;
};

const PHASE_LABEL: Record<string, string> = {
  group: "Grupos", semifinal: "Semifinal", final: "Final", quarterfinal: "Cuartos",
};

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-EC", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export function MatchEditor({ versionId, tournamentId, versionNumber, matches, courts }: Props) {
  const router = useRouter();
  const courtMap = useMemo(() => new Map(courts.map((c) => [c.id, c.name])), [courts]);

  const [pendingEdits, setPendingEdits] = useState<Map<string, PendingEdit>>(new Map());
  const [swapSourceId, setSwapSourceId] = useState<string | null>(null);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ date: "", startTime: "", endTime: "", courtId: "" });
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [showPending, setShowPending] = useState(true);
  const [commitReason, setCommitReason] = useState("");
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successWarnings, setSuccessWarnings] = useState<string[] | null>(null);

  function getEffective(m: MatchData): MatchData & { pending?: PendingEdit } {
    const edit = pendingEdits.get(m.id);
    if (!edit) return m;
    return {
      ...m,
      scheduledDate: edit.date ?? m.scheduledDate,
      startTime: edit.startTime ?? m.startTime,
      endTime: edit.endTime ?? m.endTime,
      courtId: edit.courtId ?? m.courtId,
      courtName: edit.courtName ?? m.courtName,
      status: edit.status,
      pending: edit,
    };
  }

  // Group by effective date
  const byDate = useMemo(() => {
    const map = new Map<string, (MatchData & { pending?: PendingEdit })[]>();
    const filtered = catFilter ? matches.filter((m) => m.categoryId === catFilter) : matches;
    for (const m of filtered) {
      const eff = getEffective(m);
      const key = eff.scheduledDate ?? "sin-fecha";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(eff);
    }
    // Sort matches within each date by startTime
    for (const [, arr] of map) {
      arr.sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, pendingEdits, catFilter]);

  const sortedDates = [...byDate.keys()].sort();

  // Unique categories for filter
  const allCategories = useMemo(() => {
    const seen = new Map<string, { id: string; name: string | null; colorHex: string | null }>();
    for (const m of matches) {
      if (!seen.has(m.categoryId)) seen.set(m.categoryId, { id: m.categoryId, name: m.categoryName, colorHex: m.categoryColorHex });
    }
    return [...seen.values()];
  }, [matches]);

  function openEditDialog(m: MatchData) {
    const eff = getEffective(m);
    setEditForm({
      date: eff.scheduledDate ?? "",
      startTime: eff.startTime?.slice(0, 5) ?? "",
      endTime: eff.endTime?.slice(0, 5) ?? "",
      courtId: eff.courtId ?? "",
    });
    setEditingMatchId(m.id);
  }

  function applyEdit() {
    if (!editingMatchId) return;
    const original = matches.find((m) => m.id === editingMatchId);
    if (!original) return;

    const newCourtName = editForm.courtId ? (courtMap.get(editForm.courtId) ?? null) : null;
    const dateChanged = editForm.date !== (original.scheduledDate ?? "");
    const timeChanged =
      editForm.startTime !== (original.startTime?.slice(0, 5) ?? "") ||
      editForm.endTime !== (original.endTime?.slice(0, 5) ?? "");
    const courtChanged = editForm.courtId !== (original.courtId ?? "");

    const changeType = courtChanged && !dateChanged && !timeChanged
      ? "court_change"
      : "move";

    const newEdits = new Map(pendingEdits);
    newEdits.set(editingMatchId, {
      date: editForm.date || null,
      startTime: editForm.startTime ? `${editForm.startTime}:00` : null,
      endTime: editForm.endTime ? `${editForm.endTime}:00` : null,
      courtId: editForm.courtId || null,
      courtName: newCourtName,
      status: (pendingEdits.get(editingMatchId)?.status ?? original.status) as "scheduled" | "forfeit",
      changeType,
    });
    setPendingEdits(newEdits);
    setEditingMatchId(null);
  }

  function handleSwap(matchId: string) {
    if (swapSourceId === null) {
      setSwapSourceId(matchId);
      return;
    }
    if (swapSourceId === matchId) {
      setSwapSourceId(null);
      return;
    }

    const sourceMatch = matches.find((m) => m.id === swapSourceId)!;
    const targetMatch = matches.find((m) => m.id === matchId)!;
    const effSource = getEffective(sourceMatch);
    const effTarget = getEffective(targetMatch);

    const newEdits = new Map(pendingEdits);
    newEdits.set(swapSourceId, {
      date: effTarget.scheduledDate,
      startTime: effTarget.startTime,
      endTime: effTarget.endTime,
      courtId: effTarget.courtId,
      courtName: effTarget.courtName,
      status: (effSource.status === "forfeit" ? "forfeit" : "scheduled") as "scheduled" | "forfeit",
      changeType: "swap_part",
    });
    newEdits.set(matchId, {
      date: effSource.scheduledDate,
      startTime: effSource.startTime,
      endTime: effSource.endTime,
      courtId: effSource.courtId,
      courtName: effSource.courtName,
      status: (effTarget.status === "forfeit" ? "forfeit" : "scheduled") as "scheduled" | "forfeit",
      changeType: "swap_part",
    });
    setPendingEdits(newEdits);
    setSwapSourceId(null);
  }

  function handleForfeit(m: MatchData) {
    const current = pendingEdits.get(m.id);
    const currentStatus = current?.status ?? m.status;
    const newStatus = currentStatus === "forfeit" ? "scheduled" : "forfeit";
    const newEdits = new Map(pendingEdits);
    const existing = current ?? {
      date: m.scheduledDate,
      startTime: m.startTime,
      endTime: m.endTime,
      courtId: m.courtId,
      courtName: m.courtName,
    };
    newEdits.set(m.id, {
      ...existing,
      status: newStatus,
      changeType: newStatus === "forfeit" ? "forfeit" : "unforfeit",
    });
    setPendingEdits(newEdits);
  }

  function removePendingEdit(matchId: string) {
    const newEdits = new Map(pendingEdits);
    newEdits.delete(matchId);
    setPendingEdits(newEdits);
  }

  async function handleCommit() {
    if (pendingEdits.size === 0) return;
    setSubmitting(true);
    setSubmitError("");

    const changes = Array.from(pendingEdits.entries()).map(([matchId, edit]) => ({
      matchId,
      newDate: edit.date,
      newStartTime: edit.startTime,
      newEndTime: edit.endTime,
      newCourtId: edit.courtId,
      newStatus: edit.status ?? "scheduled",
      changeType: edit.changeType,
    }));

    try {
      const res = await fetch(`/api/fixture-versions/${versionId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changes,
          reason: commitReason || `Edición manual desde V${versionNumber} (${changes.length} cambio${changes.length > 1 ? "s" : ""})`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al confirmar");

      if (data.warnings?.length > 0) {
        setSuccessWarnings(data.warnings);
        setShowCommitDialog(false);
        // Show warnings then navigate
        setTimeout(() => {
          router.push(`/fixture/${tournamentId}?v=${data.versionNumber}`);
          router.refresh();
        }, 3000);
      } else {
        router.push(`/fixture/${tournamentId}?v=${data.versionNumber}`);
        router.refresh();
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  const editingMatch = editingMatchId ? matches.find((m) => m.id === editingMatchId) : null;

  return (
    <div className="space-y-4">
      {/* Success warnings banner */}
      {successWarnings && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" />
            Cambios aplicados con advertencias — redirigiendo…
          </div>
          {successWarnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-700 dark:text-amber-400">{w}</p>
          ))}
        </div>
      )}

      {/* Swap mode banner */}
      {swapSourceId && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm font-medium">
            <ArrowLeftRight className="h-4 w-4" />
            Selecciona el segundo partido para intercambiar slots
          </div>
          <Button variant="outline" size="sm" onClick={() => setSwapSourceId(null)}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Pending changes summary */}
      {pendingEdits.size > 0 && (
        <div className="rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-900/10">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-brand-700 dark:text-brand-400"
            onClick={() => setShowPending((p) => !p)}
          >
            <span className="flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              {pendingEdits.size} cambio{pendingEdits.size !== 1 ? "s" : ""} pendiente{pendingEdits.size !== 1 ? "s" : ""}
            </span>
            {showPending ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showPending && (
            <div className="border-t divide-y">
              {Array.from(pendingEdits.entries()).map(([matchId, edit]) => {
                const m = matches.find((x) => x.id === matchId);
                if (!m) return null;
                return (
                  <div key={matchId} className="flex items-center gap-3 px-4 py-2.5 flex-wrap">
                    <span className="text-xs font-semibold flex-1 min-w-0 truncate">
                      {m.homeTeamName} vs {m.awayTeamName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {edit.changeType === "forfeit" ? "→ Forfeit"
                        : edit.changeType === "unforfeit" ? "→ Restaurado"
                        : edit.changeType === "swap_part" ? "→ Intercambiado"
                        : edit.changeType === "court_change" ? `→ Cancha ${edit.courtName ?? "?"}`
                        : `→ ${edit.date ?? "?"} ${edit.startTime?.slice(0, 5) ?? ""}`}
                    </span>
                    <button
                      onClick={() => removePendingEdit(matchId)}
                      className="text-xs text-muted-foreground hover:text-foreground underline shrink-0"
                    >
                      Deshacer
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Category filter */}
      {allCategories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium shrink-0">Filtrar:</span>
          <button
            onClick={() => setCatFilter(null)}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              !catFilter ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"
            }`}
          >
            Todos
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCatFilter(catFilter === cat.id ? null : cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                catFilter === cat.id ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.colorHex ?? "#6b7280" }} />
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Match list by date */}
      {sortedDates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Sin partidos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {sortedDates.map((dateStr) => {
            const dayMatches = byDate.get(dateStr)!;
            const isUndated = dateStr === "sin-fecha";
            return (
              <div key={dateStr}>
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold capitalize">
                    {isUndated ? "Sin fecha asignada" : formatDate(dateStr)}
                  </h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {dayMatches.length} partido{dayMatches.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <Card>
                  <CardContent className="p-0 divide-y">
                    {dayMatches.map((m) => {
                      const isSwapSource = m.id === swapSourceId;
                      const isSwapTarget = swapSourceId !== null && swapSourceId !== m.id;
                      const hasPending = pendingEdits.has(m.id);
                      const currentStatus = (pendingEdits.get(m.id)?.status ?? m.status);
                      const isForfeit = currentStatus === "forfeit";

                      return (
                        <div
                          key={m.id}
                          className={`flex items-center gap-2 px-4 py-3 flex-wrap transition-colors ${
                            isSwapSource ? "bg-blue-50 dark:bg-blue-900/20" : ""
                          } ${isSwapTarget ? "hover:bg-blue-50/50 dark:hover:bg-blue-900/10" : ""}`}
                        >
                          {/* Time */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono w-16 shrink-0">
                            <Clock className="h-3 w-3 shrink-0" />
                            {m.startTime?.slice(0, 5) ?? "—"}
                          </div>

                          {/* Court */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground w-24 shrink-0">
                            <Pin className="h-3 w-3 shrink-0" />
                            {m.courtName ?? "—"}
                          </div>

                          {/* Category */}
                          <div className="flex items-center gap-1.5 w-24 shrink-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.categoryColorHex ?? "#6b7280" }} />
                            <span className="text-xs font-medium text-muted-foreground truncate">{m.categoryName}</span>
                          </div>

                          {/* Phase */}
                          {m.phase && m.phase !== "regular" && (
                            <span className="text-xs text-muted-foreground italic shrink-0">{PHASE_LABEL[m.phase] ?? m.phase}</span>
                          )}

                          {/* Teams */}
                          <div className={`flex items-center gap-2 flex-1 min-w-0 ${isForfeit ? "opacity-50" : ""}`}>
                            <span className="text-sm font-semibold truncate">{m.homeTeamName ?? "—"}</span>
                            <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded font-bold shrink-0">vs</span>
                            <span className="text-sm font-semibold truncate">{m.awayTeamName ?? "—"}</span>
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {m.isLocked && <Lock className="h-3 w-3 text-amber-500" />}
                            {hasPending && (
                              <Badge variant="warning" className="text-xs py-0">Editado</Badge>
                            )}
                            {isForfeit && (
                              <Badge variant="error" className="text-xs py-0">Forfeit</Badge>
                            )}
                            {isSwapSource && (
                              <Badge variant="info" className="text-xs py-0">
                                <ArrowLeftRight className="h-2.5 w-2.5 mr-1" />Swap
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          {m.isLocked ? (
                            <span className="text-xs text-muted-foreground shrink-0">Bloqueado</span>
                          ) : (
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => openEditDialog(m)}
                                title="Editar fecha, hora y cancha"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant={isSwapSource ? "default" : isSwapTarget ? "outline" : "ghost"}
                                size="sm"
                                className={`h-7 px-2 text-xs ${isSwapTarget ? "border-blue-300 text-blue-600" : ""}`}
                                onClick={() => handleSwap(m.id)}
                                title={isSwapSource ? "Cancelar swap" : isSwapTarget ? "Intercambiar con este partido" : "Intercambiar slots"}
                              >
                                <ArrowLeftRight className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2 text-xs ${isForfeit ? "text-red-600" : ""}`}
                                onClick={() => handleForfeit(m)}
                                title={isForfeit ? "Quitar forfeit" : "Marcar como forfeit"}
                              >
                                <Zap className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editingMatchId !== null} onOpenChange={(open) => { if (!open) setEditingMatchId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar partido</DialogTitle>
            {editingMatch && (
              <p className="text-sm text-muted-foreground pt-1">
                {editingMatch.homeTeamName} vs {editingMatch.awayTeamName}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-date">Fecha</Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-start">Hora inicio</Label>
                <Input
                  id="edit-start"
                  type="time"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-end">Hora fin</Label>
                <Input
                  id="edit-end"
                  type="time"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-court">Cancha</Label>
              <select
                id="edit-court"
                value={editForm.courtId}
                onChange={(e) => setEditForm((f) => ({ ...f, courtId: e.target.value }))}
                className="w-full text-sm border border-border rounded-md px-2 py-2 bg-background"
              >
                <option value="">-- Sin cancha --</option>
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMatchId(null)}>Cancelar</Button>
            <Button onClick={applyEdit}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commit dialog */}
      <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar cambios</DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              Se creará la versión <strong>V{versionNumber + 1}</strong> con {pendingEdits.size} cambio{pendingEdits.size !== 1 ? "s" : ""} aplicado{pendingEdits.size !== 1 ? "s" : ""}.
            </p>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="commit-reason">Motivo del cambio (opcional)</Label>
              <Input
                id="commit-reason"
                placeholder="Ej: Cambio por solicitud del club Spartans"
                value={commitReason}
                onChange={(e) => setCommitReason(e.target.value)}
              />
            </div>
            {submitError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {submitError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommitDialog(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleCommit} disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Confirmar y crear V{versionNumber + 1}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sticky commit bar */}
      {pendingEdits.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm px-6 py-3 flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <Edit2 className="h-4 w-4 text-brand-600" />
            <span className="font-semibold">{pendingEdits.size} cambio{pendingEdits.size !== 1 ? "s" : ""} pendiente{pendingEdits.size !== 1 ? "s" : ""}</span>
            <span className="text-muted-foreground hidden sm:inline">· No guardado aún</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setPendingEdits(new Map()); setSwapSourceId(null); }}
            >
              Descartar
            </Button>
            <Button
              size="sm"
              onClick={() => { setSubmitError(""); setShowCommitDialog(true); }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirmar cambios
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, CheckCircle2, Loader2, ArrowLeftRight,
  ChevronLeft, RefreshCw, Zap, Lock, MapPin, Clock, Edit2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

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

type PendingEdit = {
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  courtId: string | null;
  courtName: string | null;
  status: "scheduled" | "forfeit";
  changeType: "move" | "forfeit" | "unforfeit" | "swap_part" | "court_change";
};

type Props = {
  versionId: string;
  tournamentId: string;
  tournamentName: string;
  versionNumber: number;
  versionState: string;
  matches: MatchData[];
  courts: CourtData[];
};

// ── Board constants ────────────────────────────────────────────────────────────

const B_SLOT_MIN  = 7 * 60;
const B_SLOT_MAX  = 22 * 60;
const B_SLOT_STEP = 30;
const B_ROW_H     = 38;

const STATE_LABEL: Record<string, string> = {
  draft: "borrador", published: "publicado", archived: "archivado",
};

function minToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function timeToMins(t: string): number {
  const [h, min] = t.split(":").map(Number);
  return h * 60 + (min || 0);
}
function catStyle(hex: string | null) {
  const h = hex ?? "#64748b";
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return {
    bg:        `rgba(${r},${g},${b},0.13)`,
    border:    `rgba(${r},${g},${b},0.32)`,
    dot:       h,
    text:      h,
    selShadow: `0 0 0 3px rgba(${r},${g},${b},0.28), 0 2px 8px rgba(0,0,0,.10)`,
  };
}
function fmtDayFull(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-EC", {
    weekday: "long", day: "numeric", month: "long",
  });
}
function fmtDayShort(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-EC", {
    weekday: "short", day: "numeric", month: "short",
  });
}

// ── Component ──────────────────────────────────────────────────────────────────

export function MatchEditor({
  versionId, tournamentId, tournamentName,
  versionNumber, versionState, matches, courts,
}: Props) {
  const router = useRouter();

  const [pendingEdits, setPendingEdits] = useState<Map<string, PendingEdit>>(new Map());
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [swapSourceId, setSwapSourceId] = useState<string | null>(null);
  const [dragId,       setDragId]       = useState<string | null>(null);
  const [currentDate,  setCurrentDate]  = useState<string | null>(null);
  const [showCommitDialog,  setShowCommitDialog]  = useState(false);
  const [commitReason,      setCommitReason]      = useState("");
  const [submitting,        setSubmitting]        = useState(false);
  const [submitError,       setSubmitError]       = useState("");
  const [successWarnings,   setSuccessWarnings]   = useState<string[] | null>(null);
  const [generatingDryRun,  setGeneratingDryRun]  = useState(false);
  const grabRef = useRef(0);

  const handleGenerateDryRun = useCallback(async () => {
    setGeneratingDryRun(true);
    try {
      const res = await fetch("/api/dry-run/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al generar");
      router.push(`/dry-run/${data.dryRunId}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al generar dry run");
    } finally {
      setGeneratingDryRun(false);
    }
  }, [tournamentId, router]);

  // ── Effective state (pending edits applied) ────────────────────────────────

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allEffective = useMemo(() => matches.map(getEffective), [matches, pendingEdits]);

  // ── Conflict detection ─────────────────────────────────────────────────────

  const conflictIds = useMemo(() => {
    const seen: Record<string, string> = {};
    const bad = new Set<string>();
    for (const m of allEffective) {
      if (!m.scheduledDate || !m.startTime || !m.courtId) continue;
      const k = `${m.courtId}@${m.scheduledDate}@${m.startTime.slice(0, 5)}`;
      if (seen[k]) { bad.add(m.id); bad.add(seen[k]); } else seen[k] = m.id;
    }
    return bad;
  }, [allEffective]);

  const conflictsCount = conflictIds.size / 2;

  // ── Sorted dates ───────────────────────────────────────────────────────────

  const sortedDates = useMemo(() => {
    const dates = new Set<string>();
    for (const m of allEffective) { if (m.scheduledDate) dates.add(m.scheduledDate); }
    return [...dates].sort();
  }, [allEffective]);

  const activeDate = currentDate ?? sortedDates[0] ?? null;

  const dayMatches = useMemo(
    () => (activeDate ? allEffective.filter((m) => m.scheduledDate === activeDate) : []),
    [allEffective, activeDate],
  );

  // ── Dynamic slot range for current day ────────────────────────────────────

  const [dynSlotMin, dynSlotMax] = useMemo(() => {
    const starts = dayMatches.filter((m) => m.startTime).map((m) => timeToMins(m.startTime!));
    const ends   = dayMatches.map((m) =>
      m.endTime ? timeToMins(m.endTime) : m.startTime ? timeToMins(m.startTime) + 90 : 0,
    );
    const minT = starts.length
      ? Math.max(B_SLOT_MIN, Math.floor((Math.min(...starts) - 60) / 60) * 60)
      : B_SLOT_MIN;
    const maxT = ends.length
      ? Math.min(B_SLOT_MAX, Math.ceil((Math.max(...ends) + 60) / 60) * 60)
      : B_SLOT_MIN + 10 * 60;
    return [minT, maxT];
  }, [dayMatches]);

  const slots = useMemo(() => {
    const a: number[] = [];
    for (let m = dynSlotMin; m < dynSlotMax; m += B_SLOT_STEP) a.push(m);
    return a;
  }, [dynSlotMin, dynSlotMax]);

  function toTop(mins: number) {
    return ((mins - dynSlotMin) / B_SLOT_STEP) * B_ROW_H;
  }

  // ── Patch helper ───────────────────────────────────────────────────────────

  function applyPatch(matchId: string, patch: Partial<PendingEdit>) {
    const orig   = matches.find((m) => m.id === matchId)!;
    const existing = pendingEdits.get(matchId);
    const base: PendingEdit = existing ?? {
      date:       orig.scheduledDate,
      startTime:  orig.startTime,
      endTime:    orig.endTime,
      courtId:    orig.courtId,
      courtName:  orig.courtName,
      status:     orig.status as "scheduled" | "forfeit",
      changeType: "move",
    };
    const next = new Map(pendingEdits);
    next.set(matchId, { ...base, ...patch });
    setPendingEdits(next);
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────

  function handleDrop(courtId: string, courtName: string, e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!dragId) return;
    const m = allEffective.find((x) => x.id === dragId);
    if (!m || m.isLocked) { setDragId(null); return; }

    const colTop = e.currentTarget.getBoundingClientRect().top;
    const y = e.clientY - colTop - grabRef.current;
    let slotIdx = Math.round(y / B_ROW_H);
    slotIdx = Math.max(0, Math.min(slots.length - 2, slotIdx));
    const newMin = slots[slotIdx] ?? dynSlotMin;

    const origStart = m.startTime ? timeToMins(m.startTime) : dynSlotMin;
    const origEnd   = m.endTime   ? timeToMins(m.endTime)   : origStart + 60;
    const duration  = origEnd - origStart;
    const newSt = minToTime(newMin) + ":00";
    const newEt = minToTime(newMin + duration) + ":00";

    if (newSt !== m.startTime || courtId !== m.courtId) {
      applyPatch(dragId, { startTime: newSt, endTime: newEt, courtId, courtName, changeType: "move" });
      setSelectedId(dragId);
    }
    setDragId(null);
  }

  // ── Swap ───────────────────────────────────────────────────────────────────

  function handleSwapClick(matchId: string) {
    if (!swapSourceId) { setSwapSourceId(matchId); return; }
    if (swapSourceId === matchId) { setSwapSourceId(null); return; }

    const src = allEffective.find((m) => m.id === swapSourceId)!;
    const tgt = allEffective.find((m) => m.id === matchId)!;
    const next = new Map(pendingEdits);
    next.set(swapSourceId, {
      date: tgt.scheduledDate, startTime: tgt.startTime, endTime: tgt.endTime,
      courtId: tgt.courtId, courtName: tgt.courtName,
      status: (src.status === "forfeit" ? "forfeit" : "scheduled") as "scheduled" | "forfeit",
      changeType: "swap_part",
    });
    next.set(matchId, {
      date: src.scheduledDate, startTime: src.startTime, endTime: src.endTime,
      courtId: src.courtId, courtName: src.courtName,
      status: (tgt.status === "forfeit" ? "forfeit" : "scheduled") as "scheduled" | "forfeit",
      changeType: "swap_part",
    });
    setPendingEdits(next);
    setSwapSourceId(null);
  }

  // ── Forfeit ────────────────────────────────────────────────────────────────

  function handleForfeit(id: string) {
    const m   = matches.find((x) => x.id === id)!;
    const cur = pendingEdits.get(id)?.status ?? m.status;
    const newS: "scheduled" | "forfeit" = cur === "forfeit" ? "scheduled" : "forfeit";
    applyPatch(id, { status: newS, changeType: newS === "forfeit" ? "forfeit" : "unforfeit" });
  }

  // ── Commit ─────────────────────────────────────────────────────────────────

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
      const res  = await fetch(`/api/fixture-versions/${versionId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changes,
          reason: commitReason || `Edición manual V${versionNumber} (${changes.length} cambio${changes.length > 1 ? "s" : ""})`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al confirmar");
      if (data.warnings?.length > 0) {
        setSuccessWarnings(data.warnings);
        setShowCommitDialog(false);
        setTimeout(() => { router.push(`/fixture/${tournamentId}?v=${data.versionNumber}`); router.refresh(); }, 3000);
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

  // ── Inspector helpers ──────────────────────────────────────────────────────

  const selectedMatch = selectedId ? allEffective.find((m) => m.id === selectedId) : null;

  const timeSlotOptions = useMemo(() => {
    const opts: string[] = [];
    for (let m = 7 * 60; m <= 21 * 60 - 30; m += 30) opts.push(minToTime(m));
    return opts;
  }, []);

  function onCourtChange(newCourtId: string) {
    if (!selectedId) return;
    const court = courts.find((c) => c.id === newCourtId);
    applyPatch(selectedId, { courtId: newCourtId, courtName: court?.name ?? null, changeType: "court_change" });
  }

  function onTimeChange(newT: string) {
    if (!selectedId) return;
    const m = allEffective.find((x) => x.id === selectedId)!;
    const newMin    = timeToMins(newT);
    const origStart = m.startTime ? timeToMins(m.startTime) : dynSlotMin;
    const origEnd   = m.endTime   ? timeToMins(m.endTime)   : origStart + 60;
    applyPatch(selectedId, {
      startTime: newT + ":00",
      endTime:   minToTime(newMin + (origEnd - origStart)) + ":00",
      changeType: "move",
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "#f8fafc" }}>

      {/* ── Sub-topbar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "11px 20px", borderBottom: "1px solid #e6eaf0",
        background: "#fff", flexWrap: "wrap", flexShrink: 0,
      }}>
        <Link href={`/fixture/${tournamentId}`} style={{
          width: 32, height: 32, borderRadius: 8, border: "1px solid #e6eaf0",
          background: "#fff", display: "grid", placeItems: "center",
          color: "#64748b", textDecoration: "none", flexShrink: 0,
        }}>
          <ChevronLeft size={17} />
        </Link>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
              Edición manual
            </h1>
            <span style={{
              fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
              background: "rgba(16,185,129,.12)", color: "#059669",
              fontFamily: "var(--font-mono)", whiteSpace: "nowrap",
            }}>
              V{versionNumber} · {STATE_LABEL[versionState] ?? versionState}
            </span>
          </div>
          {activeDate && (
            <div style={{ fontSize: 12, color: "#76869b", marginTop: 2, textTransform: "capitalize" }}>
              {fmtDayFull(activeDate)} · arrastrá los partidos para reprogramar
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Conflict status */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12.5, fontWeight: 700,
          color: conflictsCount > 0 ? "#dc2626" : "#10b981",
        }}>
          {conflictsCount > 0
            ? <AlertTriangle size={14} strokeWidth={2.2} />
            : <CheckCircle2 size={14} strokeWidth={2.2} />}
          {conflictsCount > 0
            ? `${conflictsCount} conflicto${conflictsCount > 1 ? "s" : ""}`
            : "Sin conflictos"}
        </span>

        <span style={{ fontSize: 12.5, color: "#76869b", fontWeight: 700 }}>
          {pendingEdits.size} cambio{pendingEdits.size !== 1 ? "s" : ""}
        </span>

        <button
          onClick={() => { setPendingEdits(new Map()); setSwapSourceId(null); setSelectedId(null); }}
          disabled={pendingEdits.size === 0}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 13px", borderRadius: 8, border: "1px solid #e6eaf0",
            background: "#fff", fontSize: 12.5, fontWeight: 700,
            color: pendingEdits.size === 0 ? "#94a3b8" : "#475569",
            cursor: pendingEdits.size === 0 ? "default" : "pointer",
          }}
        >
          <RefreshCw size={12} />
          Deshacer todo
        </button>

        {pendingEdits.size > 0 ? (
          <button
            onClick={() => { setSubmitError(""); setShowCommitDialog(true); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 8,
              background: "linear-gradient(135deg,#10b981,#059669)",
              border: "none", fontSize: 12.5, fontWeight: 700, color: "#fff",
              cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,.35)",
            }}
          >
            <CheckCircle2 size={13} />
            Confirmar cambios
          </button>
        ) : (
          <button
            onClick={handleGenerateDryRun}
            disabled={generatingDryRun}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 8,
              background: "linear-gradient(135deg,#10b981,#059669)",
              border: "none", fontSize: 12.5, fontWeight: 700, color: "#fff",
              cursor: generatingDryRun ? "wait" : "pointer",
              opacity: generatingDryRun ? 0.75 : 1,
              boxShadow: "0 2px 8px rgba(16,185,129,.35)",
            }}
          >
            {generatingDryRun ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={13} />}
            {generatingDryRun ? "Generando…" : "Previsualizar Dry Run"}
          </button>
        )}
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>

        {/* ── Board ── */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>

          {/* Swap banner */}
          {swapSourceId && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", borderRadius: 12, marginBottom: 14,
              background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.25)",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#6366f1" }}>
                <ArrowLeftRight size={14} />
                Seleccioná el segundo partido para intercambiar
              </span>
              <button
                onClick={() => setSwapSourceId(null)}
                style={{ fontSize: 12, fontWeight: 600, color: "#64748b", border: "1px solid #e6eaf0", background: "#fff", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Success warning banner */}
          {successWarnings && (
            <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a" }}>
              <div style={{ fontWeight: 700, color: "#d97706", fontSize: 13, marginBottom: 4 }}>
                Cambios aplicados con advertencias — redirigiendo…
              </div>
              {successWarnings.map((w, i) => <p key={i} style={{ margin: 0, fontSize: 12, color: "#92400e" }}>{w}</p>)}
            </div>
          )}

          {/* Day tabs */}
          {sortedDates.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {sortedDates.map((d) => {
                const active = d === activeDate;
                return (
                  <button key={d} onClick={() => setCurrentDate(d)} style={{
                    padding: "6px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 700,
                    border: `1px solid ${active ? "#10b981" : "#e6eaf0"}`,
                    background: active ? "rgba(16,185,129,.10)" : "#fff",
                    color: active ? "#059669" : "#64748b",
                    cursor: "pointer", textTransform: "capitalize",
                  }}>
                    {fmtDayShort(d)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Board grid */}
          {courts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontSize: 14 }}>
              Sin canchas configuradas.
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: `58px repeat(${courts.length}, minmax(150px,1fr))`,
              background: "#fff", border: "1px solid #e6eaf0",
              borderRadius: 14, overflow: "hidden", minWidth: 400,
            }}>
              {/* Header row */}
              <div style={{ borderBottom: "1px solid #e6eaf0", borderRight: "1px solid #e6eaf0", background: "#f8fafc", height: 42 }} />
              {courts.map((court) => (
                <div key={court.id} style={{
                  padding: "11px 12px", borderBottom: "1px solid #e6eaf0", borderRight: "1px solid #e6eaf0",
                  background: "#f8fafc", fontWeight: 800, fontSize: 12.5,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <MapPin size={13} color="#10b981" />
                  {court.name}
                </div>
              ))}

              {/* Time column */}
              <div style={{ position: "relative", borderRight: "1px solid #e6eaf0" }}>
                {slots.map((s) => {
                  const isHour = s % 60 === 0;
                  return (
                    <div key={s} style={{ height: B_ROW_H, borderBottom: isHour ? "1px solid #e6eaf0" : "1px dashed #f1f5f9", position: "relative" }}>
                      {isHour && (
                        <span style={{
                          position: "absolute", top: -8, right: 7,
                          fontSize: 10.5, color: "#94a3b8", fontWeight: 600,
                          fontFamily: "var(--font-mono)", background: "#fff", padding: "0 2px",
                        }}>
                          {minToTime(s)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Court lanes */}
              {courts.map((court) => {
                const lane = dayMatches.filter((m) => m.courtId === court.id);
                return (
                  <div
                    key={court.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(court.id, court.name, e)}
                    style={{
                      position: "relative", borderRight: "1px solid #e6eaf0",
                      background: dragId ? "rgba(16,185,129,.04)" : "transparent",
                      transition: "background .1s",
                    }}
                  >
                    {slots.map((s) => (
                      <div key={s} style={{ height: B_ROW_H, borderBottom: s % 60 === 0 ? "1px solid #e6eaf0" : "1px dashed #f1f5f9" }} />
                    ))}
                    {lane.map((m) => {
                      if (!m.startTime) return null;
                      const startMin  = timeToMins(m.startTime);
                      const endMin    = m.endTime ? timeToMins(m.endTime) : startMin + 60;
                      const top       = toTop(startMin);
                      const height    = Math.max(B_ROW_H - 4, ((endMin - startMin) / B_SLOT_STEP) * B_ROW_H - 4);
                      const s         = catStyle(m.categoryColorHex);
                      const isConflict = conflictIds.has(m.id);
                      const isSel      = m.id === selectedId;
                      const isSwapSrc  = m.id === swapSourceId;
                      const isSwapTgt  = swapSourceId !== null && swapSourceId !== m.id;
                      const isForfeit  = (pendingEdits.get(m.id)?.status ?? m.status) === "forfeit";
                      const hasPending = pendingEdits.has(m.id);
                      return (
                        <div
                          key={m.id}
                          draggable={!m.isLocked}
                          onDragStart={(e) => { setDragId(m.id); grabRef.current = e.nativeEvent.offsetY; }}
                          onDragEnd={() => setDragId(null)}
                          onClick={() => {
                            if (swapSourceId) { handleSwapClick(m.id); return; }
                            setSelectedId(m.id === selectedId ? null : m.id);
                          }}
                          style={{
                            position: "absolute", top: top + 2, left: 5, right: 5, height,
                            background: isConflict ? "rgba(254,202,202,.5)" : isForfeit ? "#f1f5f9" : s.bg,
                            border: `1.5px solid ${isConflict ? "#fca5a5" : isSwapTgt ? "#6366f1" : s.border}`,
                            borderLeft: `3px solid ${isConflict ? "#dc2626" : isSwapSrc ? "#6366f1" : s.dot}`,
                            borderRadius: 9, padding: "5px 8px", overflow: "hidden",
                            cursor: m.isLocked ? "not-allowed" : swapSourceId ? "pointer" : "grab",
                            boxShadow: isSel ? s.selShadow : "none",
                            opacity: dragId === m.id ? 0.4 : isForfeit ? 0.55 : 1,
                            userSelect: "none", transition: "box-shadow .12s, border .1s",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: isConflict ? "#dc2626" : s.text }}>
                              {m.startTime?.slice(0, 5)}
                            </span>
                            <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
                              {m.isLocked   && <Lock      size={10} color="#94a3b8" />}
                              {hasPending && !m.isLocked && <Edit2   size={10} color={s.dot} />}
                              {isConflict    && <AlertTriangle size={11} color="#dc2626" />}
                            </span>
                          </div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#131c2e", lineHeight: 1.25, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {m.homeTeamName ?? "—"}
                          </div>
                          <div style={{ fontSize: 10.5, color: "#64748b", lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            vs {m.awayTeamName ?? "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Inspector panel ── */}
        <aside style={{
          width: 300, flexShrink: 0,
          borderLeft: "1px solid #e6eaf0", background: "#fff",
          overflow: "auto", padding: "20px 18px",
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.9, color: "#94a3b8" }}>
            Partido seleccionado
          </div>

          {selectedMatch ? (() => {
            const s = catStyle(selectedMatch.categoryColorHex);
            const isForfeit = (pendingEdits.get(selectedMatch.id)?.status ?? selectedMatch.status) === "forfeit";
            return (
              <>
                {/* Category badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 99,
                    background: s.bg, border: `1px solid ${s.border}`, color: s.text,
                    fontSize: 12, fontWeight: 700,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: s.dot }} />
                    {selectedMatch.categoryName ?? "Categoría"}
                  </span>
                  {selectedMatch.isLocked && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#94a3b8", fontWeight: 700 }}>
                      <Lock size={11} /> Bloqueado
                    </span>
                  )}
                </div>

                {/* Teams */}
                <div style={{ background: "#f8fafc", border: "1px solid #e6eaf0", borderRadius: 12, padding: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 15.5, lineHeight: 1.3 }}>{selectedMatch.homeTeamName ?? "—"}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 8px", fontWeight: 600 }}>vs</div>
                  <div style={{ fontWeight: 800, fontSize: 15.5, lineHeight: 1.3 }}>{selectedMatch.awayTeamName ?? "—"}</div>
                </div>

                {selectedMatch.isLocked ? (
                  <div style={{ display: "flex", gap: 10, padding: 12, borderRadius: 11, background: "#f8fafc", border: "1px solid #e6eaf0" }}>
                    <Lock size={16} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                      Partido bloqueado. No puede ser reprogramado automáticamente.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Court select */}
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Cancha</div>
                      <div style={{ position: "relative" }}>
                        <MapPin size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                        <select
                          value={selectedMatch.courtId ?? ""}
                          onChange={(e) => onCourtChange(e.target.value)}
                          style={{
                            width: "100%", appearance: "none", WebkitAppearance: "none",
                            padding: "10px 28px 10px 32px", borderRadius: 10,
                            border: "1px solid #d4dae3", background: "#fff",
                            color: "#131c2e", fontWeight: 700, fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          <option value="">Sin cancha</option>
                          {courts.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b", fontSize: 11 }}>▾</span>
                      </div>
                    </div>

                    {/* Time select */}
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Hora</div>
                      <div style={{ position: "relative" }}>
                        <Clock size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                        <select
                          value={selectedMatch.startTime?.slice(0, 5) ?? ""}
                          onChange={(e) => onTimeChange(e.target.value)}
                          style={{
                            width: "100%", appearance: "none", WebkitAppearance: "none",
                            padding: "10px 28px 10px 32px", borderRadius: 10,
                            border: "1px solid #d4dae3", background: "#fff",
                            color: "#131c2e", fontWeight: 700, fontSize: 13,
                            fontFamily: "var(--font-mono)", cursor: "pointer",
                          }}
                        >
                          <option value="">Sin hora</option>
                          {timeSlotOptions.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b", fontSize: 11 }}>▾</span>
                      </div>
                    </div>

                    {/* Conflict warning */}
                    {conflictIds.has(selectedMatch.id) && (
                      <div style={{ display: "flex", gap: 9, padding: 11, borderRadius: 11, background: "#fef2f2", border: "1px solid #fecaca" }}>
                        <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.45 }}>
                          <strong style={{ color: "#dc2626" }}>Solapamiento.</strong> Otro partido usa {selectedMatch.courtName} a las {selectedMatch.startTime?.slice(0, 5)}.
                        </div>
                      </div>
                    )}

                    <div style={{ height: 1, background: "#f1f5f9" }} />

                    {/* Swap button */}
                    <button
                      onClick={() => handleSwapClick(selectedMatch.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 8, width: "100%", padding: "10px 0", borderRadius: 10,
                        border: `1px solid ${swapSourceId === selectedMatch.id ? "rgba(99,102,241,.35)" : "#e6eaf0"}`,
                        background: swapSourceId === selectedMatch.id ? "rgba(99,102,241,.08)" : "#fff",
                        fontSize: 13, fontWeight: 700,
                        color: swapSourceId === selectedMatch.id ? "#6366f1" : "#475569",
                        cursor: "pointer",
                      }}
                    >
                      <ArrowLeftRight size={14} />
                      {swapSourceId === selectedMatch.id ? "Cancelar intercambio" : "Intercambiar con otro partido"}
                    </button>

                    {/* Forfeit button */}
                    <button
                      onClick={() => handleForfeit(selectedMatch.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 8, width: "100%", padding: "9px 0", borderRadius: 10,
                        border: `1px solid ${isForfeit ? "#fecaca" : "#e6eaf0"}`,
                        background: isForfeit ? "#fef2f2" : "#fff",
                        fontSize: 12.5, fontWeight: 700,
                        color: isForfeit ? "#dc2626" : "#94a3b8",
                        cursor: "pointer",
                      }}
                    >
                      <Zap size={13} />
                      {isForfeit ? "Quitar forfeit" : "Marcar como forfeit"}
                    </button>

                    {/* Hint */}
                    <p style={{ margin: 0, fontSize: 11.5, color: "#94a3b8", lineHeight: 1.5, display: "flex", gap: 7, alignItems: "flex-start" }}>
                      <Zap size={12} style={{ flexShrink: 0, marginTop: 2, color: "#94a3b8" }} />
                      Los cambios manuales se respetan en la próxima generación. Previsualizá el Dry Run para ver advertencias antes de crear la versión.
                    </p>
                  </>
                )}
              </>
            );
          })() : (
            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>Seleccioná un partido en el tablero.</p>
          )}

          {/* Pending changes list */}
          {pendingEdits.size > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, color: "#94a3b8", marginBottom: 10 }}>
                Cambios pendientes ({pendingEdits.size})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Array.from(pendingEdits.entries()).slice(-8).reverse().map(([matchId, edit]) => {
                  const m = matches.find((x) => x.id === matchId);
                  if (!m) return null;
                  const label = edit.changeType === "forfeit" ? "Forfeit"
                    : edit.changeType === "unforfeit" ? "Restaurado"
                    : edit.changeType === "swap_part" ? "Intercambiado"
                    : edit.changeType === "court_change" ? `→ ${edit.courtName ?? "?"}`
                    : `→ ${edit.startTime?.slice(0, 5) ?? "?"}`;
                  return (
                    <div key={matchId} style={{
                      display: "flex", alignItems: "center", gap: 8, fontSize: 11.5,
                      color: "#64748b", padding: "7px 10px", borderRadius: 8,
                      background: "#f8fafc", border: "1px solid #e6eaf0",
                    }}>
                      <Edit2 size={11} color="#10b981" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.homeTeamName?.split(" ")[0]} — {label}
                      </span>
                      <button
                        onClick={() => {
                          const ne = new Map(pendingEdits);
                          ne.delete(matchId);
                          setPendingEdits(ne);
                        }}
                        style={{ fontSize: 14, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", flexShrink: 0, lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Commit dialog ── */}
      <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar cambios</DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              Se creará <strong>V{versionNumber + 1}</strong> con {pendingEdits.size} cambio{pendingEdits.size !== 1 ? "s" : ""} aplicado{pendingEdits.size !== 1 ? "s" : ""}.
            </p>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="commit-reason">Motivo (opcional)</Label>
              <Input
                id="commit-reason"
                placeholder="Ej: Cambio por solicitud del club"
                value={commitReason}
                onChange={(e) => setCommitReason(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !submitting) handleCommit(); }}
              />
            </div>
            {submitError && (
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> {submitError}
              </p>
            )}
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowCommitDialog(false)}
              disabled={submitting}
              className="text-sm border border-border rounded-md px-4 py-2 bg-background hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCommit}
              disabled={submitting}
              className="text-sm rounded-md px-4 py-2 bg-foreground text-background font-semibold flex items-center gap-2"
            >
              {submitting
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…</>
                : <><CheckCircle2 className="h-3.5 w-3.5" /> Confirmar V{versionNumber + 1}</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

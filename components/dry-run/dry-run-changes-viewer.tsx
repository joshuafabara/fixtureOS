"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Plus, Check } from "lucide-react";
import type { AuditReport } from "@/lib/ai/fixture-auditor";

// ── Types ──────────────────────────────────────────────────────────────────────

export type DryRunMatchRow = {
  id: string;
  changeType: string;       // add | conflict | warning
  severity: string;
  explanation: string | null;
  categoryId: string;
  categoryName: string;
  categoryColorHex: string | null;
  homeTeamId: string | null;
  homeTeamName: string;
  awayTeamId: string | null;
  awayTeamName: string;
  scheduledDate: string | null;
  startTime: string | null;
  endTime: string | null;
  courtName: string | null;
  phase: string;
  roundIndex: number;
  isPlaceholder?: boolean;
};

export type AuditMatchInfo = {
  severity: "error" | "warning";
  labels: string[];
};

type Props = {
  rows: DryRunMatchRow[];
  dryRunId: string;
  initialAuditReport?: AuditReport | null;
};

function buildMatchInfoFromReport(
  report: AuditReport | null,
  rows: DryRunMatchRow[],
): Map<string, AuditMatchInfo> {
  if (!report) return new Map();
  const map = new Map<string, AuditMatchInfo>();
  const rowMap = new Map(rows.map((r) => [r.id, r]));

  // All unique full lowercase team names, for full-name text matching
  const rosterFullNames = [
    ...new Set(
      rows.flatMap((r) => [r.homeTeamName, r.awayTeamName]).filter(
        (n): n is string => !!n && n !== "—",
      ),
    ),
  ].map((n) => n.toLowerCase());

  for (const v of report.violations) {
    const label = v.explanation_es?.trim() || "";
    const labelLower = label.toLowerCase();

    // ── Layer 1: category scope filter ───────────────────────────────────────
    // context_scope_id = the category where the restriction is DEFINED.
    // A match from a different category cannot violate a restriction from another category.
    const scopeId = v.context_scope_id;
    const isCategoryScoped = v.context_source === "category" && !!scopeId;

    // ── Layer 2: full-name team mention filter ────────────────────────────────
    // If the violation label explicitly names specific full team names (e.g. "Spartans U14"),
    // only flag matches that involve those exact teams.
    const mentionedFullNames = rosterFullNames.filter((n) => labelLower.includes(n));
    const isTeamSpecific = mentionedFullNames.length > 0;

    for (const id of (v.affected_match_ids ?? [])) {
      const row = rowMap.get(id);
      if (!row) continue; // hallucinated ID

      // Layer 1: reject if this match belongs to a different category than the restriction source
      if (isCategoryScoped && row.categoryId !== scopeId) continue;

      // Layer 2: reject if the violation mentions specific full team names and this match isn't one of them
      if (isTeamSpecific) {
        const homeOk = row.homeTeamName !== "—" && mentionedFullNames.includes(row.homeTeamName.toLowerCase());
        const awayOk = row.awayTeamName !== "—" && mentionedFullNames.includes(row.awayTeamName.toLowerCase());
        if (!homeOk && !awayOk) continue;
      }

      // ── Layer 3: time-compliance check ───────────────────────────────────────
      // For change_time violations: if the match's current startTime already satisfies
      // the afterTime threshold, it doesn't actually violate — skip it.
      if (v.machine_recommendation?.action === "change_time") {
        const patch = v.machine_recommendation.patch as Record<string, unknown> | null;
        const afterTime = patch?.newStartTime as string | undefined;
        if (afterTime && row.startTime && row.startTime >= afterTime) continue;
      }

      const cur = map.get(id);
      if (!cur) {
        map.set(id, { severity: v.severity === "error" ? "error" : "warning", labels: label ? [label] : [] });
      } else {
        if (v.severity === "error" && cur.severity === "warning") cur.severity = "error";
        if (label && !cur.labels.includes(label)) cur.labels.push(label);
      }
    }
  }
  return map;
}

// ── Calendar constants ─────────────────────────────────────────────────────────

const SLOT_MIN  = 7 * 60;   // 07:00
const SLOT_MAX  = 22 * 60;  // 22:00
const SLOT_STEP = 30;
const ROW_H     = 34;

function timeToMins(t: string | null): number {
  if (!t) return SLOT_MIN;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
function fmtTime(t: string | null) {
  if (!t) return "—";
  return t.slice(0, 5);
}
function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-EC", {
    weekday: "long", day: "numeric", month: "long",
  });
}
function compactDay(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-EC", {
    weekday: "short", day: "numeric", month: "short",
  });
}

// ── Color helpers ──────────────────────────────────────────────────────────────

function catStyles(hex: string | null) {
  const h = hex ?? "#64748b";
  const r = parseInt(h.replace("#","").slice(0,2),16);
  const g = parseInt(h.replace("#","").slice(2,4),16);
  const b = parseInt(h.replace("#","").slice(4,6),16);
  return {
    bg:         `rgba(${r},${g},${b},0.11)`,
    border:     `rgba(${r},${g},${b},0.30)`,
    borderLeft: h,
    text:       h,
    dot:        h,
  };
}

// ── Shared toolbar components ──────────────────────────────────────────────────

function SegTabs({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div style={{ display:"inline-flex", background:"var(--muted,#f1f5f9)", borderRadius:10, padding:3, gap:2 }}>
      {options.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer",
            fontFamily:"var(--font-sans)", fontSize:13, fontWeight:700,
            background: value === t.id ? "#fff" : "transparent",
            color: value === t.id ? "var(--foreground,#131c2e)" : "#64748b",
            boxShadow: value === t.id ? "0 1px 3px rgba(15,23,42,.10)" : "none",
            transition:"all .15s",
          }}
        >{t.label}</button>
      ))}
    </div>
  );
}

// ── Calendar view ──────────────────────────────────────────────────────────────

function CalendarDayView({ dayKey, matches, courtNames, activeCats, courtFilter, auditInfo }: {
  dayKey: string;
  matches: DryRunMatchRow[];
  courtNames: string[];
  activeCats: Set<string>;
  courtFilter: string;
  auditInfo: Map<string, AuditMatchInfo>;
}) {
  const [openBadge, setOpenBadge] = useState<{ id: string; docX: number; docY: number; text: string; sev: "error" | "warning" } | null>(null);

  useEffect(() => {
    if (!openBadge) return;
    function close() { setOpenBadge(null); }
    document.addEventListener("click", close);
    document.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("scroll", close, true);
    };
  }, [openBadge]);

  const visibleCourts = courtFilter === "all"
    ? courtNames
    : courtNames.filter((c) => c === courtFilter);

  const dayMatches = matches.filter(
    (m) => m.changeType === "add" &&
      m.scheduledDate === dayKey &&
      m.startTime !== null &&
      activeCats.has(m.categoryId) &&
      (courtFilter === "all" || m.courtName === courtFilter)
  );

  if (dayMatches.length === 0) return null;

  const allMins = dayMatches.flatMap((m) => [
    timeToMins(m.startTime),
    m.endTime ? timeToMins(m.endTime) : timeToMins(m.startTime) + 60,
  ]);
  const slotStart = Math.max(SLOT_MIN, Math.floor((Math.min(...allMins) - 30) / 60) * 60);
  const slotEnd   = Math.min(SLOT_MAX, Math.ceil( (Math.max(...allMins) + 60) / 60) * 60);

  const slots: number[] = [];
  for (let m = slotStart; m < slotEnd; m += SLOT_STEP) slots.push(m);

  function toTop(mins: number) { return ((mins - slotStart) / SLOT_STEP) * ROW_H; }
  function toPx(dur: number)   { return (dur / SLOT_STEP) * ROW_H; }

  return (
    <div style={{ background:"#fff", border:"1px solid #e6eaf0", borderRadius:14, overflow:"hidden" }}>
      {/* Date header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid #e6eaf0" }}>
        <div style={{ fontWeight:800, fontSize:15.5, fontFamily:"var(--font-sans)", textTransform:"capitalize" }}>
          {fmtDate(dayKey)}
        </div>
        <div style={{ fontSize:12, color:"#76869b", fontWeight:600 }}>
          {dayMatches.length} partido{dayMatches.length !== 1 ? "s" : ""} · cuadrícula 30 min
        </div>
      </div>

      {/* Grid */}
      <div style={{ overflowX:"auto" }}>
        <div style={{
          display:"grid",
          gridTemplateColumns:`60px repeat(${visibleCourts.length}, minmax(160px,1fr))`,
          minWidth:500,
        }}>
          {/* Header row */}
          <div style={{ borderBottom:"1px solid #e6eaf0", borderRight:"1px solid #e6eaf0", height:42 }} />
          {visibleCourts.map((c) => (
            <div key={c} style={{
              padding:"11px 12px", borderBottom:"1px solid #e6eaf0", borderRight:"1px solid #e6eaf0",
              fontWeight:800, fontSize:12.5, display:"flex", alignItems:"center", gap:6,
              fontFamily:"var(--font-sans)",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color:"#0d9488" }}>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="2.5" />
              </svg>
              {c}
            </div>
          ))}

          {/* Time column */}
          <div style={{ position:"relative", borderRight:"1px solid #e6eaf0" }}>
            {slots.map((s) => {
              const isHour = s % 60 === 0;
              const hh = Math.floor(s / 60).toString().padStart(2,"0");
              return (
                <div key={s} style={{ height:ROW_H, borderBottom: isHour ? "1px solid #e6eaf0" : "1px dashed #e6eaf0", position:"relative" }}>
                  {isHour && (
                    <span style={{
                      position:"absolute", top:-9, right:8, fontSize:11,
                      color:"#76869b", fontWeight:600, fontFamily:"var(--font-mono)",
                      background:"#fff", padding:"0 2px",
                    }}>{hh}:00</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Court lanes */}
          {visibleCourts.map((courtName) => {
            const courtMatches = dayMatches.filter((m) => m.courtName === courtName);
            return (
              <div key={courtName} style={{ position:"relative", borderRight:"1px solid #e6eaf0" }}>
                {slots.map((s) => (
                  <div key={s} style={{ height:ROW_H, borderBottom: s % 60 === 0 ? "1px solid #e6eaf0" : "1px dashed #e6eaf0" }} />
                ))}
                {courtMatches.map((m) => {
                  const startMins = timeToMins(m.startTime);
                  const endMins   = m.endTime ? timeToMins(m.endTime) : startMins + 60;
                  const top    = toTop(startMins);
                  const height = Math.max(ROW_H - 4, toPx(endMins - startMins) - 4);
                  const s = catStyles(m.categoryColorHex);
                  const info = auditInfo.get(m.id);
                  const flagColor = info?.severity === "error" ? "#dc2626" : "#d97706";
                  return (
                    <div
                      key={m.id}
                      id={`match-${m.id}`}
                      style={{
                        position:"absolute", top: top + 2, left:5, right:5, height,
                        background: s.bg,
                        border:`1px solid ${info ? (info.severity === "error" ? "#fca5a5" : "#fcd34d") : s.border}`,
                        borderLeft:`3px solid ${s.borderLeft}`,
                        borderRadius:8, padding:"5px 8px", overflow:"hidden",
                        boxShadow: info ? `0 0 0 2px ${info.severity === "error" ? "rgba(220,38,38,.18)" : "rgba(217,119,6,.18)"}` : "none",
                        transition:"box-shadow .2s",
                      }}
                    >
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:11.5, fontWeight:700, color:s.text }}>
                          {fmtTime(m.startTime)}
                        </span>
                        <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                          {info && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openBadge?.id === m.id) { setOpenBadge(null); return; }
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setOpenBadge({
                                  id: m.id,
                                  docX: rect.left + window.scrollX,
                                  docY: rect.bottom + window.scrollY,
                                  text: info.labels.length > 0 ? info.labels.join("\n") : "Violación IA detectada",
                                  sev: info.severity,
                                });
                              }}
                              style={{
                                width:14, height:14, borderRadius:"50%", flexShrink:0,
                                background: flagColor,
                                display:"inline-flex", alignItems:"center", justifyContent:"center",
                                fontSize:9, fontWeight:900, color:"#fff", lineHeight:1,
                                cursor:"pointer",
                              }}
                            >!</span>
                          )}
                          <span style={{
                            fontSize:10, fontWeight:700, padding:"1px 5px", borderRadius:99,
                            background:"rgba(16,185,129,.15)", color:"#059669",
                          }}>+</span>
                        </div>
                      </div>
                      <div style={{ fontSize:11.5, fontWeight:700, color:"#131c2e", lineHeight:1.3, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {m.homeTeamName || "—"}
                      </div>
                      <div style={{ fontSize:10.5, color:"#475569", lineHeight:1.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        vs {m.awayTeamName || "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Portal tooltip — position:absolute in document coords so it scrolls with the match card */}
      {openBadge && typeof document !== "undefined" && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position:"absolute",
            top: openBadge.docY + 8,
            left: Math.min(openBadge.docX, (typeof window !== "undefined" ? window.innerWidth + window.scrollX - 240 : 600)),
            zIndex:1000,
            background:"#1e293b",
            color:"#f1f5f9",
            borderRadius:10,
            padding:"10px 12px",
            fontSize:12,
            fontFamily:"var(--font-sans)",
            fontWeight:500,
            lineHeight:1.5,
            maxWidth:230,
            boxShadow:"0 8px 24px rgba(0,0,0,.35)",
            whiteSpace:"pre-line",
            pointerEvents:"none",
          }}
        >
          <div style={{ fontSize:10, fontWeight:700, opacity:.6, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>
            {openBadge.sev === "error" ? "Error IA" : "Advertencia IA"}
          </div>
          {openBadge.text}
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Cards view (existing list design) ─────────────────────────────────────────

function CardsView({ rows, filter, auditInfo }: { rows: DryRunMatchRow[]; filter: string; auditInfo: Map<string, AuditMatchInfo> }) {
  const [openBadgeId, setOpenBadgeId] = useState<string | null>(null);

  const displayed = filter === "added"   ? rows.filter((r) => r.changeType === "add")
                  : filter === "conflict" ? rows.filter((r) => r.changeType === "conflict")
                  : filter === "warning"  ? rows.filter((r) => r.changeType === "warning")
                  : rows;

  function formatDate(dateStr: string) {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("es-EC", {
      weekday:"short", day:"numeric", month:"short",
    });
  }

  if (displayed.length === 0) {
    return (
      <div style={{ background:"#fff", border:"1px solid #e6eaf0", borderRadius:14, padding:"48px 18px", textAlign:"center", color:"#76869b" }}>
        <div style={{ fontSize:14 }}>Sin {filter === "conflict" ? "conflictos" : filter === "warning" ? "advertencias" : "cambios"}</div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {displayed.map((row) => {
        const isConflict = row.changeType === "conflict";
        const isWarning  = row.changeType === "warning";
        const s = catStyles(row.categoryColorHex);
        const info = auditInfo.get(row.id);
        const auditFlagColor = info?.severity === "error" ? "#dc2626" : "#d97706";
        const tooltip = info ? (info.labels.length > 0 ? info.labels.join("\n") : "Violación IA detectada") : "";

        return (
          <div
            key={row.id}
            id={`match-${row.id}`}
            style={{
              background:"#fff",
              border:`1px solid ${info ? (info.severity === "error" ? "#fca5a5" : "#fcd34d") : isConflict ? "#fecaca" : "#e6eaf0"}`,
              borderRadius:12, overflow:"hidden",
              boxShadow: info ? `0 0 0 2px ${info.severity === "error" ? "rgba(220,38,38,.12)" : "rgba(217,119,6,.12)"}` : "none",
            }}
          >
            {/* Row header */}
            <div style={{
              display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
              borderBottom:"1px solid #e6eaf0", flexWrap:"wrap",
              background: isConflict ? "rgba(254,202,202,.25)" : isWarning ? "rgba(254,215,170,.20)" : "rgba(0,0,0,.018)",
            }}>
              {isConflict ? (
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
                  borderRadius:99, background:"#fef2f2", border:"1px solid #fecaca",
                  color:"#dc2626", fontSize:11.5, fontWeight:700,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Conflicto
                </span>
              ) : isWarning ? (
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
                  borderRadius:99, background:"#fffbeb", border:"1px solid #fde68a",
                  color:"#d97706", fontSize:11.5, fontWeight:700,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Advertencia
                </span>
              ) : (
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
                  borderRadius:99, background:"#f0fdf4", border:"1px solid #bbf7d0",
                  color:"#16a34a", fontSize:11.5, fontWeight:700,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Añadido
                </span>
              )}
              {row.categoryName && (
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight:700, color:s.text }}>
                  <span style={{ width:7, height:7, borderRadius:99, background:s.dot }} />
                  {row.categoryName}
                </span>
              )}
              {info && (
                <span
                  onClick={(e) => { e.stopPropagation(); setOpenBadgeId(openBadgeId === row.id ? null : row.id); }}
                  style={{
                    display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px",
                    borderRadius:99, fontSize:11, fontWeight:700,
                    background: info.severity === "error" ? "#fef2f2" : "#fffbeb",
                    border: `1px solid ${auditFlagColor}`,
                    color: auditFlagColor,
                    cursor:"pointer",
                    userSelect:"none",
                  }}
                >
                  <span style={{ fontWeight:900 }}>!</span>
                  {info.severity === "error" ? "Error IA" : "Advertencia IA"}
                </span>
              )}
              {!isConflict && !isWarning && row.scheduledDate && (
                <span style={{ marginLeft:"auto", fontSize:11, color:"#94a3b8", fontFamily:"var(--font-mono)" }}>
                  Ronda {row.roundIndex + 1}
                </span>
              )}
            </div>

            {/* Audit tooltip — inline, shown on badge click */}
            {openBadgeId === row.id && info && (
              <div style={{
                padding:"10px 14px",
                background: info.severity === "error" ? "#1e293b" : "#1e293b",
                color:"#f1f5f9",
                fontSize:12, fontFamily:"var(--font-sans)", fontWeight:500,
                lineHeight:1.5, whiteSpace:"pre-line",
              }}>
                <span style={{ fontSize:10, fontWeight:700, opacity:.6, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:3 }}>
                  {info.severity === "error" ? "Error IA" : "Advertencia IA"}
                </span>
                {tooltip}
              </div>
            )}

            {/* Row body */}
            <div style={{ padding:"12px 14px" }}>
              {isConflict || isWarning ? (
                <p style={{ fontSize:13, color:"#64748b", margin:0 }}>{row.explanation}</p>
              ) : (
                <div>
                  {row.isPlaceholder ? (
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                      <span style={{ fontWeight:700, fontSize:14, flex:1, color:"#94a3b8", fontStyle:"italic" }}>TBD</span>
                      <span style={{ fontSize:11, fontWeight:800, color:"#94a3b8", padding:"2px 8px", borderRadius:6, background:"#f1f5f9" }}>vs</span>
                      <span style={{ fontWeight:700, fontSize:14, flex:1, textAlign:"right", color:"#94a3b8", fontStyle:"italic" }}>TBD</span>
                    </div>
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <span style={{ fontWeight:700, fontSize:14, flex:1 }}>{row.homeTeamName || "—"}</span>
                      <span style={{ fontSize:11, fontWeight:800, color:"#94a3b8", padding:"2px 8px", borderRadius:6, background:"#f1f5f9" }}>vs</span>
                      <span style={{ fontWeight:700, fontSize:14, flex:1, textAlign:"right" }}>{row.awayTeamName || "—"}</span>
                    </div>
                  )}
                  <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                    {row.isPlaceholder && (
                      <span style={{ fontSize:11, color:"#94a3b8", fontStyle:"italic" }}>Pendiente clasificación · fecha y cancha TBD</span>
                    )}
                    {!row.isPlaceholder && row.scheduledDate && (
                      <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#64748b" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span style={{ textTransform:"capitalize" }}>{formatDate(row.scheduledDate)}</span>
                      </span>
                    )}
                    {!row.isPlaceholder && row.startTime && (
                      <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#64748b" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {row.startTime.slice(0,5)} – {row.endTime?.slice(0,5) ?? "—"}
                      </span>
                    )}
                    {!row.isPlaceholder && row.courtName && (
                      <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#64748b" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.5"/></svg>
                        {row.courtName}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

function highlightEl(el: HTMLElement | null) {
  if (!el) return;
  el.animate(
    [
      { outline: "3px solid #f59e0b", outlineOffset: "3px", opacity: 1 },
      { outline: "3px solid transparent", outlineOffset: "3px", opacity: 1 },
    ],
    { duration: 1600, easing: "ease-out" }
  );
}

export function DryRunChangesViewer({ rows, initialAuditReport }: Props) {
  const [view, setView]         = useState<"calendar" | "cards">("calendar");
  const [filter, setFilter]     = useState<"all" | "added" | "conflict" | "warning">("all");
  const [activeCats, setActiveCats] = useState<Set<string>>(() =>
    new Set(rows.map((r) => r.categoryId))
  );
  const [courtFilter, setCourtFilter] = useState("all");
  const [calVisible, setCalVisible]   = useState(6);
  const [auditInfo, setAuditInfo]     = useState<Map<string, AuditMatchInfo>>(() =>
    buildMatchInfoFromReport(initialAuditReport ?? null, rows)
  );

  // Refs to avoid stale closures in event handlers
  const calVisibleRef  = useRef(calVisible);
  const sortedDatesRef = useRef<string[]>([]);
  const viewRef        = useRef(view);
  const pendingScrollId = useRef<string | null>(null);

  useEffect(() => { calVisibleRef.current = calVisible; }, [calVisible]);
  useEffect(() => { viewRef.current = view; }, [view]);

  useEffect(() => {
    function handler(e: Event) {
      setAuditInfo(buildMatchInfoFromReport((e as CustomEvent<AuditReport>).detail, rows));
    }
    window.addEventListener("audit-report-updated", handler);
    return () => window.removeEventListener("audit-report-updated", handler);
  }, [rows]);

  // Handle scroll-to-match requests from AuditPanel
  useEffect(() => {
    function handler(e: Event) {
      const matchId = (e as CustomEvent<string>).detail;
      const row = rows.find((r) => r.id === matchId);

      if (row?.scheduledDate && viewRef.current === "calendar") {
        const dates = sortedDatesRef.current;
        const dateIdx = dates.indexOf(row.scheduledDate);
        if (dateIdx >= 0 && dateIdx >= calVisibleRef.current) {
          pendingScrollId.current = matchId;
          setCalVisible(dateIdx + 1);
          return;
        }
      }
      // Already visible — scroll immediately
      const el = document.getElementById(`match-${matchId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        highlightEl(el);
      }
    }
    window.addEventListener("audit-focus-match", handler);
    return () => window.removeEventListener("audit-focus-match", handler);
  }, [rows]);

  // After calVisible expands, execute the pending scroll
  useEffect(() => {
    if (!pendingScrollId.current) return;
    const id = pendingScrollId.current;
    pendingScrollId.current = null;
    requestAnimationFrame(() => {
      const el = document.getElementById(`match-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        highlightEl(el);
      }
    });
  }, [calVisible]);

  const addRows         = rows.filter((r) => r.changeType === "add");
  const placeholderRows = addRows.filter((r) => r.isPlaceholder);
  const scheduledRows   = addRows.filter((r) => !r.isPlaceholder);
  const conflictRows    = rows.filter((r) => r.changeType === "conflict");
  const warningRows     = rows.filter((r) => r.changeType === "warning");

  // Derive unique dates and courts from scheduled (non-placeholder) matches
  const sortedDates = useMemo(() => {
    const dates = scheduledRows
      .map((r) => r.scheduledDate)
      .filter((d): d is string => d !== null);
    return [...new Set(dates)].sort();
  }, [scheduledRows]);

  // Keep ref in sync so the event handler always sees the current dates list
  useEffect(() => { sortedDatesRef.current = sortedDates; }, [sortedDates]);

  const allCourtNames = useMemo(() => {
    const courts = scheduledRows
      .map((r) => r.courtName)
      .filter((c): c is string => c !== null);
    return [...new Set(courts)].sort();
  }, [scheduledRows]);

  const categories = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; colorHex: string | null }>();
    for (const r of rows) {
      if (!seen.has(r.categoryId)) {
        seen.set(r.categoryId, { id: r.categoryId, name: r.categoryName, colorHex: r.categoryColorHex });
      }
    }
    return [...seen.values()];
  }, [rows]);

  const courtOptions = useMemo(() => [
    { v:"all", l:"Todas las canchas" },
    ...allCourtNames.map((c) => ({ v:c, l:c })),
  ], [allCourtNames]);

  const filterTabs = [
    { key:"all",      label:`Todos (${rows.length})` },
    { key:"added",    label:`Añadidos (${addRows.length})` },
    { key:"conflict", label:`Conflictos (${conflictRows.length})` },
    { key:"warning",  label:`Advertencias (${warningRows.length})` },
  ] as const;

  const ROUND_LABELS: Record<string, string> = {
    quarterfinal: "Cuartos de final",
    semifinal: "Semifinal",
    final: "Final",
    "3rd_place": "Tercer puesto",
  };

  const visibleCalDates = sortedDates.slice(0, calVisible);

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        background:"#fff", border:"1px solid #e6eaf0", borderRadius:14,
        padding:"12px 16px", marginBottom:16,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <SegTabs
            value={view}
            onChange={(v) => setView(v as "calendar" | "cards")}
            options={[
              { id:"calendar", label:"Calendario" },
              { id:"cards",    label:"Lista de cambios" },
            ]}
          />

          <div style={{ width:1, height:26, background:"#e6eaf0" }} />

          {/* Court filter */}
          <div style={{ position:"relative", display:"inline-flex" }}>
            <select
              value={courtFilter}
              onChange={(e) => setCourtFilter(e.target.value)}
              style={{
                appearance:"none", WebkitAppearance:"none",
                padding:"7px 28px 7px 12px", borderRadius:10,
                border:"1px solid #d4dae3", background:"#fff",
                color:"var(--foreground,#131c2e)", fontWeight:700, fontSize:13,
                fontFamily:"var(--font-sans)", cursor:"pointer",
              }}
            >
              {courtOptions.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <span style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"#64748b", fontSize:11 }}>▾</span>
          </div>

          {/* Category chips */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", flex:1 }}>
            {categories.map((c) => {
              const on = activeCats.has(c.id);
              const s = catStyles(c.colorHex);
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCats((prev) => {
                    const next = new Set(prev);
                    if (next.has(c.id) && next.size > 1) next.delete(c.id);
                    else next.add(c.id);
                    return next;
                  })}
                  style={{
                    display:"inline-flex", alignItems:"center", gap:5,
                    padding:"5px 11px 5px 8px", borderRadius:99, cursor:"pointer",
                    border:`1px solid ${on ? s.border : "#e2e8f0"}`,
                    background: on ? s.bg : "#fff",
                    color: on ? s.text : "#94a3b8",
                    fontWeight:700, fontSize:12.5, fontFamily:"var(--font-sans)",
                    opacity: on ? 1 : 0.65, transition:"all .15s",
                  }}
                >
                  <span style={{ width:7, height:7, borderRadius:99, background: on ? s.dot : "#cbd5e1" }} />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards-only: filter tabs */}
        {view === "cards" && (
          <div style={{ display:"flex", gap:6, marginTop:10, paddingTop:10, borderTop:"1px solid #f1f5f9", flexWrap:"wrap" }}>
            {filterTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                style={{
                  padding:"5px 12px", borderRadius:8, border:"none", cursor:"pointer",
                  fontFamily:"var(--font-sans)", fontSize:12.5, fontWeight:700,
                  background: filter === t.key ? "var(--foreground,#131c2e)" : "#f1f5f9",
                  color: filter === t.key ? "#fff" : "#64748b",
                  transition:"all .15s",
                }}
              >{t.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {view === "calendar" ? (
        addRows.length === 0 ? (
          <div style={{ background:"#fff", border:"1px solid #e6eaf0", borderRadius:14, padding:"60px 18px", textAlign:"center", color:"#76869b", fontSize:14 }}>
            Sin partidos programados en este dry run.
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            {visibleCalDates.map((dayKey) => (
              <CalendarDayView
                key={dayKey}
                dayKey={dayKey}
                matches={rows}
                courtNames={allCourtNames}
                activeCats={activeCats}
                courtFilter={courtFilter}
                auditInfo={auditInfo}
              />
            ))}
            {sortedDates.length > calVisible && (
              <div style={{ textAlign:"center" }}>
                <button
                  onClick={() => setCalVisible((n) => n + 6)}
                  style={{
                    display:"inline-flex", alignItems:"center", gap:8,
                    padding:"10px 20px", borderRadius:10, border:"1.5px solid #d4dae3",
                    background:"#fff", fontFamily:"var(--font-sans)",
                    fontWeight:700, fontSize:13, cursor:"pointer", color:"#475569",
                  }}
                >
                  Ver más fechas
                  <span style={{ fontSize:12, color:"#94a3b8" }}>
                    ({sortedDates.length - calVisible} restante{sortedDates.length - calVisible !== 1 ? "s" : ""})
                  </span>
                </button>
              </div>
            )}

            {/* Knockout placeholders */}
            {placeholderRows.length > 0 && (
              <div style={{ background:"#fff", border:"1px solid #e6eaf0", borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid #e6eaf0", display:"flex", alignItems:"center", gap:8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
                  </svg>
                  <span style={{ fontWeight:800, fontSize:14 }}>Llaves / Playoffs</span>
                  <span style={{ fontSize:12, color:"#94a3b8", marginLeft:4 }}>{placeholderRows.length} partido{placeholderRows.length !== 1 ? "s" : ""} · pendientes de clasificación</span>
                </div>
                <div style={{ padding:"16px", display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:10 }}>
                  {placeholderRows.filter((r) => activeCats.has(r.categoryId)).map((r) => {
                    const s = catStyles(r.categoryColorHex);
                    return (
                      <div key={r.id} style={{
                        border:`1px dashed ${s.border}`, borderRadius:12,
                        background: s.bg, padding:"12px 14px",
                        display:"flex", flexDirection:"column", gap:6,
                      }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <span style={{ fontSize:11, fontWeight:800, color:s.text, textTransform:"uppercase", letterSpacing:"0.03em" }}>
                            {ROUND_LABELS[r.phase] ?? r.phase}
                          </span>
                          <span style={{ fontSize:10, color:"#94a3b8" }}>M{r.roundIndex + 1}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, color:"#94a3b8" }}>
                          <span style={{ fontWeight:700, fontSize:13, flex:1, fontStyle:"italic" }}>TBD</span>
                          <span style={{ fontSize:10, fontWeight:800, padding:"1px 6px", borderRadius:6, background:"#f1f5f9", color:"#94a3b8" }}>vs</span>
                          <span style={{ fontWeight:700, fontSize:13, flex:1, textAlign:"right", fontStyle:"italic" }}>TBD</span>
                        </div>
                        <div style={{ fontSize:10.5, color:"#94a3b8" }}>
                          <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                            <span style={{ width:6, height:6, borderRadius:99, background:s.dot }} />
                            {r.categoryName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conflicts/warnings below calendar */}
            {(conflictRows.length > 0 || warningRows.length > 0) && (
              <div style={{ background:"#fff", border:"1px solid #e6eaf0", borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid #e6eaf0", fontWeight:800, fontSize:14 }}>
                  Conflictos y advertencias
                </div>
                <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
                  {[...conflictRows, ...warningRows].map((row) => {
                    const isConflict = row.changeType === "conflict";
                    return (
                      <div key={row.id} style={{
                        display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px",
                        borderRadius:10, border:"1px solid #e6eaf0",
                        background: isConflict ? "#fef2f2" : "#fffbeb",
                      }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isConflict ? "#dc2626" : "#d97706"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}>
                          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <p style={{ margin:0, fontSize:13, color:"#475569" }}>{row.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <CardsView rows={rows} filter={filter} auditInfo={auditInfo} />
      )}
    </div>
  );
}

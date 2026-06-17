"use client";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────
export type MatchRow = {
  id: string;
  scheduledDate: string;
  startTime: string | null;
  endTime: string | null;
  homeTeamName: string | null;
  homeClubName: string | null;
  awayTeamName: string | null;
  awayClubName: string | null;
  courtName: string | null;
  categoryId: string;
  categoryName: string | null;
  categoryColorHex: string | null;
  status: string;
  isLocked: boolean;
  phase: string | null;
};
export type CatMeta = { id: string; name: string; colorHex: string | null };
export type VersionMeta = { id: string; versionNumber: number; state: string };

type Props = {
  tournamentId: string;
  tournamentName: string;
  versionId: string;
  versionNumber: number;
  state: string;
  allVersions: VersionMeta[];
  matches: MatchRow[];
  courtNames: string[];
  categories: CatMeta[];
};

// ── Color helpers ──────────────────────────────────────────────────────────
function hexRgb(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}
function catStyles(hex: string | null) {
  const h = hex ?? "#64748b";
  const { r, g, b } = hexRgb(h);
  return {
    bg: `rgba(${r},${g},${b},0.11)`,
    border: `rgba(${r},${g},${b},0.30)`,
    borderLeft: h,
    text: h,
    dot: h,
  };
}

// ── Calendar constants ─────────────────────────────────────────────────────
const SLOT_MIN = 8 * 60;  // 08:00
const SLOT_MAX = 21 * 60; // 21:00
const SLOT_STEP = 30;     // 30-min rows
const ROW_H = 34;         // px per slot

function timeToMins(t: string | null): number {
  if (!t) return SLOT_MIN;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
function toRow(mins: number) {
  return (mins - SLOT_MIN) / SLOT_STEP;
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

const STATE_LABEL: Record<string, string> = {
  draft: "Borrador", published: "Publicado", archived: "Archivado",
};
const STATE_DOT: Record<string, string> = {
  draft: "#94a3b8", published: "#10b981", archived: "#64748b",
};
const STATUS_LABEL: Record<string, string> = {
  scheduled: "Programado", played: "Jugado", forfeit: "Forfeit", cancelled: "Cancelado",
};

// ── Date filter helpers ────────────────────────────────────────────────────
type DateMode = { type: "single"; date: string } | { type: "range"; from: string; to: string } | { type: "all" };

function compactDay(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" });
}

function dateModeSummary(mode: DateMode, allDates: string[]) {
  if (mode.type === "all") {
    const first = compactDay(allDates[0] ?? "");
    const last = compactDay(allDates[allDates.length - 1] ?? "");
    return allDates.length <= 1 ? first : `${first} – ${last}`;
  }
  if (mode.type === "single") return compactDay(mode.date);
  return `${compactDay(mode.from)} → ${compactDay(mode.to)}`;
}

function filterDatesByMode(allDates: string[], mode: DateMode): string[] {
  if (mode.type === "all") return allDates;
  if (mode.type === "single") return [mode.date];
  return allDates.filter((d) => d >= mode.from && d <= mode.to);
}

function DateFilter({ allDates, mode, onChange }: {
  allDates: string[];
  mode: DateMode;
  onChange: (m: DateMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const rangeFrom = mode.type === "range" ? mode.from : (mode.type === "single" ? mode.date : allDates[0] ?? "");
  const rangeTo   = mode.type === "range" ? mode.to   : (mode.type === "single" ? mode.date : allDates[allDates.length - 1] ?? "");

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px",
          borderRadius: 10, border: `1.5px solid ${open ? "#0d9488" : "#d4dae3"}`,
          background: "#fff", fontFamily: "var(--font-sans)",
          fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#131c2e",
          boxShadow: open ? "0 0 0 3px rgba(13,148,136,.12)" : "none",
          transition: "all .15s",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#0d9488" }}>
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {dateModeSummary(mode, allDates)}
        <span style={{ color: "#94a3b8", fontSize: 11 }}>▾</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50,
          background: "#fff", border: "1px solid #e6eaf0",
          borderRadius: 14, padding: "16px 0 8px", width: 320,
          boxShadow: "0 8px 32px rgba(15,23,42,.12), 0 2px 8px rgba(15,23,42,.08)",
        }}>
          {/* Single day section */}
          <div style={{ padding: "0 16px 8px" }}>
            <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "#76869b", marginBottom: 6 }}>
              Ver un día
            </p>
            <div style={{ maxHeight: 160, overflowY: "auto" }}>
              {allDates.map((d) => {
                const selected = mode.type === "single" && mode.date === d;
                const dt = new Date(d + "T12:00:00");
                const wday = dt.toLocaleDateString("es-EC", { weekday: "long" });
                const dnum = dt.toLocaleDateString("es-EC", { day: "numeric", month: "short" });
                return (
                  <button
                    key={d}
                    onClick={() => { onChange({ type: "single", date: d }); setOpen(false); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "9px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                      background: selected ? "#dcf6f1" : "transparent",
                      color: selected ? "#0f766e" : "#131c2e",
                      fontFamily: "var(--font-sans)", fontWeight: selected ? 700 : 500, fontSize: 13.5,
                      textAlign: "left", transition: "background .1s",
                      textTransform: "capitalize",
                    }}
                    onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "#f8fafc"; }}
                    onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span>{wday} <span style={{ color: "#76869b", fontWeight: 400 }}>{dnum}</span></span>
                    {selected && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ height: 1, background: "#e6eaf0", margin: "8px 0" }} />

          {/* Range section */}
          <div style={{ padding: "8px 16px" }}>
            <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "#76869b", marginBottom: 10 }}>
              Rango de fechas
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: "#76869b", fontWeight: 600, marginBottom: 4 }}>Desde</p>
                <select
                  value={rangeFrom}
                  onChange={(e) => onChange({ type: "range", from: e.target.value, to: rangeTo >= e.target.value ? rangeTo : e.target.value })}
                  style={{ width: "100%", fontSize: 12.5, fontWeight: 600, padding: "7px 10px", borderRadius: 8, border: "1px solid #d4dae3", background: "#fff", fontFamily: "var(--font-sans)", cursor: "pointer", appearance: "none" }}
                >
                  {allDates.map((d) => <option key={d} value={d}>{compactDay(d)}</option>)}
                </select>
              </div>
              <span style={{ color: "#94a3b8", fontSize: 16, marginTop: 16 }}>→</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: "#76869b", fontWeight: 600, marginBottom: 4 }}>Hasta</p>
                <select
                  value={rangeTo}
                  onChange={(e) => onChange({ type: "range", from: rangeFrom, to: e.target.value })}
                  style={{ width: "100%", fontSize: 12.5, fontWeight: 600, padding: "7px 10px", borderRadius: 8, border: "1px solid #d4dae3", background: "#fff", fontFamily: "var(--font-sans)", cursor: "pointer", appearance: "none" }}
                >
                  {allDates.filter((d) => d >= rangeFrom).map((d) => <option key={d} value={d}>{compactDay(d)}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "#e6eaf0", margin: "8px 0" }} />

          {/* Full tournament */}
          <div style={{ padding: "4px 16px 8px" }}>
            <button
              onClick={() => { onChange({ type: "all" }); setOpen(false); }}
              style={{
                width: "100%", padding: "11px", borderRadius: 9, border: "none", cursor: "pointer",
                background: mode.type === "all" ? "#dcf6f1" : "#f8fafc",
                color: mode.type === "all" ? "#0f766e" : "#131c2e",
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13.5, transition: "background .1s",
              }}
              onMouseEnter={(e) => { if (mode.type !== "all") e.currentTarget.style.background = "#f1f5f9"; }}
              onMouseLeave={(e) => { if (mode.type !== "all") e.currentTarget.style.background = "#f8fafc"; }}
            >
              Todo el torneo · {compactDay(allDates[0] ?? "")} – {compactDay(allDates[allDates.length - 1] ?? "")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SegTabs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const tabs = [
    { id: "calendar", label: "Calendario", icon: "⊞" },
    { id: "cards", label: "Tarjetas por fecha", icon: "≡" },
  ];
  return (
    <div style={{ display: "inline-flex", background: "var(--muted,#f1f5f9)", borderRadius: 10, padding: 3, gap: 2 }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700,
            background: value === t.id ? "#fff" : "transparent",
            color: value === t.id ? "var(--foreground,#131c2e)" : "#64748b",
            boxShadow: value === t.id ? "0 1px 3px rgba(15,23,42,.10)" : "none",
            transition: "all .15s",
          }}
        >{t.label}</button>
      ))}
    </div>
  );
}

function MiniSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none", WebkitAppearance: "none",
          padding: "8px 28px 8px 12px", borderRadius: 10,
          border: "1px solid #d4dae3", background: "#fff",
          color: "var(--foreground,#131c2e)", fontWeight: 700, fontSize: 13,
          fontFamily: "var(--font-sans)", cursor: "pointer",
        }}
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748b", fontSize: 11 }}>▾</span>
    </div>
  );
}

function CatChips({ cats, active, onToggle }: {
  cats: CatMeta[];
  active: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {cats.map((c) => {
        const on = active.has(c.id);
        const s = catStyles(c.colorHex);
        return (
          <button
            key={c.id}
            onClick={() => onToggle(c.id)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 11px 5px 9px", borderRadius: 99, cursor: "pointer",
              border: `1px solid ${on ? s.border : "#e2e8f0"}`,
              background: on ? s.bg : "#fff",
              color: on ? s.text : "#94a3b8",
              fontWeight: 700, fontSize: 12.5, fontFamily: "var(--font-sans)",
              opacity: on ? 1 : 0.7, transition: "all .15s",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 99, background: on ? s.dot : "#cbd5e1" }} />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

function StatePill({ state }: { state: string }) {
  const label = STATE_LABEL[state] ?? state;
  const dot = STATE_DOT[state] ?? "#94a3b8";
  const bg = state === "published" ? "#d6f3e6" : state === "draft" ? "#f1f5f9" : "#e9edf2";
  const color = state === "published" ? "#047857" : state === "draft" ? "#475569" : "#64748b";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 11px 3px 8px", borderRadius: 99,
      background: bg, color, fontSize: 12, fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: dot }} />
      {label}
    </span>
  );
}

// ── Calendar View ──────────────────────────────────────────────────────────
function CalendarView({ dayKey, matches, courtNames, activeCats, courtFilter, activeClub }: {
  dayKey: string;
  matches: MatchRow[];
  courtNames: string[];
  activeCats: Set<string>;
  courtFilter: string;
  activeClub: string;
}) {
  const visibleCourts = courtFilter === "all"
    ? courtNames
    : courtNames.filter((c) => c === courtFilter);

  const dayMatches = matches.filter(
    (m) => m.scheduledDate === dayKey &&
      activeCats.has(m.categoryId) &&
      (courtFilter === "all" || m.courtName === courtFilter) &&
      (activeClub === "all" || m.homeClubName === activeClub || m.awayClubName === activeClub)
  );

  // Compute slot range from actual match times
  const allMins = dayMatches.flatMap((m) => [
    timeToMins(m.startTime),
    m.endTime ? timeToMins(m.endTime) : timeToMins(m.startTime) + 60,
  ]);
  const slotStart = allMins.length ? Math.max(SLOT_MIN, Math.floor((Math.min(...allMins) - 30) / 60) * 60) : SLOT_MIN;
  const slotEnd   = allMins.length ? Math.min(SLOT_MAX, Math.ceil((Math.max(...allMins) + 60) / 60) * 60) : 20 * 60;

  const slots: number[] = [];
  for (let m = slotStart; m < slotEnd; m += SLOT_STEP) slots.push(m);

  function toTop(mins: number) {
    return ((mins - slotStart) / SLOT_STEP) * ROW_H;
  }
  function toPx(durationMins: number) {
    return (durationMins / SLOT_STEP) * ROW_H;
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14, overflow: "hidden" }}>
      {/* Date header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #e6eaf0" }}>
        <div style={{ fontWeight: 800, fontSize: 15.5, fontFamily: "var(--font-sans)", textTransform: "capitalize" }}>
          {fmtDate(dayKey)}
        </div>
        <div style={{ fontSize: 12, color: "#76869b", fontWeight: 600 }}>
          {dayMatches.length} partido{dayMatches.length !== 1 ? "s" : ""} · cuadrícula 30 min
        </div>
      </div>

      {/* Grid */}
      <div style={{ overflowX: "auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `60px repeat(${visibleCourts.length}, minmax(160px, 1fr))`,
          minWidth: 500,
        }}>
          {/* Header row */}
          <div style={{ borderBottom: "1px solid #e6eaf0", borderRight: "1px solid #e6eaf0", height: 42 }} />
          {visibleCourts.map((c) => (
            <div key={c} style={{
              padding: "11px 12px", borderBottom: "1px solid #e6eaf0", borderRight: "1px solid #e6eaf0",
              fontWeight: 800, fontSize: 12.5, display: "flex", alignItems: "center", gap: 6,
              fontFamily: "var(--font-sans)",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#0d9488" }}>
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              {c}
            </div>
          ))}

          {/* Time column */}
          <div style={{ position: "relative", borderRight: "1px solid #e6eaf0" }}>
            {slots.map((s, i) => {
              const isHour = s % 60 === 0;
              const hh = Math.floor(s / 60).toString().padStart(2, "0");
              return (
                <div key={s} style={{
                  height: ROW_H,
                  borderBottom: isHour ? "1px solid #e6eaf0" : "1px dashed #e6eaf0",
                  position: "relative",
                }}>
                  {isHour && (
                    <span style={{
                      position: "absolute", top: -9, right: 8, fontSize: 11,
                      color: "#76869b", fontWeight: 600, fontFamily: "var(--font-mono)",
                      background: "#fff", padding: "0 2px",
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
              <div key={courtName} style={{ position: "relative", borderRight: "1px solid #e6eaf0" }}>
                {slots.map((s, i) => (
                  <div key={s} style={{
                    height: ROW_H,
                    borderBottom: s % 60 === 0 ? "1px solid #e6eaf0" : "1px dashed #e6eaf0",
                  }} />
                ))}
                {courtMatches.map((m) => {
                  const startMins = timeToMins(m.startTime);
                  const endMins = m.endTime ? timeToMins(m.endTime) : startMins + 60;
                  const top = toTop(startMins);
                  const height = Math.max(ROW_H - 4, toPx(endMins - startMins) - 4);
                  const s = catStyles(m.categoryColorHex);
                  return (
                    <div key={m.id} style={{
                      position: "absolute",
                      top: top + 2,
                      left: 5, right: 5,
                      height,
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      borderLeft: `3px solid ${s.borderLeft}`,
                      borderRadius: 8,
                      padding: "5px 8px",
                      overflow: "hidden",
                      cursor: "pointer",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 700, color: s.text }}>
                          {fmtTime(m.startTime)}
                        </span>
                        <span style={{ display: "flex", gap: 3 }}>
                          {m.isLocked && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={s.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
                            </svg>
                          )}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#131c2e", lineHeight: 1.3, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {m.homeTeamName ?? "—"}
                      </div>
                      <div style={{ fontSize: 10.5, color: "#475569", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        vs {m.awayTeamName ?? "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Cards View ─────────────────────────────────────────────────────────────
function CardsView({ dates, matches, activeCats, courtFilter, activeClub, tournamentId, versionId }: {
  dates: string[];
  matches: MatchRow[];
  activeCats: Set<string>;
  courtFilter: string;
  activeClub: string;
  tournamentId: string;
  versionId: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {dates.map((dateKey) => {
        const rows = matches.filter(
          (m) => m.scheduledDate === dateKey &&
            activeCats.has(m.categoryId) &&
            (courtFilter === "all" || m.courtName === courtFilter) &&
            (activeClub === "all" || m.homeClubName === activeClub || m.awayClubName === activeClub)
        ).sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));

        if (rows.length === 0) return null;
        return (
          <div key={dateKey} style={{ background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14, overflow: "hidden" }}>
            {/* Card header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #e6eaf0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 9, background: "#dcf6f1", color: "#0f766e",
                  display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13,
                  fontFamily: "var(--font-mono)",
                }}>
                  {new Date(dateKey + "T12:00:00").getDate()}
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -.2, textTransform: "capitalize" }}>
                    {fmtDate(dateKey)}
                  </div>
                  <div style={{ fontSize: 12, color: "#76869b" }}>{rows.length} partido{rows.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
            </div>

            {/* Column headers */}
            <div style={{
              display: "grid", gridTemplateColumns: "68px 140px 1fr 118px 120px",
              padding: "8px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: .6, color: "#76869b", borderBottom: "1px solid #e6eaf0",
            }}>
              <div>Hora</div><div>Cancha</div><div>Partido</div><div>Categoría</div>
              <div style={{ textAlign: "right" }}>Estado</div>
            </div>

            {/* Match rows */}
            {rows.map((m, i) => {
              const s = catStyles(m.categoryColorHex);
              return (
                <div
                  key={m.id}
                  style={{
                    display: "grid", gridTemplateColumns: "68px 140px 1fr 118px 120px",
                    alignItems: "center", padding: "12px 18px",
                    borderBottom: i < rows.length - 1 ? "1px solid #e6eaf0" : "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13.5 }}>
                    {fmtTime(m.startTime)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", fontWeight: 600 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#94a3b8", flexShrink: 0 }}>
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="2.5" />
                    </svg>
                    {m.courtName ?? "—"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13.5 }}>
                    {m.isLocked && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                    )}
                    {m.homeTeamName ?? "—"}
                    <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: 12 }}>vs</span>
                    {m.awayTeamName ?? "—"}
                  </div>
                  <div>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "3px 10px 3px 8px", borderRadius: 99,
                      background: s.bg, color: s.text,
                      border: `1px solid ${s.border}`,
                      fontSize: 12, fontWeight: 700,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: s.dot }} />
                      {m.categoryName ?? "—"}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function FixtureViewerClient({
  tournamentId, tournamentName, versionId, versionNumber, state,
  allVersions, matches, courtNames, categories,
}: Props) {
  const router = useRouter();

  const [view, setView] = useState<"calendar" | "cards">("calendar");
  const [activeCats, setActiveCats] = useState<Set<string>>(() => new Set(categories.map((c) => c.id)));
  const [courtFilter, setCourtFilter] = useState("all");
  const [activeClub, setActiveClub] = useState("all");

  const sortedDates = useMemo(() => {
    const all = [...new Set(matches.map((m) => m.scheduledDate))].sort();
    return all;
  }, [matches]);

  const [dateMode, setDateMode] = useState<DateMode>(() =>
    sortedDates.length > 0 ? { type: "single", date: sortedDates[0] } : { type: "all" }
  );
  const [calendarVisible, setCalendarVisible] = useState(4);

  const visibleDates = useMemo(() => filterDatesByMode(sortedDates, dateMode), [sortedDates, dateMode]);

  useEffect(() => { setCalendarVisible(4); }, [dateMode]);

  const toggleCat = useCallback((id: string) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(id) && next.size > 1) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const courtOptions = useMemo(() => [
    { v: "all", l: "Todas las canchas" },
    ...courtNames.map((c) => ({ v: c, l: c })),
  ], [courtNames]);

  const allClubs = useMemo(() => {
    const names = matches
      .flatMap((m) => [m.homeClubName, m.awayClubName])
      .filter((n): n is string => !!n);
    return [...new Set(names)].sort();
  }, [matches]);

  const clubOptions = useMemo(() => [
    { v: "all", l: "Todos los clubes" },
    ...allClubs.map((c) => ({ v: c, l: c })),
  ], [allClubs]);

  const versionOptions = allVersions.map((v) => ({
    v: String(v.versionNumber),
    l: `V${v.versionNumber} · ${STATE_LABEL[v.state] ?? v.state}`,
  }));

  return (
    <div style={{ maxWidth: 1380, margin: "0 auto", padding: "24px 24px 48px" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b", marginBottom: 20 }}>
        <Link href="/fixture" style={{ color: "#64748b", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
          Fixtures
        </Link>
        <span>/</span>
        <span style={{ color: "#131c2e", fontWeight: 600 }}>{tournamentName}</span>
      </div>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -.5, fontFamily: "var(--font-sans)" }}>
              {tournamentName}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>Versión V{versionNumber}</span>
            <StatePill state={state} />
            <span style={{ fontSize: 12, color: "#76869b" }}>· solo las fechas publicadas son públicas</span>
            {/* Version switcher */}
            <MiniSelect value={String(versionNumber)} onChange={(v) => {
              router.push(`/fixture/${tournamentId}?v=${v}`);
            }} options={versionOptions} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Link href={`/fixture/${tournamentId}/edit?v=${versionNumber}`} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 10, border: "1px solid #d4dae3", background: "#fff",
            color: "#131c2e", fontWeight: 700, fontSize: 13, textDecoration: "none",
            fontFamily: "var(--font-sans)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
            Edición manual
          </Link>
          <Link href={`/fixture/${tournamentId}/history`} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 10, border: "1px solid #d4dae3", background: "#fff",
            color: "#131c2e", fontWeight: 700, fontSize: 13, textDecoration: "none",
            fontFamily: "var(--font-sans)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v6h6M3.5 9a9 9 0 1 0 2-4.5L3 9M12 7v5l4 2" />
            </svg>
            Historial
          </Link>
          <button style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
            borderRadius: 10, border: "none", background: "#0d9488", color: "#fff",
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Publicar fechas
          </button>
        </div>
      </div>

      {/* Toolbar card */}
      <div style={{
        background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14,
        padding: "12px 16px", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <SegTabs value={view} onChange={(v) => setView(v as "calendar" | "cards")} />
          <div style={{ width: 1, height: 26, background: "#e6eaf0" }} />
          <DateFilter allDates={sortedDates} mode={dateMode} onChange={setDateMode} />
          <MiniSelect value={courtFilter} onChange={setCourtFilter} options={courtOptions} />
          {allClubs.length > 0 && (
            <MiniSelect value={activeClub} onChange={setActiveClub} options={clubOptions} />
          )}
          <div style={{ flex: 1 }} />
          <CatChips cats={categories} active={activeCats} onToggle={toggleCat} />
        </div>
      </div>

      {/* Content */}
      {matches.length === 0 ? (
        <div style={{
          background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14,
          padding: "60px 18px", textAlign: "center", color: "#76869b", fontSize: 14,
        }}>
          Sin partidos en esta versión.
        </div>
      ) : view === "calendar" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {visibleDates.slice(0, calendarVisible).map((dayKey) => (
            <CalendarView
              key={dayKey}
              dayKey={dayKey}
              matches={matches}
              courtNames={courtNames}
              activeCats={activeCats}
              courtFilter={courtFilter}
              activeClub={activeClub}
            />
          ))}
          {visibleDates.length > calendarVisible && (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => setCalendarVisible((n) => n + 4)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", borderRadius: 10, border: "1.5px solid #d4dae3",
                  background: "#fff", fontFamily: "var(--font-sans)",
                  fontWeight: 700, fontSize: 13, cursor: "pointer", color: "#475569",
                }}
              >
                Ver más fechas
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  ({visibleDates.length - calendarVisible} restante{visibleDates.length - calendarVisible !== 1 ? "s" : ""})
                </span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <CardsView
          dates={visibleDates}
          matches={matches}
          activeCats={activeCats}
          courtFilter={courtFilter}
          activeClub={activeClub}
          tournamentId={tournamentId}
          versionId={versionId}
        />
      )}
    </div>
  );
}

/* ===========================================================
   fixtureOS — Context Management module: shared components + data
   Rules-engine UI primitives. Exposed on window.
   =========================================================== */

/* ---------------- Scopes & constraint hierarchy ---------------- */
const CTX_SCOPES = {
  org:        { id: "org",        label: "Organización", icon: "building", tone: "#64748b", screen: "ctxorg" },
  tournament: { id: "tournament", label: "Torneo",       icon: "trophy",   tone: "var(--accent)", screen: "ctxtournament" },
  category:   { id: "category",   label: "Categoría",    icon: "layers",   tone: "#8b5cf6", screen: "ctxcategory" },
  date:       { id: "date",       label: "Fecha",        icon: "calendar", tone: "#2563eb", screen: "ctxdate" },
};

// Highest priority first (wins conflicts)
const CONSTRAINT_HIERARCHY = [
  { lvl: 1, label: "Partidos pasados bloqueados", icon: "lock", note: "Inmutables · ya jugados o publicados", system: true },
  { lvl: 2, label: "Overrides manuales", icon: "edit", note: "Ediciones manuales del organizador", system: true },
  { lvl: 3, label: "Contexto de Fecha", icon: "calendar", scope: "date" },
  { lvl: 4, label: "Contexto de Categoría", icon: "layers", scope: "category" },
  { lvl: 5, label: "Contexto de Torneo", icon: "trophy", scope: "tournament" },
  { lvl: 6, label: "Contexto de Organización", icon: "building", scope: "org" },
  { lvl: 7, label: "Valores del sistema", icon: "settings", note: "Defaults base", system: true },
];

/* ---------------- Rule type styling ---------------- */
const RULE_TYPE = {
  duracion:     { label: "Duración",      icon: "clock",    tone: "var(--info)" },
  disponibilidad:{ label: "Disponibilidad",icon: "calendar", tone: "var(--info)" },
  canchas:      { label: "Canchas",       icon: "pin",      tone: "var(--accent)" },
  prioridad:    { label: "Prioridad",     icon: "flag",     tone: "var(--accent)" },
  agrupacion:   { label: "Agrupación",    icon: "users",    tone: "var(--cat-cia-dot)" },
  restriccion:  { label: "Restricción",   icon: "lock",     tone: "var(--warn)" },
  horario:      { label: "Horario",       icon: "clock",    tone: "var(--info)" },
  modo:         { label: "Modo de juego", icon: "layers",   tone: "var(--cat-vio-dot)" },
};

/* ---------------- Active rules per scope ---------------- */
const CTX_RULES = {
  org: [
    { type: "duracion", text: "Duración por defecto de partido: 60 minutos", src: "org" },
    { type: "disponibilidad", text: "Días de juego: viernes, sábado y domingo", src: "org" },
    { type: "horario", text: "Horario general: 08:00 – 21:00", src: "org" },
    { type: "canchas", text: "Canchas permitidas: Central, Norte, Sur, Polideportivo", src: "org" },
    { type: "agrupacion", text: "Agrupación de clubes: activada (suave)", src: "org" },
    { type: "prioridad", text: "Prioridad: todas las categorías iguales", src: "org" },
  ],
  tournament: [
    { type: "canchas", text: "Los domingos solo Cancha Central y Norte", src: "tournament" },
    { type: "restriccion", text: "Cancha Sur cerrada el domingo por mantenimiento", src: "tournament" },
    { type: "prioridad", text: "Prioridad a categorías menores en horarios tempranos", src: "tournament" },
    { type: "restriccion", text: "Sin partidos antes de las 09:00", src: "tournament" },
    { type: "horario", text: "Descanso mínimo 90 min entre partidos del mismo equipo", src: "tournament" },
  ],
  category: [
    { type: "modo", text: "U16: doble round robin", src: "category" },
    { type: "duracion", text: "Duración U16: 75 minutos", src: "category" },
    { type: "restriccion", text: "Descanso mínimo 90 min entre partidos U16", src: "category" },
  ],
  date: [
    { type: "restriccion", text: "Spartans U16 no puede jugar antes de las 11:00", src: "date" },
    { type: "restriccion", text: "Cancha Sur no disponible después de las 18:00", src: "date" },
    { type: "horario", text: "Cruce U14 solo después de las 14:00", src: "date" },
  ],
};

/* Inherited stack shown on tournament/category/date editors */
const CTX_INHERITED = {
  tournament: [
    { type: "duracion", text: "Duración por defecto: 60 min", from: "org" },
    { type: "canchas", text: "Canchas: Central, Norte, Sur, Polideportivo", from: "org" },
    { type: "disponibilidad", text: "Días de juego: Vie–Dom", from: "org" },
  ],
  category: [
    { type: "duracion", text: "Duración por defecto: 60 min", from: "org" },
    { type: "canchas", text: "Domingos solo Central y Norte", from: "tournament" },
    { type: "restriccion", text: "Sin partidos antes de 09:00", from: "tournament" },
  ],
  date: [
    { type: "canchas", text: "Domingos solo Central y Norte", from: "tournament" },
    { type: "restriccion", text: "Sin partidos antes de 09:00", from: "tournament" },
    { type: "duracion", text: "Duración U16: 75 min", from: "category" },
  ],
};

/* Per-scope rule counts + meta for dashboard */
const CTX_LAYERS = [
  { scope: "org", rules: 12, updated: "Ayer · 09:10", conflicts: 0 },
  { scope: "tournament", rules: 8, updated: "Hoy · 11:40", conflicts: 1 },
  { scope: "category", rules: 23, updated: "Hoy · 13:05", conflicts: 2 },
  { scope: "date", rules: 14, updated: "Hoy · 14:02", conflicts: 0 },
];

/* Context version history (newest first) */
const CTX_VERSIONS = [
  { v: "CV12", scope: "date", target: "Sáb 12 Jul", by: "Admin", date: "Hoy · 14:02", summary: "Añadió restricciones de cancha y equipo", current: true },
  { v: "CV11", scope: "category", target: "U16", by: "Admin", date: "Hoy · 13:05", summary: "Definió modo de juego (doble round robin)" },
  { v: "CV10", scope: "tournament", target: "Copa Apertura 2026", by: "M. Vera", date: "Hoy · 11:40", summary: "Cancha Sur cerrada el domingo" },
  { v: "CV9", scope: "category", target: "Senior", by: "Admin", date: "Ayer · 17:20", summary: "Prioridad Senior 100" },
  { v: "CV8", scope: "org", target: "Quito Basket Liga", by: "Admin", date: "Ayer · 09:10", summary: "Agrupación de clubes activada" },
  { v: "CV7", scope: "tournament", target: "Copa Apertura 2026", by: "Admin", date: "08 Jul · 16:30", summary: "Prioridad a categorías menores" },
];

/* Recent context changes (dashboard feed) */
const CTX_RECENT = [
  { date: "Hoy · 14:02", user: "Admin", scope: "date", summary: "Restricciones para el Sáb 12 Jul", ver: "CV12" },
  { date: "Hoy · 13:05", user: "Admin", scope: "category", summary: "Modo de juego U16 confirmado", ver: "CV11" },
  { date: "Hoy · 11:40", user: "M. Vera", scope: "tournament", summary: "Cancha Sur cerrada domingo", ver: "CV10" },
  { date: "Ayer · 17:20", user: "Admin", scope: "category", summary: "Prioridad Senior elevada", ver: "CV9" },
];

/* Context compare diff (CV10 → CV12) */
const CTX_DIFF = [
  { type: "changed", rt: "duracion", before: "60 min", after: "75 min", impact: "Afecta U16", sev: "warn" },
  { type: "changed", rt: "canchas", before: "Central, Norte, Sur", after: "Solo Central, Norte", impact: "Mueve 6 partidos", sev: "warn" },
  { type: "added", rt: "restriccion", before: "—", after: "Spartans U16 no antes de 11:00", impact: "Mueve 2 partidos", sev: "info" },
  { type: "added", rt: "restriccion", before: "—", after: "Cancha Sur no disp. tras 18:00", impact: "Sin partidos afectados", sev: "info" },
  { type: "added", rt: "horario", before: "—", after: "Cruce U14 solo tras 14:00", impact: "Mueve 1 partido", sev: "info" },
  { type: "removed", rt: "prioridad", before: "Prioridad U18 alta", after: "—", impact: "Reordena 3 partidos", sev: "info" },
];

/* Impact simulator data */
const CTX_IMPACT = {
  change: "Torneo · Copa Apertura 2026 · CV4 → CV5",
  summary: { versions: 1, categories: 4, moved: 18, forfeits: 0, overrides: 3, locked: 42, warnings: 5, conflicts: 1 },
  cats: [
    { cat: "u16", impact: "8 partidos movidos", sev: "warn", detail: "Cancha Sur cerrada domingo" },
    { cat: "u14", impact: "Cruce reprogramado", sev: "info", detail: "Solo después de 14:00" },
    { cat: "senior", impact: "Prioridad cambiada", sev: "info", detail: "Senior 100" },
    { cat: "u18", impact: "3 partidos reordenados", sev: "info", detail: "Prioridad menores" },
  ],
  dates: [
    { key: "2026-07-12", label: "Sáb 12 Jul", added: 0, moved: 6, conflicts: 1 },
    { key: "2026-07-13", label: "Dom 13 Jul", added: 2, moved: 4, conflicts: 0 },
    { key: "2026-07-11", label: "Vie 11 Jul", added: 0, moved: 2, conflicts: 0 },
  ],
};

/* Prompt example chips per scope */
const CTX_EXAMPLES = {
  org: ["Todos los torneos usan Cancha Central y Norte.", "Los partidos van de viernes a domingo, 08:00 a 21:00.", "Agrupa los equipos del mismo club."],
  tournament: ["Solo Cancha Central los domingos.", "Sin partidos el 20 y 21 de julio.", "Prioridad Senior 100."],
  category: ["U16 empieza el 11 de julio. Doble round robin, partidos de 75 minutos.", "Top 2 de cada grupo avanzan a semifinales."],
  date: ["Spartans U16 no juega antes de las 11:00.", "Cancha Sur no disponible después de las 18:00.", "El cruce U14 solo después de las 14:00."],
};

/* Game mode (Category Context — U16) */
const GAME_MODE = {
  groups: 2, rounds: 1, classify: "Top 2 por grupo", playoffs: ["Semifinal", "Final"], duration: 75,
  groupA: ["Spartans BC", "Leones del Valle", "Andes Basket", "Águilas Doradas"],
  groupB: ["Titanes", "Halcones", "Pumas Quito", "Cóndores Andinos"],
};

/* =========================================================
   Components
   ========================================================= */

function CtxScopeBadge({ scope, size = "md" }) {
  const s = CTX_SCOPES[scope];
  if (!s) return null;
  const fs = size === "sm" ? 11.5 : 12.5;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: size === "sm" ? "2px 9px 2px 7px" : "3px 11px 3px 8px", borderRadius: 999, background: `color-mix(in srgb, ${s.tone} 12%, transparent)`, color: s.tone, border: `1px solid color-mix(in srgb, ${s.tone} 30%, transparent)`, fontSize: fs, fontWeight: 700, whiteSpace: "nowrap" }}>
      <Icon name={s.icon} size={fs} sw={2.1} />{s.label}
    </span>
  );
}

function InheritedTag({ from }) {
  const s = CTX_SCOPES[from];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--text-mute)", padding: "2px 7px", borderRadius: 99, background: "var(--ink-100)" }}>
      <Icon name="arrowdown" size={11} sw={2.3} /> Heredada · {s ? s.label : from}
    </span>
  );
}
function OverrideTag() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--accent-strong)", padding: "2px 7px", borderRadius: 99, background: "var(--accent-soft)", border: "1px solid var(--accent-soft-2)" }}>
      <Icon name="edit" size={11} sw={2.3} /> Sobrescritura
    </span>
  );
}

function ActiveRuleCard({ rule, inherited }) {
  const rt = RULE_TYPE[rule.type] || RULE_TYPE.restriccion;
  return (
    <div style={{ display: "flex", gap: 11, padding: "11px 13px", borderRadius: 11, background: "var(--surface-2)", border: "1px solid var(--line)", borderLeft: `3px solid ${rt.tone}` }}>
      <span style={{ width: 26, height: 26, borderRadius: 7, background: `color-mix(in srgb, ${rt.tone} 13%, transparent)`, color: rt.tone, display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={rt.icon} size={14} sw={2.1} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: .5, color: rt.tone }}>{rt.label}</span>
          {inherited ? <InheritedTag from={rule.from} /> : null}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>{rule.text}</div>
      </div>
    </div>
  );
}

function RuleConflictWarning({ children }) {
  return (
    <div style={{ display: "flex", gap: 11, padding: "12px 14px", borderRadius: 11, background: "var(--crit-bg)", border: "1px solid var(--crit-line)" }}>
      <Icon name="alert" size={18} style={{ color: "var(--crit)", flex: "0 0 auto", marginTop: 1 }} />
      <div style={{ fontSize: 12.5, color: "var(--text-soft)", lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

function PromptExamples({ scope, onPick }) {
  const items = CTX_EXAMPLES[scope] || [];
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", marginBottom: 8 }}>Ejemplos</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {items.map((ex, i) => (
          <button key={i} onClick={() => onPick && onPick(ex)} style={{ textAlign: "left", padding: "7px 11px", borderRadius: 99, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text-soft)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="plus" size={12} style={{ color: "var(--accent)", flex: "0 0 auto" }} sw={2.4} />{ex}
          </button>
        ))}
      </div>
    </div>
  );
}

function ParsedGroup({ title, icon, tone, items }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ width: 23, height: 23, borderRadius: 7, background: `color-mix(in srgb, ${tone} 13%, transparent)`, color: tone, display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={icon} size={13} sw={2.2} /></span>
        <span style={{ fontWeight: 800, fontSize: 13 }}>{title}</span>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--text-mute)", fontWeight: 700 }}>{items.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 9, padding: "8px 11px", borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 12.5, color: "var(--text-soft)", lineHeight: 1.4 }}>
            <Icon name={tone === "var(--warn)" ? "alert" : "check"} size={14} style={{ color: tone, flex: "0 0 auto", marginTop: 1 }} sw={2.3} />{it}
          </div>
        ))}
      </div>
    </div>
  );
}

function RuleDiffRow({ row }) {
  const map = { added: { t: "var(--ok)", bg: "var(--ok-bg)", ln: "var(--ok-line)", lb: "Añadida", ic: "plus" }, changed: { t: "var(--info)", bg: "var(--info-bg)", ln: "var(--info-bg2)", lb: "Cambiada", ic: "swap" }, removed: { t: "var(--text-mute)", bg: "var(--ink-100)", ln: "var(--line)", lb: "Eliminada", ic: "x" } };
  const T = map[row.type] || map.changed;
  const rt = RULE_TYPE[row.rt] || RULE_TYPE.restriccion;
  const sev = row.sev === "warn" ? "var(--warn)" : "var(--info)";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 0, padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 99, background: T.bg, color: T.t, border: `1px solid ${T.ln}`, fontSize: 11, fontWeight: 800 }}><Icon name={T.ic} size={11} sw={2.4} />{T.lb}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: rt.tone }}>{rt.label}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: sev }}><Icon name={row.sev === "warn" ? "alert" : "check"} size={12} sw={2.3} />{row.impact}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ flex: "1 1 180px", fontSize: 12.5, fontWeight: 600, color: "var(--text-mute)", padding: "8px 11px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", textDecoration: row.type === "removed" ? "line-through" : "none" }}>{row.before}</span>
        <Icon name="arrowright" size={15} style={{ color: T.t, flex: "0 0 auto" }} />
        <span style={{ flex: "1 1 180px", fontSize: 12.5, fontWeight: 700, color: row.type === "removed" ? "var(--text-mute)" : "var(--text)", padding: "8px 11px", borderRadius: 8, background: T.bg, border: `1px solid ${T.ln}` }}>{row.after}</span>
      </div>
    </div>
  );
}

function ConstraintHierarchy({ active }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 12, color: "var(--text-mute)", fontWeight: 700 }}>
        <Icon name="arrowup" size={13} /> Mayor prioridad
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {CONSTRAINT_HIERARCHY.map((h) => {
          const on = active && h.scope === active;
          const tone = h.scope ? CTX_SCOPES[h.scope].tone : "var(--text-mute)";
          return (
            <div key={h.lvl} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", borderRadius: 9, border: `1px solid ${on ? tone : "var(--line)"}`, background: on ? `color-mix(in srgb, ${tone} 9%, transparent)` : h.system ? "var(--surface-2)" : "var(--surface)" }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 800, color: "var(--text-mute)", width: 16, flex: "0 0 auto" }}>{h.lvl}</span>
              <span style={{ width: 24, height: 24, borderRadius: 7, background: on ? tone : "var(--ink-100)", color: on ? "#fff" : (h.scope ? tone : "var(--text-mute)"), display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={h.icon} size={13} sw={2.1} /></span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: on ? 800 : 700, color: "var(--text)" }}>{h.label}</div>
                {h.note && <div style={{ fontSize: 11, color: "var(--text-mute)" }}>{h.note}</div>}
              </div>
              {on && <span style={{ fontSize: 10.5, fontWeight: 800, color: tone, textTransform: "uppercase", letterSpacing: .5 }}>Aquí</span>}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 12, color: "var(--text-mute)", fontWeight: 700 }}>
        <Icon name="arrowdown" size={13} /> Menor prioridad
      </div>
    </div>
  );
}

function ImpactCards({ summary, compact }) {
  const cards = [
    ["Versiones afectadas", summary.versions, "branch", "var(--info)"],
    ["Categorías", summary.categories, "layers", "var(--accent)"],
    ["Partidos movidos", summary.moved, "swap", "var(--info)"],
    ["Forfeits potenciales", summary.forfeits, "flag", "var(--warn)"],
    ["Overrides preservados", summary.overrides, "edit", "var(--ok)"],
    ["Partidos bloqueados", summary.locked, "lock", "var(--text-mute)"],
    ["Advertencias", summary.warnings, "alert", "var(--warn)"],
    ["Conflictos", summary.conflicts, "alert", "var(--crit)"],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${compact ? 150 : 170}px, 1fr))`, gap: 11 }}>
      {cards.map(([l, v, ic, tone]) => (
        <div key={l} style={{ padding: "13px 15px", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: `color-mix(in srgb, ${tone} 13%, transparent)`, color: tone, display: "grid", placeItems: "center" }}><Icon name={ic} size={14} sw={2.1} /></span>
            <span className="mono tnum" style={{ fontSize: 23, fontWeight: 700, letterSpacing: -1, color: tone }}>{v}</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", marginTop: 8 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function EligibilityPanel({ startDate, gameMode, teams, eligible }) {
  const Row = ({ ok, label, value }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: "1px solid var(--line)" }}>
      <Icon name={ok ? "checkcircle" : "x"} size={18} style={{ color: ok ? "var(--ok)" : "var(--crit)", flex: "0 0 auto" }} sw={2.1} />
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-soft)" }}>{label}</span>
      <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: ok ? "var(--text)" : "var(--crit)" }}>{value}</span>
    </div>
  );
  return (
    <div>
      <Row ok={!!startDate} label="Fecha de inicio" value={startDate || "Falta fecha"} />
      <Row ok={!!gameMode} label="Modo de juego" value={gameMode || "Falta modo"} />
      <Row ok label="Equipos inscritos" value={teams} />
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 14, padding: "13px 15px", borderRadius: 12, background: eligible ? "var(--ok-bg)" : "var(--crit-bg)", border: `1px solid ${eligible ? "var(--ok-line)" : "var(--crit-line)"}` }}>
        <Icon name={eligible ? "checkcircle" : "alert"} size={22} style={{ color: eligible ? "var(--ok)" : "var(--crit)", flex: "0 0 auto" }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: eligible ? "var(--ok)" : "var(--crit)" }}>{eligible ? "Categoría elegible" : "No elegible para fixture"}</div>
          <div style={{ fontSize: 12, color: "var(--text-soft)", marginTop: 2 }}>{eligible ? "Se incluirá en la generación del fixture." : "Completa fecha de inicio y modo de juego."}</div>
        </div>
      </div>
    </div>
  );
}

function GameModePreview({ mode }) {
  const Team = ({ name, seed }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--line)" }}>
      <span className="mono" style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", width: 16, flex: "0 0 auto" }}>{seed}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
    </div>
  );
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[["Grupo A", mode.groupA, "A"], ["Grupo B", mode.groupB, "B"]].map(([g, list, k]) => (
          <div key={g} style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", marginBottom: 9 }}>{g}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {list.map((t, i) => <Team key={t} name={t} seed={`${k}${i + 1}`} />)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", marginBottom: 9 }}>Semifinales</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Team name="A1 vs B2" seed="SF1" /><Team name="B1 vs A2" seed="SF2" />
          </div>
        </div>
        <Icon name="arrowright" size={18} style={{ color: "var(--text-mute)" }} />
        <div style={{ background: "linear-gradient(150deg, var(--accent-soft), var(--surface))", border: "1px solid var(--accent-soft-2)", borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--accent-strong)", marginBottom: 9 }}>Final</div>
          <Team name="Ganador SF1 vs SF2" seed="F" />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9, fontSize: 11.5, color: "var(--text-mute)", fontWeight: 700 }}><Icon name="trophy" size={13} style={{ color: "var(--accent)" }} /> Campeón</div>
        </div>
      </div>
    </div>
  );
}

function CtxVersionTimeline({ versions, onCompare }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {versions.map((v, i) => (
        <div key={v.v} style={{ display: "flex", gap: 12, padding: "2px 0" }}>
          <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ width: 11, height: 11, borderRadius: 99, background: v.current ? "var(--accent)" : "var(--ink-300)", marginTop: 5, boxShadow: v.current ? "0 0 0 3px var(--accent-soft)" : "none" }} />
            {i < versions.length - 1 && <span style={{ flex: 1, width: 2, background: "var(--line)", marginTop: 3 }} />}
          </div>
          <div style={{ paddingBottom: 16, minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="mono" style={{ fontWeight: 800, fontSize: 13, color: v.current ? "var(--accent-strong)" : "var(--text)" }}>{v.v}</span>
              <CtxScopeBadge scope={v.scope} size="sm" />
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginTop: 4, lineHeight: 1.4 }}>{v.summary}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-mute)", marginTop: 3 }} className="mono">{v.target} · {v.by} · {v.date}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  CTX_SCOPES, CONSTRAINT_HIERARCHY, RULE_TYPE, CTX_RULES, CTX_INHERITED, CTX_LAYERS,
  CTX_VERSIONS, CTX_RECENT, CTX_DIFF, CTX_IMPACT, CTX_EXAMPLES, GAME_MODE,
  CtxScopeBadge, InheritedTag, OverrideTag, ActiveRuleCard, RuleConflictWarning,
  PromptExamples, ParsedGroup, RuleDiffRow, ConstraintHierarchy, ImpactCards,
  EligibilityPanel, GameModePreview, CtxVersionTimeline,
});

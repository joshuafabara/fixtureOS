/* ===========================================================
   fixtureOS — shared helpers, icon set, sample data
   Exposed on window for all babel scripts.
   =========================================================== */

/* ---------------- Icon set (stroke line icons) ---------------- */
const ICONS = {
  dashboard: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  trophy: "M7 4h10v3a5 5 0 0 1-10 0zM7 4H4v2a3 3 0 0 0 3 3M17 4h3v2a3 3 0 0 1-3 3M9 14.5V17M15 14.5V17M8 21h8M9 17h6l.5 4h-7z",
  whistle: "M9 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM13 11l8-2v-2l-8 1M9 9V6",
  calendar: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 9h16M8 3v4M16 3v4",
  users: "M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 19v-2a4 4 0 0 0-3-3.8M16 2.2A4 4 0 0 1 16 9.8",
  message: "M21 11.5a8 8 0 0 1-11.6 7.1L3 21l2.4-5.4A8 8 0 1 1 21 11.5z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 6.8 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13.5H3a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 4.6V4a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  plus: "M12 5v14M5 12h14",
  chevdown: "M6 9l6 6 6-6",
  chevright: "M9 6l6 6-6 6",
  chevleft: "M15 6l-6 6 6 6",
  arrowup: "M12 19V5M5 12l7-7 7 7",
  arrowdown: "M12 5v14M5 12l7 7 7-7",
  arrowright: "M5 12h14M13 6l6 6-6 6",
  alert: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
  check: "M20 6 9 17l-5-5",
  checkcircle: "M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14.1l-3-3",
  x: "M18 6 6 18M6 6l12 12",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  pin: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  filter: "M22 3H2l8 9.5V19l4 2v-8.5z",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  layers: "M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  swap: "M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4",
  gitcompare: "M18 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 8v8a2 2 0 0 0 2 2h3M18 16V8a2 2 0 0 0-2-2h-3M14 4l-3 2 3 2M10 20l3-2-3-2",
  flag: "M4 22V4M4 15s1.5-1 4-1 4 2 7 2 4-1 4-1V5s-1.5 1-4 1-4-2-7-2-4 1-4 1",
  building: "M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M19 21v-9a1 1 0 0 0-1-1h-3M9 7h2M9 11h2M9 15h2",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  grid2: "M3 3h8v8H3zM13 3h8v8h-8zM13 13h8v8h-8zM3 13h8v8H3z",
  basket: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2v20M4.5 5.5l15 13M19.5 5.5l-15 13",
  zap: "M13 2 3 14h7l-1 8 10-12h-7z",
  history: "M3 3v6h6M3.5 9a9 9 0 1 0 2-4.5L3 9M12 7v5l4 2",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  lock: "M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 8 0v4",
  external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3",
  refresh: "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
  dots6: "M5 4h.01M5 12h.01M5 20h.01M12 4h.01M12 12h.01M12 20h.01",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  sliders: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  branch: "M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM15 6a9 9 0 0 1-9 9",
  scope: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 1 0 20",
};

function Icon({ name, size = 18, sw = 1.9, style, className }) {
  const d = ICONS[name] || ICONS.dashboard;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className} aria-hidden="true">
      {d.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
    </svg>
  );
}

/* ---------------- Categories ---------------- */
const CATS = {
  u12:    { id: "u12",    name: "U12",    key: "azul", short: "U12" },
  u14:    { id: "u14",    name: "U14",    key: "esm",  short: "U14" },
  u16:    { id: "u16",    name: "U16",    key: "vio",  short: "U16" },
  u18:    { id: "u18",    name: "U18",    key: "amb",  short: "U18" },
  sub21:  { id: "sub21",  name: "Sub-21", key: "ros",  short: "S21" },
  senior: { id: "senior", name: "Senior", key: "cia",  short: "SEN" },
};
const CAT_VARS = {
  azul: { t: "var(--cat-azul-t)", bg: "var(--cat-azul-bg)", ln: "var(--cat-azul-ln)", dot: "var(--cat-azul-dot)" },
  esm:  { t: "var(--cat-esm-t)",  bg: "var(--cat-esm-bg)",  ln: "var(--cat-esm-ln)",  dot: "var(--cat-esm-dot)" },
  vio:  { t: "var(--cat-vio-t)",  bg: "var(--cat-vio-bg)",  ln: "var(--cat-vio-ln)",  dot: "var(--cat-vio-dot)" },
  amb:  { t: "var(--cat-amb-t)",  bg: "var(--cat-amb-bg)",  ln: "var(--cat-amb-ln)",  dot: "var(--cat-amb-dot)" },
  ros:  { t: "var(--cat-ros-t)",  bg: "var(--cat-ros-bg)",  ln: "var(--cat-ros-ln)",  dot: "var(--cat-ros-dot)" },
  cia:  { t: "var(--cat-cia-t)",  bg: "var(--cat-cia-bg)",  ln: "var(--cat-cia-ln)",  dot: "var(--cat-cia-dot)" },
};

function CatBadge({ cat, size = "md", solid = false, dot = true }) {
  const c = typeof cat === "string" ? CATS[cat] : cat;
  if (!c) return null;
  const v = CAT_VARS[c.key];
  const pad = size === "sm" ? "2px 8px 2px 7px" : "3px 10px 3px 9px";
  const fs = size === "sm" ? 11.5 : 12.5;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: pad,
      borderRadius: 999, background: v.bg, color: v.t, border: `1px solid ${v.ln}`,
      fontSize: fs, fontWeight: 700, letterSpacing: .2, lineHeight: 1.4, whiteSpace: "nowrap",
    }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: 99, background: v.dot, flex: "0 0 auto" }} />}
      {c.name}
    </span>
  );
}

/* ---------------- Status pill ---------------- */
const STATE_MAP = {
  draft:     { label: "Borrador",  t: "var(--text-soft)", bg: "var(--ink-100)",  ln: "var(--line)" },
  published: { label: "Publicado", t: "var(--ok)",        bg: "var(--ok-bg)",    ln: "var(--ok-line)" },
  archived:  { label: "Archivado", t: "var(--text-mute)", bg: "var(--surface-2)",ln: "var(--line)" },
};
function StatePill({ state, dot = true }) {
  const s = STATE_MAP[state] || STATE_MAP.draft;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 11px 3px 9px",
      borderRadius: 999, background: s.bg, color: s.t, border: `1px solid ${s.ln}`,
      fontSize: 12, fontWeight: 700, letterSpacing: .2, whiteSpace: "nowrap",
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor", opacity: .9 }} />}
      {s.label}
    </span>
  );
}

/* ---------------- Severity tag ---------------- */
const SEV_MAP = {
  info: { label: "Info",        t: "var(--info)", bg: "var(--info-bg)", ln: "var(--info-bg2)", icon: "check" },
  warn: { label: "Advertencia", t: "var(--warn)", bg: "var(--warn-bg)", ln: "var(--warn-line)", icon: "alert" },
  crit: { label: "Conflicto",   t: "var(--crit)", bg: "var(--crit-bg)", ln: "var(--crit-line)", icon: "alert" },
};
function SevTag({ sev, children, size = "md" }) {
  const s = SEV_MAP[sev] || SEV_MAP.info;
  const fs = size === "sm" ? 11 : 12;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: size === "sm" ? "2px 8px" : "3px 10px",
      borderRadius: 999, background: s.bg, color: s.t, border: `1px solid ${s.ln}`,
      fontSize: fs, fontWeight: 700, letterSpacing: .2, whiteSpace: "nowrap",
    }}>
      <Icon name={s.icon} size={fs} sw={2.3} />
      {children || s.label}
    </span>
  );
}

/* ---------------- Sample data (basketball) ---------------- */
const COURTS = ["Cancha Central", "Cancha Norte", "Cancha Sur", "Polideportivo"];

const CLUBS = [
  { id: "spa", name: "Spartans BC",     cats: ["u12","u14","u16"], contact: "Carla Núñez",   wa: "593998375914", missing: false },
  { id: "tit", name: "Titanes",         cats: ["u14","u16","sub21"], contact: "Diego Salas",  wa: "593991002233", missing: false },
  { id: "con", name: "Cóndores Andinos",cats: ["u12","u16","senior"], contact: "—",           wa: "", missing: true },
  { id: "hal", name: "Halcones",        cats: ["u14","u18"],        contact: "Mónica Vera",   wa: "593987445610", missing: false },
  { id: "leo", name: "Leones del Valle",cats: ["u16","sub21","senior"], contact: "Iván Rosales",wa: "593970223344", missing: false },
  { id: "tor", name: "Toros Rojos",     cats: ["u12","u14"],        contact: "—",             wa: "", missing: true },
  { id: "pum", name: "Pumas Quito",     cats: ["u18","sub21"],      contact: "Andrea León",   wa: "593982119900", missing: false },
  { id: "agu", name: "Águilas Doradas", cats: ["u14","u16","u18"],  contact: "Pablo Mera",    wa: "593995887711", missing: false },
  { id: "dra", name: "Dragones",        cats: ["u12","senior"],     contact: "Luis Ortega",   wa: "", missing: true },
  { id: "and", name: "Andes Basket",    cats: ["u16","sub21"],      contact: "Sofía Ramos",   wa: "593986554477", missing: false },
];

/* Fixture dates (oldest → newest) */
const FIX_DATES = [
  { key: "2026-07-11", dow: "Viernes", short: "Vie 11 Jul", label: "Viernes 11 Julio", num: 11 },
  { key: "2026-07-12", dow: "Sábado",  short: "Sáb 12 Jul", label: "Sábado 12 Julio",  num: 12 },
  { key: "2026-07-13", dow: "Domingo", short: "Dom 13 Jul", label: "Domingo 13 Julio", num: 13 },
];

const MATCHES = [
  // Viernes 11 — apertura, borradores
  { id: "m01", dateKey: "2026-07-11", date: "Vie 11 Jul", time: "16:30", court: "Cancha Central", cat: "u16",   home: "Andes Basket",     away: "Águilas Doradas", state: "draft" },
  { id: "m02", dateKey: "2026-07-11", date: "Vie 11 Jul", time: "16:30", court: "Cancha Norte",   cat: "sub21", home: "Pumas Quito",      away: "Leones del Valle", state: "draft" },
  { id: "m03", dateKey: "2026-07-11", date: "Vie 11 Jul", time: "18:00", court: "Cancha Central", cat: "u16",   home: "Spartans BC",      away: "Leones del Valle", state: "draft" },
  // Sábado 12 — jornada principal, mayormente publicada
  { id: "m04", dateKey: "2026-07-12", date: "Sáb 12 Jul", time: "09:00", court: "Cancha Central", cat: "u12",   home: "Spartans BC",      away: "Toros Rojos",     state: "published", locked: true },
  { id: "m05", dateKey: "2026-07-12", date: "Sáb 12 Jul", time: "09:00", court: "Cancha Norte",   cat: "u14",   home: "Halcones",         away: "Águilas Doradas", state: "published", locked: true },
  { id: "m06", dateKey: "2026-07-12", date: "Sáb 12 Jul", time: "10:30", court: "Cancha Central", cat: "u16",   home: "Leones del Valle", away: "Andes Basket",    state: "published" },
  { id: "m07", dateKey: "2026-07-12", date: "Sáb 12 Jul", time: "10:30", court: "Cancha Norte",   cat: "u16",   home: "Spartans BC",      away: "Águilas Doradas", state: "published", conflict: true },
  { id: "m08", dateKey: "2026-07-12", date: "Sáb 12 Jul", time: "12:00", court: "Cancha Sur",     cat: "sub21", home: "Pumas Quito",      away: "Titanes",         state: "draft", manual: true },
  { id: "m09", dateKey: "2026-07-12", date: "Sáb 12 Jul", time: "12:00", court: "Cancha Central", cat: "u18",   home: "Pumas Quito",      away: "Halcones",        state: "draft" },
  { id: "m10", dateKey: "2026-07-12", date: "Sáb 12 Jul", time: "13:30", court: "Cancha Central", cat: "senior",home: "Cóndores Andinos", away: "Dragones",        state: "draft", forfeit: true },
  { id: "m11", dateKey: "2026-07-12", date: "Sáb 12 Jul", time: "15:00", court: "Cancha Norte",   cat: "u12",   home: "Toros Rojos",      away: "Cóndores Andinos",state: "published" },
  { id: "m12", dateKey: "2026-07-12", date: "Sáb 12 Jul", time: "16:30", court: "Cancha Sur",     cat: "u14",   home: "Titanes",          away: "Spartans BC",     state: "draft" },
  // Domingo 13 — cierre
  { id: "m13", dateKey: "2026-07-13", date: "Dom 13 Jul", time: "09:00", court: "Cancha Norte",   cat: "senior",home: "Cóndores Andinos", away: "Leones del Valle",state: "draft" },
  { id: "m14", dateKey: "2026-07-13", date: "Dom 13 Jul", time: "11:00", court: "Cancha Central", cat: "u16",   home: "Spartans BC",      away: "Águilas Doradas", state: "draft" },
  { id: "m15", dateKey: "2026-07-13", date: "Dom 13 Jul", time: "11:00", court: "Cancha Sur",     cat: "u18",   home: "Halcones",         away: "Pumas Quito",     state: "draft" },
  { id: "m16", dateKey: "2026-07-13", date: "Dom 13 Jul", time: "12:30", court: "Cancha Central", cat: "sub21", home: "Leones del Valle", away: "Andes Basket",    state: "draft" },
];

/* Categories for tournament detail / builder */
const CATEGORIES = [
  { id: "u12",   name: "U12",    key: "azul", teams: 8,  start: "12 Jul", mode: "Todos contra todos",  status: "ready" },
  { id: "u14",   name: "U14",    key: "esm",  teams: 9,  start: "12 Jul", mode: "Grupos + Playoffs",   status: "ready" },
  { id: "u16",   name: "U16",    key: "vio",  teams: 12, start: "11 Jul", mode: "Doble round robin",   status: "ready" },
  { id: "u18",   name: "U18",    key: "amb",  teams: 6,  start: "12 Jul", mode: "Semifinal y final",   status: "ready" },
  { id: "sub21", name: "Sub-21", key: "ros",  teams: 6,  start: "11 Jul", mode: "Grupos + Playoffs",   status: "ready" },
  { id: "senior",name: "Senior", key: "cia",  teams: 5,  start: "—",      mode: "—",                   status: "incomplete" },
];

/* Version history (newest first) */
const VERSIONS = [
  { v: "V5", state: "draft",     by: "Admin",   date: "Hoy · 14:20",   reason: "Equipo retirado: Dragones → forfeits", current: true },
  { v: "V4", state: "published", by: "Admin",   date: "Ayer · 09:10",  reason: "Publicación inicial · Jornada 3" },
  { v: "V3", state: "archived",  by: "M. Vera", date: "10 Jul · 17:42",reason: "Edición manual de canchas U16" },
  { v: "V2", state: "archived",  by: "Admin",   date: "08 Jul · 11:05",reason: "Ajuste de horarios por lluvia" },
  { v: "V1", state: "archived",  by: "Admin",   date: "05 Jul · 16:30",reason: "Generación inicial del fixture" },
];

/* Dry-run diff (V4 → V5 candidate) */
const DRYRUN = {
  summary: { added: 2, moved: 4, removed: 1, forfeit: 2, warnings: 3, conflicts: 1 },
  rows: [
    { type: "forfeit", cat: "senior", match: "Cóndores Andinos vs Dragones", before: { txt: "Programado · Dom 13 · 09:00" }, after: { txt: "Forfeit · Dragones (L) · Cóndores (W)" }, sev: "warn", note: "Equipo retirado: Dragones. Partido futuro convertido en forfeit." },
    { type: "forfeit", cat: "u12",    match: "Dragones vs Toros Rojos",      before: { txt: "Programado · Dom 13 · 11:00" }, after: { txt: "Forfeit · Dragones (L) · Toros (W)" }, sev: "warn", note: "Equipo retirado: Dragones." },
    { type: "conflict",cat: "u16",    match: "Spartans BC vs Águilas Doradas",before: { txt: "Cancha Norte · 10:30" }, after: { txt: "Cancha Norte · 10:30" }, sev: "crit", note: "Solapamiento de cancha con Leones vs Andes (Cancha Norte 10:30). Requiere resolución." },
    { type: "moved",   cat: "u18",    match: "Pumas Quito vs Halcones",      before: { txt: "Cancha Sur · 13:30" }, after: { txt: "Cancha Central · 12:00" }, sev: "info", note: "Reubicado para liberar Cancha Sur." },
    { type: "moved",   cat: "sub21",  match: "Pumas Quito vs Titanes",       before: { txt: "Cancha Central · 12:00" }, after: { txt: "Cancha Sur · 12:00" }, sev: "info", note: "Override manual preservado." },
    { type: "added",   cat: "u14",    match: "Titanes vs Spartans BC",       before: { txt: "—" }, after: { txt: "Cancha Sur · Sáb 12 · 16:30" }, sev: "info", note: "Nuevo partido de fase regular." },
    { type: "added",   cat: "sub21",  match: "Leones del Valle vs Andes Basket",before: { txt: "—" }, after: { txt: "Cancha Central · Dom 13 · 12:30" }, sev: "info", note: "Nuevo partido de fase regular." },
    { type: "removed", cat: "senior", match: "Dragones vs Leones del Valle", before: { txt: "Cancha Norte · Dom 13 · 09:00" }, after: { txt: "Eliminado" }, sev: "info", note: "Partido eliminado por retiro de Dragones." },
  ],
};

/* Version compare V4 → V5 (same diff shape, condensed) */
const COMPARE = {
  left: "V4", right: "V5",
  summary: { added: 2, moved: 4, removed: 1, warnings: 3 },
  rows: [
    { type: "forfeit", cat: "senior", match: "Cóndores vs Dragones",  left: "Dom 13 · 09:00 · Programado", right: "Forfeit (Dragones L)", sev: "warn" },
    { type: "moved",   cat: "u18",    match: "Pumas vs Halcones",      left: "Cancha Sur · 13:30",         right: "Cancha Central · 12:00", sev: "info" },
    { type: "moved",   cat: "sub21",  match: "Pumas vs Titanes",       left: "Cancha Central · 12:00",     right: "Cancha Sur · 12:00",     sev: "info" },
    { type: "added",   cat: "u14",    match: "Titanes vs Spartans",    left: "—",                          right: "Cancha Sur · Sáb 16:30", sev: "info" },
    { type: "added",   cat: "sub21",  match: "Leones vs Andes",        left: "—",                          right: "Central · Dom 12:30",    sev: "info" },
    { type: "removed", cat: "senior", match: "Dragones vs Leones",     left: "Cancha Norte · Dom 09:00",   right: "—",                      sev: "info" },
  ],
};

const ACTIVITY = [
  { user: "Admin", action: "aprobó la revisión de cambios", entity: "Fixture V5", time: "hace 8 min", kind: "approve" },
  { user: "M. Vera", action: "editó manualmente", entity: "Pumas vs Halcones", time: "hace 41 min", kind: "edit" },
  { user: "Admin", action: "publicó las fechas de", entity: "U12 · Jornada 3", time: "hace 2 h", kind: "publish" },
  { user: "D. Salas", action: "actualizó el contacto de", entity: "Titanes", time: "hace 3 h", kind: "contact" },
  { user: "Sistema", action: "detectó equipo retirado en", entity: "Senior", time: "hace 5 h", kind: "alert" },
  { user: "Admin", action: "importó 24 equipos desde", entity: "Excel", time: "ayer", kind: "import" },
];

const TOURNAMENTS = [
  { id: "t1", name: "Copa Apertura 2026", state: "published", cats: 6, teams: 48, version: "V5", sport: "Básquet" },
  { id: "t2", name: "Liga Metropolitana",  state: "draft",     cats: 4, teams: 32, version: "V2", sport: "Básquet" },
  { id: "t3", name: "Torneo Clausura 2025",state: "archived",  cats: 5, teams: 40, version: "V11", sport: "Básquet" },
];

/* Diff type styling (shared by Dry Run + Compare) */
const DIFF_TYPE = {
  added:    { label: "Añadido",   ic: "plus",  t: "var(--ok)",        bg: "var(--ok-bg)",   ln: "var(--ok-line)" },
  moved:    { label: "Movido",    ic: "swap",  t: "var(--info)",      bg: "var(--info-bg)", ln: "var(--info-bg2)" },
  removed:  { label: "Eliminado", ic: "x",     t: "var(--text-mute)", bg: "var(--ink-100)", ln: "var(--line)" },
  forfeit:  { label: "Forfeit",   ic: "flag",  t: "var(--warn)",      bg: "var(--warn-bg)", ln: "var(--warn-line)" },
  conflict: { label: "Conflicto", ic: "alert", t: "var(--crit)",      bg: "var(--crit-bg)", ln: "var(--crit-line)" },
};

Object.assign(window, {
  Icon, ICONS, CatBadge, StatePill, SevTag, CATS, CAT_VARS, SEV_MAP, STATE_MAP,
  COURTS, CLUBS, MATCHES, ACTIVITY, TOURNAMENTS,
  FIX_DATES, CATEGORIES, VERSIONS, DRYRUN, COMPARE, DIFF_TYPE,
});

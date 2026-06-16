/* ===========================================================
   fixtureOS — Import & Update module: shared data + atoms
   Tournament create / import / update / setup workflows.
   Exposed on window for all babel scripts.
   =========================================================== */

/* ---------------- Import batch statuses ---------------- */
const IMP_STATUS = {
  uploaded:  { label: "Subido",              t: "var(--text-soft)", bg: "var(--ink-100)",  ln: "var(--line)",      ic: "upload" },
  parsing:   { label: "Procesando",          t: "var(--info)",      bg: "var(--info-bg)",  ln: "var(--info-bg2)",  ic: "refresh" },
  mapping:   { label: "Requiere mapeo",      t: "var(--info)",      bg: "var(--info-bg)",  ln: "var(--info-bg2)",  ic: "list" },
  review:    { label: "Requiere revisión",   t: "var(--warn)",      bg: "var(--warn-bg)",  ln: "var(--warn-line)", ic: "eye" },
  errors:    { label: "Resolver problemas",  t: "var(--warn)",      bg: "var(--warn-bg)",  ln: "var(--warn-line)", ic: "alert" },
  ready:     { label: "Listo para confirmar",t: "var(--ok)",        bg: "var(--ok-bg)",    ln: "var(--ok-line)",   ic: "checkcircle" },
  confirmed: { label: "Confirmado",          t: "var(--ok)",        bg: "var(--ok-bg)",    ln: "var(--ok-line)",   ic: "check" },
  rejected:  { label: "Rechazado",           t: "var(--text-mute)", bg: "var(--surface-2)",ln: "var(--line)",      ic: "x" },
  failed:    { label: "Falló",               t: "var(--crit)",      bg: "var(--crit-bg)",  ln: "var(--crit-line)", ic: "alert" },
};

function ImpStatusPill({ status, size = "md" }) {
  const s = IMP_STATUS[status] || IMP_STATUS.uploaded;
  const fs = size === "sm" ? 11.5 : 12.5;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: size === "sm" ? "2px 9px 2px 7px" : "3px 11px 3px 9px",
      borderRadius: 999, background: s.bg, color: s.t, border: `1px solid ${s.ln}`, fontSize: fs, fontWeight: 700, whiteSpace: "nowrap" }}>
      <Icon name={s.ic} size={fs} sw={2.2} />{s.label}
    </span>
  );
}

/* ---------------- Import sources ---------------- */
const IMP_SOURCES = [
  { id: "excel",  ic: "upload",   label: "Archivo Excel", hint: "Sube una planilla .xlsx o .xls", accept: ".xlsx, .xls" },
  { id: "csv",    ic: "list",     label: "Archivo CSV",   hint: "Sube un .csv separado por comas", accept: ".csv" },
  { id: "image",  ic: "eye",      label: "Imagen / captura", hint: "Extrae equipos desde una foto o screenshot con IA", accept: ".png, .jpg" },
  { id: "drupal", ic: "external", label: "Drupal JSON:API", hint: "Conexión directa con el sitio de la liga", accept: "endpoint" },
];
function sourceById(id) { return IMP_SOURCES.find((s) => s.id === id) || IMP_SOURCES[0]; }

function SourceBadge({ source, size = "md" }) {
  const s = sourceById(source);
  const fs = size === "sm" ? 11.5 : 12.5;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px 3px 8px", borderRadius: 99,
      background: "var(--ink-100)", color: "var(--text-soft)", border: "1px solid var(--line)", fontSize: fs, fontWeight: 700, whiteSpace: "nowrap" }}>
      <Icon name={s.ic} size={fs} sw={2.1} style={{ color: "var(--accent)" }} />{s.label.replace("Archivo ", "")}
    </span>
  );
}

/* ---------------- Wizard step rail (shared across import journey) ---------------- */
const IMP_STEPS = ["Origen", "Mapeo", "Cambios", "Confirmar"];
function WizardSteps({ current, steps = IMP_STEPS, onJump }) {
  const { isMobile } = useViewport();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 12, marginBottom: 22 }}>
      {steps.map((s, i) => {
        const done = i < current, on = i === current;
        return (
          <React.Fragment key={s}>
            <button onClick={() => onJump && i < current && onJump(i)} style={{ display: "flex", alignItems: "center", gap: 9, border: "none", background: "transparent",
              cursor: onJump && i < current ? "pointer" : "default", fontFamily: "var(--font-sans)", padding: 0 }}>
              <span style={{ width: 28, height: 28, borderRadius: 99, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, flex: "0 0 auto",
                background: done ? "var(--ok)" : on ? "var(--accent)" : "var(--ink-100)", color: done || on ? "#fff" : "var(--text-mute)" }}>
                {done ? <Icon name="check" size={15} sw={2.4} /> : i + 1}
              </span>
              {!isMobile && <span style={{ fontSize: 13.5, fontWeight: 700, color: on ? "var(--text)" : "var(--text-mute)" }}>{s}</span>}
            </button>
            {i < steps.length - 1 && <span style={{ flex: 1, height: 2, background: done ? "var(--ok)" : "var(--line)", borderRadius: 2 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ---------------- Mode banner: create vs update ---------------- */
function ImportModeBanner({ mode, target }) {
  const update = mode === "update";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 16px", borderRadius: "var(--radius)", marginBottom: 18,
      background: update ? "var(--info-bg)" : "var(--ok-bg)", border: `1px solid ${update ? "var(--info-bg2)" : "var(--ok-line)"}` }}>
      <Icon name={update ? "gitcompare" : "plus"} size={20} style={{ color: update ? "var(--info)" : "var(--ok)", flex: "0 0 auto", marginTop: 1 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 13.5, color: update ? "var(--info)" : "var(--ok)" }}>
          {update ? `Actualizar torneo existente · ${target || "Copa Apertura 2026"}` : "Crear nuevo dataset de torneo"}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginTop: 2, lineHeight: 1.5 }}>
          {update
            ? "Esta importación se comparará contra los datos existentes. Ningún cambio en el fixture se aplicará hasta aprobar un dry run."
            : "Esta importación creará clubes, categorías y equipos nuevos. Nada se publica hasta que confirmes."}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Category color chip (handles new categories too) ---------------- */
function CatChip({ name, ck, size = "md" }) {
  const v = CAT_VARS[ck] || CAT_VARS.azul;
  const fs = size === "sm" ? 11.5 : 12.5;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: size === "sm" ? "2px 8px 2px 7px" : "3px 10px 3px 9px",
      borderRadius: 999, background: v.bg, color: v.t, border: `1px solid ${v.ln}`, fontSize: fs, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 99, background: v.dot, flex: "0 0 auto" }} />{name}
    </span>
  );
}

/* ---------------- Confidence bar (image extraction) ---------------- */
function ConfidenceBar({ value }) {
  const tone = value >= 85 ? "var(--ok)" : value >= 70 ? "var(--warn)" : "var(--crit)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 96 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--ink-100)", overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: tone, borderRadius: 99 }} />
      </div>
      <span className="mono tnum" style={{ fontSize: 12, fontWeight: 700, color: tone, width: 34, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

/* ---------------- Import diff types (entity-level, NOT fixture-level) ---------------- */
const IMP_DIFF_TYPE = {
  newclub:   { label: "Club nuevo",         ic: "building", t: "var(--ok)",        bg: "var(--ok-bg)",    ln: "var(--ok-line)" },
  newcat:    { label: "Categoría nueva",    ic: "layers",   t: "var(--ok)",        bg: "var(--ok-bg)",    ln: "var(--ok-line)" },
  newteam:   { label: "Equipo nuevo",       ic: "plus",     t: "var(--ok)",        bg: "var(--ok-bg)",    ln: "var(--ok-line)" },
  rename:    { label: "Renombrado",         ic: "edit",     t: "var(--info)",      bg: "var(--info-bg)",  ln: "var(--info-bg2)" },
  color:     { label: "Color actualizado",  ic: "sliders",  t: "var(--cat-vio-t)", bg: "var(--cat-vio-bg)", ln: "var(--cat-vio-ln)" },
  moved:     { label: "Cambió de categoría",ic: "swap",     t: "var(--info)",      bg: "var(--info-bg)",  ln: "var(--info-bg2)" },
  retired:   { label: "Equipo retirado",    ic: "flag",     t: "var(--warn)",      bg: "var(--warn-bg)",  ln: "var(--warn-line)" },
  missing:   { label: "Falta en origen",    ic: "alert",    t: "var(--warn)",      bg: "var(--warn-bg)",  ln: "var(--warn-line)" },
  duplicate: { label: "Duplicado",          ic: "layers",   t: "var(--warn)",      bg: "var(--warn-bg)",  ln: "var(--warn-line)" },
  ambiguous: { label: "Coincidencia ambigua",ic: "target",  t: "var(--warn)",      bg: "var(--warn-bg)",  ln: "var(--warn-line)" },
};
function ImpDiffBadge({ type, size = "md" }) {
  const T = IMP_DIFF_TYPE[type] || IMP_DIFF_TYPE.newteam;
  const fs = size === "sm" ? 11 : 11.5;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 99, background: T.bg, color: T.t, border: `1px solid ${T.ln}`, fontSize: fs, fontWeight: 800, whiteSpace: "nowrap" }}>
      <Icon name={T.ic} size={fs} sw={2.4} />{T.label}
    </span>
  );
}

/* Diff scenario: updating Copa Apertura 2026 with inscripciones_v2.xlsx.
   decisions[] : options for the per-row user decision; default is first + safe. */
const IMP_DIFF = [
  { id: "d1",  type: "newclub",   entity: "Gladiadores",        cat: null,    current: "—", imported: "Gladiadores BC · 3 equipos", decisions: ["Crear Nuevo", "Ignorar Fila"] },
  { id: "d2",  type: "newclub",   entity: "Vikingos Quito",     cat: null,    current: "—", imported: "Vikingos Quito · 2 equipos", decisions: ["Crear Nuevo", "Ignorar Fila"] },
  { id: "d3",  type: "newcat",    entity: "U20",                cat: "vio",   current: "—", imported: "U20 · color Violeta", decisions: ["Crear (inactiva)", "Ignorar Fila"], note: "Quedará inactiva hasta definir fecha de inicio y modo de juego." },
  { id: "d4",  type: "newcat",    entity: "U10",                cat: "cia",   current: "—", imported: "U10 · color Cian", decisions: ["Crear (inactiva)", "Ignorar Fila"], note: "Quedará inactiva hasta definir fecha de inicio y modo de juego." },
  { id: "d5",  type: "newteam",   entity: "Gladiadores U16",    cat: "vio",   current: "—", imported: "Gladiadores U16 · U16", decisions: ["Crear Nuevo", "Ignorar Fila"] },
  { id: "d6",  type: "newteam",   entity: "Vikingos U14",       cat: "esm",   current: "—", imported: "Vikingos U14 · U14", decisions: ["Crear Nuevo", "Ignorar Fila"] },
  { id: "d7",  type: "rename",    entity: "Spartans U16",       cat: "vio",   current: "Spartans U16", imported: "Spartans BC U16", decisions: ["Mantener Existente", "Confirmar Rename"], note: "El renombrado no se aplica automáticamente. Requiere confirmación." },
  { id: "d8",  type: "color",     entity: "Sub-21",             cat: "ros",   current: "Rosa", imported: "Violeta", decisions: ["Mantener color", "Actualizar color"], note: "El color se aplica tras confirmar; no afecta el fixture." },
  { id: "d9",  type: "moved",     entity: "Halcones U14",       cat: "esm",   current: "U14", imported: "U16", decisions: ["Mantener Existente", "Confirmar cambio"], note: "Cambiar de categoría puede afectar partidos ya generados.", impact: true },
  { id: "d10", type: "retired",   entity: "Dragones",           cat: null,    current: "Activo · 2 equipos", imported: "Marcado retirado", decisions: ["Mantener Existente", "Equipo Retirado"], note: "Si se confirma el retiro, los partidos futuros se convierten en forfeits.", impact: true, sev: "warn" },
  { id: "d11", type: "missing",   entity: "Toros Rojos",        cat: null,    current: "Existe · 2 equipos", imported: "No aparece en el archivo", decisions: ["Mantener Existente", "Equipo Retirado", "Marcar removido"], note: "Los datos existentes nunca se eliminan automáticamente.", sev: "warn" },
  { id: "d12", type: "duplicate", entity: "Titanes U16",        cat: "vio",   current: "Existe", imported: "Aparece 2 veces en el archivo", decisions: ["Vincular Existente", "Crear Nuevo", "Ignorar Fila"], needsError: true, sev: "warn" },
  { id: "d13", type: "ambiguous", entity: "Andes / Andes Basket", cat: "vio", current: "Andes Basket (existe)", imported: "Andes · confianza 64%", decisions: ["Vincular Existente", "Crear Nuevo"], needsError: true, sev: "warn" },
];

const IMP_DIFF_SUMMARY = { newclubs: 3, newcats: 2, newteams: 14, updates: 5, warnings: 4, impacts: 6 };

/* ---------------- Mapping (Excel/CSV) ---------------- */
const MAP_TARGETS = [
  { id: "club",     label: "Nombre de Club" },
  { id: "team",     label: "Nombre de Equipo" },
  { id: "category", label: "Nombre de Categoría" },
  { id: "color",    label: "Color de Categoría" },
  { id: "status",   label: "Estado del Equipo" },
  { id: "notes",    label: "Notas" },
  { id: "ignore",   label: "Ignorar columna" },
];
const MAP_COLUMNS = [
  { col: "A", detected: "Club",      sample: "Spartans BC",    target: "club" },
  { col: "B", detected: "Equipo",    sample: "Spartans U14M",  target: "team" },
  { col: "C", detected: "Categoría", sample: "U14M",           target: "category" },
  { col: "D", detected: "Color",     sample: "Azul",           target: "color" },
  { col: "E", detected: "Estado",    sample: "Activo",         target: "status" },
  { col: "F", detected: "Obs.",      sample: "—",              target: "notes" },
];
const MAP_PREVIEW = [
  { club: "Spartans BC",  team: "Spartans U14M", cat: "U14M", ck: "esm", color: "Azul",    status: "Activo",   flag: null },
  { club: "Gladiadores",  team: "Gladiadores U16", cat: "U16", ck: "vio", color: "Violeta", status: "Activo",  flag: "new" },
  { club: "Cóndores",     team: "Cóndores Sr",   cat: "Senior", ck: "cia", color: "Cian",   status: "Activo",   flag: null },
  { club: "—",            team: "Vikingos U14",  cat: "U14",  ck: "esm", color: "Esm.",    status: "Activo",   flag: "missingclub" },
  { club: "Titanes",      team: "Titanes U16",   cat: "U16",  ck: "vio", color: "Violeta", status: "Activo",   flag: "dup" },
  { club: "Andes",        team: "Andes U16",     cat: "U16",  ck: "vio", color: "Violeta", status: "Activo",   flag: "ambiguous" },
];
const MAP_VALIDATION = [
  { ok: true,  text: "62 equipos detectados" },
  { ok: true,  text: "8 categorías detectadas" },
  { ok: false, text: "3 filas sin nombre de club", sev: "warn" },
  { ok: false, text: "1 candidato duplicado", sev: "warn" },
];

/* Image extraction preview (alternate mapping view) */
const IMG_EXTRACT = [
  { conf: 96, club: "CVU",   team: "CVU U14M",    cat: "U14M", ck: "esm", status: "Activo",  flag: null },
  { conf: 92, club: "Spartans BC", team: "Spartans U16", cat: "U16", ck: "vio", status: "Activo", flag: null },
  { conf: 88, club: "Gladiadores", team: "Gladiadores U16", cat: "U16", ck: "vio", status: "Activo", flag: "new" },
  { conf: 71, club: "Lobos", team: "Lobos del Norte", cat: "U18", ck: "amb", status: "Activo", flag: "lowconf" },
  { conf: 64, club: "?",     team: "Andes",       cat: "U16", ck: "vio", status: "Retirado?", flag: "review" },
];
const IMG_PROMPTS = [
  "Los equipos marcados en rojo están retirados. Ignóralos para la creación inicial.",
  "Cada columna representa una categoría. Usa los colores de encabezado como color de la categoría.",
  "Extrae clubes, equipos y categorías. Si hay dudas, márcalas para revisión.",
];

/* ---------------- Error resolution ---------------- */
const IMP_ERROR_TYPE = {
  duplicate:   { label: "Equipo duplicado",        ic: "layers",   tone: "var(--warn)" },
  missingcat:  { label: "Falta categoría",         ic: "layers",   tone: "var(--crit)" },
  missingname: { label: "Falta nombre de equipo",  ic: "edit",     tone: "var(--crit)" },
  ambiguous:   { label: "Club ambiguo",            ic: "target",   tone: "var(--warn)" },
  invalidcolor:{ label: "Color inválido",          ic: "sliders",  tone: "var(--warn)" },
  multicat:    { label: "Equipo en varias categorías", ic: "swap", tone: "var(--warn)" },
  lowconf:     { label: "Baja confianza (imagen)",  ic: "eye",     tone: "var(--warn)" },
};
const IMP_ERRORS = [
  { id: "e1", type: "duplicate", title: "Equipo duplicado: Titanes U16", row: 12,
    fields: { Club: "Titanes", Equipo: "Titanes U16", Categoría: "U16" },
    detail: "“Titanes U16” aparece dos veces en el archivo y ya existe en el torneo.",
    options: ["Vincular con equipo existente: Titanes U16", "Crear equipo nuevo", "Ignorar fila", "Editar manualmente"], def: 0 },
  { id: "e2", type: "ambiguous", title: "Coincidencia ambigua de club: Andes / Andes Basket", row: 27,
    fields: { Club: "Andes", Equipo: "Andes U16", Categoría: "U16" },
    detail: "El club “Andes” se parece a “Andes Basket” (confianza 64%). Confirma a cuál pertenece.",
    options: ["Vincular con club existente: Andes Basket", "Crear club nuevo: Andes", "Ignorar fila", "Editar manualmente"], def: 0 },
  { id: "e3", type: "missingcat", title: "Falta categoría en fila 31", row: 31,
    fields: { Club: "Halcones", Equipo: "Halcones U?", Categoría: "—" },
    detail: "La fila no tiene una categoría asignada. Asigna una categoría existente o crea una nueva.",
    options: ["Asignar categoría existente…", "Crear categoría nueva", "Ignorar fila", "Editar manualmente"], def: 0 },
  { id: "e4", type: "missingname", title: "Falta nombre de equipo en fila 44", row: 44,
    fields: { Club: "Pumas Quito", Equipo: "—", Categoría: "Sub-21" },
    detail: "La fila tiene club y categoría, pero no nombre de equipo.",
    options: ["Editar manualmente", "Usar “Pumas Sub-21”", "Ignorar fila"], def: 0 },
  { id: "e5", type: "invalidcolor", title: "Color inválido en U20: “Turquesa neón”", row: 8,
    fields: { Categoría: "U20", Color: "Turquesa neón" },
    detail: "El color no coincide con la paleta de FixtureOS. Elige un color válido.",
    options: ["Asignar Cian", "Asignar Violeta", "Sin color por ahora"], def: 0 },
  { id: "e6", type: "multicat", title: "Equipo en varias categorías: Pumas Sub-21", row: 53,
    fields: { Club: "Pumas Quito", Equipo: "Pumas Sub-21", Categoría: "Sub-21, U18" },
    detail: "El mismo equipo aparece en Sub-21 y U18. Indica la categoría correcta o duplícalo.",
    options: ["Mantener solo en Sub-21", "Mantener solo en U18", "Crear un equipo por categoría", "Ignorar fila"], def: 0 },
  { id: "e7", type: "lowconf", title: "Baja confianza en imagen: Lobos / Lobos del Norte", row: 18,
    fields: { Club: "Lobos (71%)", Equipo: "Lobos del Norte", Categoría: "U18" },
    detail: "La extracción desde imagen tiene baja confianza. Verifica el nombre antes de importar.",
    options: ["Confirmar “Lobos del Norte”", "Editar manualmente", "Reintentar extracción", "Ignorar fila"], def: 0 },
];

/* ---------------- Post-import setup ---------------- */
const SETUP_SUMMARY = { clubs: 13, cats: 8, teams: 62, needs: 3 };
const SETUP_CATS = [
  { id: "u12",   name: "U12",    ck: "azul", teams: 8,  start: "12 Jul", mode: "Todos contra todos", isNew: false },
  { id: "u14",   name: "U14",    ck: "esm",  teams: 9,  start: "12 Jul", mode: "Grupos + Playoffs",  isNew: false },
  { id: "u16",   name: "U16",    ck: "vio",  teams: 12, start: "11 Jul", mode: "Doble round robin",  isNew: false },
  { id: "u18",   name: "U18",    ck: "amb",  teams: 6,  start: "12 Jul", mode: "Semifinal y final",  isNew: false },
  { id: "sub21", name: "Sub-21", ck: "ros",  teams: 6,  start: "11 Jul", mode: "Grupos + Playoffs",  isNew: false },
  { id: "senior",name: "Senior", ck: "cia",  teams: 5,  start: null,     mode: null,                 isNew: false },
  { id: "u20",   name: "U20",    ck: "vio",  teams: 7,  start: null,     mode: null,                 isNew: true },
  { id: "u10",   name: "U10",    ck: "cia",  teams: 5,  start: null,     mode: null,                 isNew: true },
];
function setupState(c) {
  const hasStart = !!c.start, hasMode = !!c.mode;
  if (hasStart && hasMode) return "eligible";
  if (!hasStart && !hasMode) return "both";
  if (!hasStart) return "start";
  return "mode";
}
const SETUP_PROMPT = "Las categorías nuevas (U20, U10) empiezan el 15 de julio. U20 usa 2 grupos, top 2 a semifinales. U10 todos contra todos. Senior empieza el 20 de julio, round robin simple.";
const SETUP_PARSED = [
  { name: "U20",    ck: "vio",  start: "15 Jul 2026", mode: "2 grupos · top 2 a semifinales y final" },
  { name: "U10",    ck: "cia",  start: "15 Jul 2026", mode: "Todos contra todos (round robin simple)" },
  { name: "Senior", ck: "cia",  start: "20 Jul 2026", mode: "Round robin simple" },
];

/* ---------------- Import history ---------------- */
const IMP_HISTORY = [
  { id: "imp_241", date: "Hoy · 14:05",   tournament: "Copa Apertura 2026", source: "excel",  mode: "update", status: "review",    summary: "+3 clubes · +14 equipos · 4 advertencias" },
  { id: "imp_240", date: "Hoy · 09:42",   tournament: "Liga Metropolitana", source: "image",  mode: "create", status: "errors",    summary: "5 dudas de extracción por resolver" },
  { id: "imp_238", date: "Ayer · 18:20",  tournament: "Copa Apertura 2026", source: "drupal", mode: "update", status: "confirmed", summary: "+1 categoría · colores actualizados" },
  { id: "imp_236", date: "12 Jul · 11:10",tournament: "Copa Apertura 2026", source: "csv",    mode: "update", status: "confirmed", summary: "+6 equipos · 1 rename confirmado" },
  { id: "imp_233", date: "10 Jul · 16:30",tournament: "Torneo Clausura 2025", source: "excel", mode: "create", status: "confirmed", summary: "40 equipos · 5 categorías" },
  { id: "imp_230", date: "08 Jul · 09:15",tournament: "Liga Metropolitana", source: "excel",  mode: "create", status: "rejected",  summary: "Plantilla no reconocida" },
];

/* ---------------- Data health (tournament detail) ---------------- */
const DATA_HEALTH = [
  { label: "Categorías sin fecha de inicio", n: 3, tone: "var(--warn)", ic: "calendar", screen: "setup" },
  { label: "Categorías sin modo de juego",   n: 4, tone: "var(--warn)", ic: "layers",   screen: "setup" },
  { label: "Equipos sin club",               n: 2, tone: "var(--warn)", ic: "users",    screen: "importerrors" },
  { label: "Clubes sin WhatsApp",            n: 5, tone: "var(--info)", ic: "phone",    screen: "clubs" },
];

Object.assign(window, {
  IMP_STATUS, ImpStatusPill, IMP_SOURCES, sourceById, SourceBadge,
  IMP_STEPS, WizardSteps, ImportModeBanner, CatChip, ConfidenceBar,
  IMP_DIFF_TYPE, ImpDiffBadge, IMP_DIFF, IMP_DIFF_SUMMARY,
  MAP_TARGETS, MAP_COLUMNS, MAP_PREVIEW, MAP_VALIDATION, IMG_EXTRACT, IMG_PROMPTS,
  IMP_ERROR_TYPE, IMP_ERRORS, SETUP_SUMMARY, SETUP_CATS, setupState, SETUP_PROMPT, SETUP_PARSED,
  IMP_HISTORY, DATA_HEALTH,
});

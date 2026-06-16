/* fixtureOS — Screen: Create Tournament (/tournaments/new) */

function FormRow({ label, hint, children, required }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)" }}>{label}</span>
        {required && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>obligatorio</span>}
        {hint && <span style={{ fontSize: 11.5, color: "var(--text-mute)", marginLeft: "auto" }}>{hint}</span>}
      </div>
      {children}
    </label>
  );
}
const fieldStyle = {
  width: "100%", padding: "11px 13px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line-strong)",
  background: "var(--surface-2)", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, outline: "none",
};
function SelectField({ value, onChange, options }) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...fieldStyle, appearance: "none", WebkitAppearance: "none", paddingRight: 34, cursor: "pointer" }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <Icon name="chevdown" size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
    </div>
  );
}

function NewTournamentScreen() {
  const { nav } = useNav();
  const { narrow } = useViewport();
  const [name, setName] = React.useState("Copa Alpha 2026");
  const [sport, setSport] = React.useState("Básquet");
  const [season, setSeason] = React.useState("2026");
  const [desc, setDesc] = React.useState("");
  const [accent, setAccent] = React.useState("naranja");
  const [start, setStart] = React.useState("import");

  const startOpts = [
    { id: "empty",  ic: "trophy",   title: "Crear torneo vacío",            desc: "Empieza sin datos y añade clubes, categorías y equipos manualmente." },
    { id: "import", ic: "upload",   title: "Importar equipos / categorías", desc: "Desde Excel, CSV o una imagen/captura. Revisas antes de confirmar." },
    { id: "drupal", ic: "external", title: "Importar desde Drupal JSON:API", desc: "Conecta el sitio de la liga y sincroniza clubes y categorías." },
  ];
  const accents = [["naranja", "#ea580c"], ["azul", "#2563eb"], ["violeta", "#7c3aed"], ["verde", "#0d9488"]];

  const onContinue = () => { if (start === "empty") nav("tournament"); else nav("import"); };

  return (
    <div className="screen-pad" style={{ maxWidth: 920, margin: "0 auto" }}>
      <PageHeader eyebrow="Torneos · Quito Basket Liga" title="Crear Torneo"
        sub="Crea el torneo dentro de tu organización. Podrás importar datos o empezar vacío." />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Basic info */}
        <Card>
          <CardHead title="Información básica" icon="trophy" sub="El estado inicial siempre es Borrador" />
          <div style={{ padding: 18, display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: narrow ? "auto" : "1 / -1" }}>
              <FormRow label="Nombre del torneo" required>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Copa Apertura 2026" style={fieldStyle} />
              </FormRow>
            </div>
            <FormRow label="Deporte" hint="opcional">
              <SelectField value={sport} onChange={setSport} options={["Genérico", "Básquet", "Fútbol", "Vóley", "Futsal"]} />
            </FormRow>
            <FormRow label="Temporada / Año" hint="opcional">
              <input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="2026" style={fieldStyle} />
            </FormRow>
            <div style={{ gridColumn: narrow ? "auto" : "1 / -1" }}>
              <FormRow label="Descripción" hint="opcional">
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Notas internas sobre el torneo, sede, organizador…"
                  style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.55 }} />
              </FormRow>
            </div>
            <FormRow label="Estado inicial">
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 13px", borderRadius: "var(--radius-sm)", background: "var(--ink-100)", border: "1px solid var(--line)" }}>
                <StatePill state="draft" />
                <span style={{ fontSize: 12.5, color: "var(--text-mute)" }}>No visible públicamente hasta publicar</span>
              </div>
            </FormRow>
            <FormRow label="Color del torneo" hint="opcional">
              <div style={{ display: "flex", gap: 9, alignItems: "center", height: 44 }}>
                {accents.map(([id, hex]) => (
                  <button key={id} onClick={() => setAccent(id)} title={id} style={{ width: 30, height: 30, borderRadius: 99, background: hex, border: accent === id ? "2px solid var(--text)" : "2px solid var(--line)", cursor: "pointer", display: "grid", placeItems: "center", boxShadow: accent === id ? `0 0 0 3px color-mix(in srgb, ${hex} 25%, transparent)` : "none" }}>
                    {accent === id && <Icon name="check" size={15} sw={2.6} style={{ color: "#fff" }} />}
                  </button>
                ))}
              </div>
            </FormRow>
          </div>
        </Card>

        {/* Start method */}
        <Card>
          <CardHead title="¿Cómo quieres empezar?" icon="zap" sub="Puedes cambiar de método más tarde" />
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 11 }}>
            {startOpts.map((o) => {
              const on = start === o.id;
              return (
                <button key={o.id} onClick={() => setStart(o.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderRadius: "var(--radius)",
                  border: `1px solid ${on ? "var(--accent)" : "var(--line-strong)"}`, background: on ? "var(--accent-soft)" : "var(--surface)", cursor: "pointer", textAlign: "left",
                  fontFamily: "var(--font-sans)", boxShadow: on ? "0 0 0 3px var(--accent-soft)" : "none" }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: on ? "var(--surface)" : "var(--ink-100)", color: "var(--accent)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={o.ic} size={21} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 800, fontSize: 15, color: "var(--text)" }}>{o.title}</span>
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--text-mute)", marginTop: 2, lineHeight: 1.45 }}>{o.desc}</span>
                  </span>
                  <span style={{ width: 22, height: 22, borderRadius: 99, border: `2px solid ${on ? "var(--accent)" : "var(--line-strong)"}`, display: "grid", placeItems: "center", flex: "0 0 auto" }}>{on && <span style={{ width: 11, height: 11, borderRadius: 99, background: "var(--accent)" }} />}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <Btn variant="ghost" icon="chevleft" onClick={() => nav("tournaments")}>Cancelar</Btn>
        <div style={{ flex: 1 }} />
        <Btn variant="subtle" icon="check" onClick={() => nav("tournament")}>Guardar Borrador</Btn>
        <Btn variant="primary" iconR="chevright" onClick={onContinue}>
          {start === "empty" ? "Crear torneo" : "Continuar a importar"}
        </Btn>
      </div>
    </div>
  );
}

Object.assign(window, { NewTournamentScreen, FormRow, SelectField, fieldStyle });

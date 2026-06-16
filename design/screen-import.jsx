/* fixtureOS — Screen: Import Wizard · Origen (/tournaments/import + /:id/import)
   Step 1 of the import journey. Sets window.IMPORT_CTX for downstream screens. */

window.IMPORT_CTX = window.IMPORT_CTX || { mode: "update", source: "excel", target: "Copa Apertura 2026" };

function ImportScreen() {
  const { nav, params } = useNav();
  const { isMobile, narrow } = useViewport();
  const ctx = window.IMPORT_CTX;
  const [mode, setMode] = React.useState(params.mode || ctx.mode);
  const [source, setSource] = React.useState(params.source || ctx.source);
  const [target, setTarget] = React.useState(ctx.target);
  const [endpoint, setEndpoint] = React.useState("https://liga.example.org/jsonapi");
  const [prompt, setPrompt] = React.useState("");

  const cont = () => {
    window.IMPORT_CTX = { mode, source, target };
    nav("mapping");
  };

  return (
    <div className="screen-pad" style={{ maxWidth: 920, margin: "0 auto" }}>
      <PageHeader eyebrow={mode === "update" ? `Torneos · ${target}` : "Torneos · Quito Basket Liga"}
        title="Importar Datos del Torneo"
        sub="Carga clubes, categorías y equipos. Nada cambia el fixture hasta aprobar un dry run." />

      <WizardSteps current={0} />

      {/* Mode */}
      <Card style={{ marginBottom: 16 }}>
        <CardHead title="Modo de importación" icon="gitcompare" />
        <div style={{ padding: 18, display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 11 }}>
          {[["create", "plus", "Crear nuevo torneo", "Genera un dataset nuevo desde la fuente importada."],
            ["update", "refresh", "Actualizar torneo existente", "Compara contra los datos actuales y muestra un diff."]].map(([id, ic, title, desc]) => {
            const on = mode === id;
            return (
              <button key={id} onClick={() => setMode(id)} style={{ display: "flex", gap: 13, padding: "14px 15px", borderRadius: "var(--radius)", textAlign: "left",
                border: `1px solid ${on ? "var(--accent)" : "var(--line-strong)"}`, background: on ? "var(--accent-soft)" : "var(--surface)", cursor: "pointer",
                fontFamily: "var(--font-sans)", boxShadow: on ? "0 0 0 3px var(--accent-soft)" : "none" }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: on ? "var(--surface)" : "var(--ink-100)", color: "var(--accent)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={ic} size={19} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 800, fontSize: 14.5 }}>{title}</span>
                  <span style={{ display: "block", fontSize: 12, color: "var(--text-mute)", marginTop: 2, lineHeight: 1.45 }}>{desc}</span>
                </span>
              </button>
            );
          })}
          {mode === "update" && (
            <div style={{ gridColumn: narrow ? "auto" : "1 / -1" }}>
              <FormRow label="Torneo destino">
                <SelectField value={target} onChange={setTarget} options={TOURNAMENTS.map((t) => t.name)} />
              </FormRow>
            </div>
          )}
        </div>
      </Card>

      <ImportModeBanner mode={mode} target={target} />

      {/* Source */}
      <Card>
        <CardHead title="Elegir fuente" icon="upload" sub="Puedes importar clubes, categorías, equipos y colores" />
        <div style={{ padding: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
            {IMP_SOURCES.map((s) => {
              const on = source === s.id;
              return (
                <button key={s.id} onClick={() => setSource(s.id)} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 9, padding: "14px 14px", borderRadius: "var(--radius)",
                  border: `1px solid ${on ? "var(--accent)" : "var(--line-strong)"}`, background: on ? "var(--accent-soft)" : "var(--surface)", cursor: "pointer", textAlign: "left",
                  fontFamily: "var(--font-sans)", boxShadow: on ? "0 0 0 3px var(--accent-soft)" : "none" }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: on ? "var(--surface)" : "var(--ink-100)", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name={s.ic} size={19} /></span>
                  <span style={{ fontWeight: 800, fontSize: 13.5 }}>{s.label}</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-mute)", lineHeight: 1.4 }}>{s.hint}</span>
                </button>
              );
            })}
          </div>

          {/* Per-source config */}
          {(source === "excel" || source === "csv") && (
            <div style={{ border: "2px dashed var(--line-strong)", borderRadius: "var(--radius)", padding: "30px 20px", textAlign: "center", background: "var(--surface-2)" }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}><Icon name="upload" size={22} /></div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Arrastra tu archivo {source === "excel" ? ".xlsx / .xls" : ".csv"} aquí</div>
              <div style={{ fontSize: 12.5, color: "var(--text-mute)", marginTop: 4 }}>o <span style={{ color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}>selecciona desde tu equipo</span></div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, padding: "8px 13px", borderRadius: 99, background: "var(--surface)", border: "1px solid var(--line)", fontSize: 12.5, fontWeight: 700 }}>
                <Icon name={source === "excel" ? "upload" : "list"} size={15} style={{ color: "var(--ok)" }} /> {source === "excel" ? "inscripciones_v2.xlsx" : "equipos.csv"} · <span style={{ color: "var(--text-mute)", fontWeight: 600 }}>62 filas</span>
              </div>
            </div>
          )}
          {source === "image" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ border: "2px dashed var(--line-strong)", borderRadius: "var(--radius)", padding: "26px 20px", textAlign: "center", background: "var(--surface-2)" }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}><Icon name="eye" size={22} /></div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Sube una foto o captura del listado</div>
                <div style={{ fontSize: 12.5, color: "var(--text-mute)", marginTop: 4 }}>La IA extrae clubes, equipos, categorías y colores</div>
              </div>
              <div>
                <FormRow label="Instrucciones para la IA" hint="opcional">
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} placeholder="Describe cómo interpretar la imagen…"
                    style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.55 }} />
                </FormRow>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                  {IMG_PROMPTS.map((p, i) => (
                    <button key={i} onClick={() => setPrompt((t) => (t ? t + " " : "") + p)} style={{ textAlign: "left", padding: "7px 11px", borderRadius: 99, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text-soft)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Icon name="plus" size={12} style={{ color: "var(--accent)", flex: "0 0 auto" }} sw={2.4} />{p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {source === "drupal" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <FormRow label="Endpoint JSON:API" required>
                <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} style={{ ...fieldStyle, fontFamily: "var(--font-mono)", fontSize: 13 }} />
              </FormRow>
              <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 14 }}>
                <FormRow label="Recurso de equipos"><SelectField value="node--team" onChange={() => {}} options={["node--team", "node--club", "taxonomy_term--category"]} /></FormRow>
                <FormRow label="Token (Bearer)" hint="opcional"><input placeholder="••••••••" style={fieldStyle} /></FormRow>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: "var(--radius)", background: "var(--ok-bg)", border: "1px solid var(--ok-line)" }}>
                <Icon name="checkcircle" size={18} style={{ color: "var(--ok)", flex: "0 0 auto" }} />
                <span style={{ fontSize: 12.5, color: "var(--text-soft)", fontWeight: 600 }}>Conexión verificada · 62 equipos y 8 categorías disponibles</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
        <Btn variant="ghost" icon="chevleft" onClick={() => nav("tournaments")}>Cancelar</Btn>
        <div style={{ flex: 1 }} />
        <Btn variant="primary" iconR="chevright" onClick={cont}>Continuar</Btn>
      </div>
    </div>
  );
}

window.ImportScreen = ImportScreen;

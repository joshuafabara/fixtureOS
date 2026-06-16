/* fixtureOS — Screen: Tournament Update / Edit (/tournaments/:id/edit) */

function SummaryStat({ label, value, sub, ic, tone }) {
  return (
    <div style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 26, height: 26, borderRadius: 7, background: `color-mix(in srgb, ${tone || "var(--accent)"} 13%, transparent)`, color: tone || "var(--accent)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={ic} size={14} sw={2.1} /></span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)" }}>{label}</span>
      </div>
      <div className="mono tnum" style={{ fontSize: 25, fontWeight: 700, letterSpacing: -1, marginTop: 9, lineHeight: 1, color: "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, marginTop: 5, color: "var(--text-mute)" }}>{sub}</div>}
    </div>
  );
}

function EditTournamentScreen() {
  const { nav } = useNav();
  const { narrow } = useViewport();
  const [name, setName] = React.useState("Copa Apertura 2026");
  const [sport, setSport] = React.useState("Básquet");
  const [season, setSeason] = React.useState("2026");
  const [state, setState] = React.useState("published");

  return (
    <div className="screen-pad" style={{ maxWidth: 1180, margin: "0 auto" }}>
      <PageHeader eyebrow="Torneos · Copa Apertura 2026" title="Editar Torneo"
        sub="Actualiza la metadata o entra a actualizar datos, contexto y fixture."
        right={<Btn variant="ghost" icon="chevleft" onClick={() => nav("tournament")}>Volver al detalle</Btn>} />

      <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "minmax(0,1fr) 340px", gap: 16, alignItems: "start" }}>
        {/* Left: metadata + summaries */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <CardHead title="Metadata del torneo" icon="trophy" />
            <div style={{ padding: 18, display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: narrow ? "auto" : "1 / -1" }}>
                <FormRow label="Nombre">
                  <input value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} />
                </FormRow>
              </div>
              <FormRow label="Deporte"><SelectField value={sport} onChange={setSport} options={["Genérico", "Básquet", "Fútbol", "Vóley", "Futsal"]} /></FormRow>
              <FormRow label="Temporada / Año"><input value={season} onChange={(e) => setSeason(e.target.value)} style={fieldStyle} /></FormRow>
              <div style={{ gridColumn: narrow ? "auto" : "1 / -1" }}>
                <FormRow label="Estado">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[["draft", "Borrador"], ["published", "Publicado"], ["archived", "Archivado"]].map(([id, lb]) => {
                      const on = state === id;
                      return (
                        <button key={id} onClick={() => setState(id)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: "var(--radius-sm)",
                          border: `1px solid ${on ? "var(--accent)" : "var(--line-strong)"}`, background: on ? "var(--accent-soft)" : "var(--surface)", color: on ? "var(--accent-strong)" : "var(--text-soft)",
                          fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                          {on && <Icon name="check" size={14} sw={2.4} />}{lb}
                        </button>
                      );
                    })}
                  </div>
                </FormRow>
              </div>
            </div>
          </Card>

          {/* Data + fixture summary side by side */}
          <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: 16 }}>
            <Card>
              <CardHead title="Resumen de datos" icon="users" right={<Btn variant="subtle" size="sm" icon="upload" onClick={() => nav("import")}>Actualizar</Btn>} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--line)" }}>
                <div style={{ borderRight: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}><SummaryStat label="Clubes" value="13" ic="building" /></div>
                <div style={{ borderBottom: "1px solid var(--line)" }}><SummaryStat label="Categorías" value="8" sub="2 inactivas" ic="layers" tone="var(--warn)" /></div>
                <div style={{ borderRight: "1px solid var(--line)" }}><SummaryStat label="Equipos" value="62" ic="users" /></div>
                <div><SummaryStat label="Sin club" value="2" sub="requieren revisión" ic="alert" tone="var(--warn)" /></div>
              </div>
            </Card>
            <Card>
              <CardHead title="Resumen del fixture" icon="layers" right={<Btn variant="subtle" size="sm" icon="eye" onClick={() => nav("fixture")}>Ver</Btn>} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--line)" }}>
                <div style={{ borderRight: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}><SummaryStat label="Última versión" value="V5" sub="Borrador" ic="branch" /></div>
                <div style={{ borderBottom: "1px solid var(--line)" }}><SummaryStat label="Fechas publicadas" value="18" sub="de 30" ic="calendar" /></div>
                <div style={{ borderRight: "1px solid var(--line)" }}><SummaryStat label="Dry runs pendientes" value="1" ic="zap" tone="var(--info)" /></div>
                <div><SummaryStat label="Conflictos" value="1" sub="sin resolver" ic="alert" tone="var(--crit)" /></div>
              </div>
            </Card>
          </div>

          {/* Last import snapshot */}
          <Card>
            <CardHead title="Última importación" icon="history" right={<Btn variant="subtle" size="sm" iconR="chevright" onClick={() => nav("imports")}>Ver historial</Btn>} />
            <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span style={{ width: 42, height: 42, borderRadius: 11, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name="upload" size={20} /></span>
              <div style={{ minWidth: 0, flex: "1 1 200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>inscripciones_v2.xlsx</span>
                  <SourceBadge source="excel" size="sm" />
                  <ImpStatusPill status="review" size="sm" />
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-mute)", marginTop: 3 }} className="mono">Hoy · 14:05 · modo actualización · +3 clubes · +14 equipos</div>
              </div>
              <Btn variant="ghost" size="sm" icon="gitcompare" onClick={() => nav("importdiff")}>Revisar cambios</Btn>
            </div>
          </Card>
        </div>

        {/* Right: action rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "var(--text-mute)", marginBottom: 12 }}>Acciones</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <Btn variant="primary" icon="upload" onClick={() => nav("import")} style={{ width: "100%", justifyContent: "flex-start" }}>Actualizar Datos del Torneo</Btn>
              <Btn variant="ghost" icon="sliders" onClick={() => nav("ctxtournament")} style={{ width: "100%", justifyContent: "flex-start" }}>Editar Contexto del Torneo</Btn>
              <Btn variant="ghost" icon="layers" onClick={() => nav("setup")} style={{ width: "100%", justifyContent: "flex-start" }}>Continuar Setup</Btn>
              <Btn variant="ghost" icon="zap" onClick={() => nav("dryrun")} style={{ width: "100%", justifyContent: "flex-start" }}>Generar Fixture Dry Run</Btn>
            </div>
          </Card>
          <Card style={{ padding: 16, background: "var(--info-bg)", border: "1px solid var(--info-bg2)" }}>
            <div style={{ display: "flex", gap: 11 }}>
              <Icon name="lock" size={18} style={{ color: "var(--info)", flex: "0 0 auto", marginTop: 1 }} />
              <div style={{ fontSize: 12.5, color: "var(--text-soft)", lineHeight: 1.5 }}>
                Cambiar la metadata no afecta el fixture. Cualquier actualización de datos pasa por revisión de cambios y dry run antes de aplicarse.
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <Btn variant="subtle" icon="x" onClick={() => nav("tournament")}>Descartar</Btn>
        <div style={{ flex: 1 }} />
        <Btn variant="ok" icon="check" onClick={() => nav("tournament")}>Guardar Cambios</Btn>
      </div>
    </div>
  );
}

Object.assign(window, { EditTournamentScreen, SummaryStat });

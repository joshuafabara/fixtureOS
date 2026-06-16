/* fixtureOS — Screen: Post-Import Fixture Setup (/tournaments/:id/setup) */

const SETUP_STATE_MAP = {
  eligible: { label: "Elegible",            t: "var(--ok)",   bg: "var(--ok-bg)",   ln: "var(--ok-line)",   ic: "checkcircle" },
  both:     { label: "Falta fecha y modo",  t: "var(--crit)", bg: "var(--crit-bg)", ln: "var(--crit-line)", ic: "alert" },
  start:    { label: "Falta fecha",         t: "var(--warn)", bg: "var(--warn-bg)", ln: "var(--warn-line)", ic: "calendar" },
  mode:     { label: "Falta modo",          t: "var(--warn)", bg: "var(--warn-bg)", ln: "var(--warn-line)", ic: "layers" },
};

function EligTag({ state }) {
  const s = SETUP_STATE_MAP[state];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: s.bg, color: s.t, border: `1px solid ${s.ln}`, fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap" }}>
      <Icon name={s.ic} size={12} sw={2.3} />{s.label}
    </span>
  );
}

function PostImportSetupScreen() {
  const { nav } = useNav();
  const { isMobile } = useViewport();
  const [text, setText] = React.useState(SETUP_PROMPT);
  const [parsed, setParsed] = React.useState(true);
  const eligibleCount = SETUP_CATS.filter((c) => setupState(c) === "eligible").length;
  const needsCount = SETUP_CATS.length - eligibleCount;
  const examples = [
    "Todas las categorías nuevas empiezan el 15 de julio.",
    "U20 usa 2 grupos, top 2 a semifinales.",
    "Senior: round robin simple, empieza el 20 de julio.",
  ];
  const append = (ex) => { setText((t) => (t ? t + " " : "") + ex); setParsed(false); };

  return (
    <div className="screen-pad" style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 110 }}>
      <PageHeader eyebrow="Importación · setup posterior"
        title="Setup del Torneo Después de Importar"
        sub="Completa fecha de inicio y modo de juego. Las categorías sin ambos quedan inactivas para el fixture." />

      {/* Import summary */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {[["Clubes", SETUP_SUMMARY.clubs, "building", "var(--accent)"], ["Categorías", SETUP_SUMMARY.cats, "layers", "var(--accent)"], ["Equipos", SETUP_SUMMARY.teams, "users", "var(--accent)"], ["Requieren setup", needsCount, "alert", "var(--warn)"]].map(([l, v, ic, tone], i) => (
          <Card key={i} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: `color-mix(in srgb, ${tone} 13%, transparent)`, color: tone, display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={ic} size={14} /></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)" }}>{l}</span>
            </div>
            <div className="mono tnum" style={{ fontSize: 25, fontWeight: 700, letterSpacing: -1, marginTop: 9, lineHeight: 1, color: tone === "var(--warn)" ? "var(--warn)" : "var(--text)" }}>{v}</div>
          </Card>
        ))}
      </div>

      {/* Readiness table */}
      <Card style={{ marginBottom: 16 }}>
        <CardHead title="Elegibilidad de categorías" sub={`${eligibleCount} elegibles · ${needsCount} requieren setup`} icon="layers"
          right={<span style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 700 }}>Fecha + modo = elegible</span>} />
        <TableScroll minWidth={780}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 70px 120px 1.3fr 150px 90px", padding: "10px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
            <div>Categoría</div><div>Equipos</div><div>Fecha inicio</div><div>Modo de juego</div><div>Elegible</div><div style={{ textAlign: "right" }}>Acción</div>
          </div>
          {SETUP_CATS.map((c, i) => {
            const st = setupState(c);
            return (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 70px 120px 1.3fr 150px 90px", alignItems: "center", padding: "13px 18px",
                borderBottom: i < SETUP_CATS.length - 1 ? "1px solid var(--line)" : "none", background: st === "both" ? "color-mix(in srgb, var(--crit-bg) 35%, transparent)" : st !== "eligible" ? "color-mix(in srgb, var(--warn-bg) 30%, transparent)" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CatChip name={c.name} ck={c.ck} size="sm" />
                  {c.isNew && <span style={{ fontSize: 10, fontWeight: 800, color: "var(--ok)", padding: "1px 6px", borderRadius: 99, background: "var(--ok-bg)", border: "1px solid var(--ok-line)" }}>NUEVA</span>}
                </div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 14 }}>{c.teams}</div>
                <div style={{ fontSize: 13, fontWeight: c.start ? 600 : 700, color: c.start ? "var(--text)" : "var(--warn)" }}>{c.start || "Falta"}</div>
                <div style={{ fontSize: 13, fontWeight: c.mode ? 600 : 700, color: c.mode ? "var(--text-soft)" : "var(--warn)" }}>{c.mode || "Falta modo"}</div>
                <div><EligTag state={st} /></div>
                <div style={{ textAlign: "right" }}>
                  <Btn variant={st === "eligible" ? "subtle" : "soft"} size="sm" icon={st === "eligible" ? "edit" : "settings"} onClick={() => nav("ctxcategory")}>{st === "eligible" ? "Editar" : "Setup"}</Btn>
                </div>
              </div>
            );
          })}
        </TableScroll>
      </Card>

      {/* Bulk prompt + parsed preview */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name="message" size={16} /></span>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Configuración por lote</div>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-mute)", marginBottom: 12, lineHeight: 1.5 }}>Describe fechas de inicio y modos de juego para varias categorías a la vez. Mostramos la interpretación antes de guardar.</div>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setParsed(false); }} rows={5}
            placeholder="Ej: Todas las categorías nuevas empiezan el 15 de julio. U20 usa 2 grupos, top 2 a semifinales…"
            style={{ width: "100%", resize: "vertical", padding: "13px 14px", borderRadius: "var(--radius)", border: "1px solid var(--line-strong)", background: "var(--surface-2)", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.6, outline: "none" }} />
          <div style={{ margin: "13px 0 16px" }}>
            <Btn variant="primary" icon="zap" onClick={() => setParsed(true)}>Interpretar configuración</Btn>
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", marginBottom: 8 }}>Ejemplos</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {examples.map((ex, i) => (
              <button key={i} onClick={() => append(ex)} style={{ textAlign: "left", padding: "7px 11px", borderRadius: 99, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text-soft)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="plus" size={12} style={{ color: "var(--accent)", flex: "0 0 auto" }} sw={2.4} />{ex}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHead title="Vista previa interpretada" icon="checkcircle" right={parsed ? <SevTag sev="info" size="sm">Interpretado</SevTag> : <SevTag sev="warn" size="sm">Sin interpretar</SevTag>} />
          <div style={{ padding: 16 }}>
            {parsed ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SETUP_PARSED.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "13px 14px", borderRadius: "var(--radius)", background: "var(--surface-2)", border: "1px solid var(--line)", borderLeft: "3px solid var(--ok)" }}>
                    <Icon name="checkcircle" size={18} style={{ color: "var(--ok)", flex: "0 0 auto", marginTop: 1 }} sw={2.1} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <CatChip name={p.name} ck={p.ck} size="sm" />
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                        <span style={{ fontSize: 12.5, color: "var(--text-soft)" }}><span style={{ color: "var(--text-mute)", fontWeight: 700 }}>Inicio:</span> <strong style={{ color: "var(--text)" }}>{p.start}</strong></span>
                        <span style={{ fontSize: 12.5, color: "var(--text-soft)" }}><span style={{ color: "var(--text-mute)", fontWeight: 700 }}>Modo:</span> <strong style={{ color: "var(--text)" }}>{p.mode}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", borderRadius: "var(--radius)", background: "var(--ok-bg)", border: "1px solid var(--ok-line)", marginTop: 2 }}>
                  <Icon name="checkcircle" size={17} style={{ color: "var(--ok)", flex: "0 0 auto" }} />
                  <span style={{ fontSize: 12.5, color: "var(--text-soft)", fontWeight: 600 }}>Al guardar, 3 categorías pasan a <strong style={{ color: "var(--ok)" }}>elegibles</strong> para el fixture.</span>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", placeItems: "center", padding: "30px 0", textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--ink-100)", color: "var(--text-mute)", display: "grid", placeItems: "center", marginBottom: 12 }}><Icon name="zap" size={20} /></div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-soft)" }}>Interpreta el texto para ver la configuración</div>
                <div style={{ fontSize: 12.5, color: "var(--text-mute)", marginTop: 4, maxWidth: 260 }}>Mostramos fechas y modos de juego detectados antes de aplicarlos.</div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* sticky footer */}
      <div style={{ position: "fixed", left: isMobile ? 0 : "var(--sidebar-w, 234px)", right: 0, bottom: 0, background: "var(--surface)", borderTop: "1px solid var(--line)", padding: isMobile ? "12px 16px" : "14px 32px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 -6px 24px rgba(15,23,42,.06)", zIndex: 10, flexWrap: "wrap", transition: "left .18s ease" }}>
        <div className="hide-mobile" style={{ fontSize: 13, color: "var(--text-soft)" }}>
          <strong style={{ color: "var(--text)" }}>{eligibleCount} de {SETUP_CATS.length}</strong> categorías elegibles
        </div>
        <div style={{ flex: 1 }} />
        <Btn variant="subtle" icon="check" onClick={() => nav("tournament")}>Guardar Setup</Btn>
        <Btn variant="ghost" icon="sliders" onClick={() => nav("ctxcategory")}>Ir a Contexto</Btn>
        <Btn variant="primary" icon="zap" onClick={() => nav("dryrun")}>Generar Fixture Dry Run</Btn>
      </div>
    </div>
  );
}

window.PostImportSetupScreen = PostImportSetupScreen;

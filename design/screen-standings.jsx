/* fixtureOS — Screen: Standings Import + Review */

const STANDINGS = [
  { pos: 1, detected: "LOS ANDES QUITO", matched: "Andes Basket", conf: 96 },
  { pos: 2, detected: "SPARTANS B.C.", matched: "Spartans BC", conf: 98 },
  { pos: 3, detected: "AGUILAS DORADAS", matched: "Águilas Doradas", conf: 94 },
  { pos: 4, detected: "LEONES VALLE", matched: "Leones del Valle", conf: 88 },
  { pos: 5, detected: "PUMAS UIO", matched: "Pumas Quito", conf: 72 },
  { pos: 6, detected: "TITANS", matched: "Titanes", conf: 64 },
];

function ConfBar({ v }) {
  const tone = v >= 90 ? "var(--ok)" : v >= 75 ? "var(--warn)" : "var(--crit)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 54, height: 6, borderRadius: 99, background: "var(--ink-100)", overflow: "hidden" }}>
        <div style={{ width: v + "%", height: "100%", background: tone, borderRadius: 99 }} />
      </div>
      <span className="mono tnum" style={{ fontSize: 12.5, fontWeight: 700, color: tone }}>{v}%</span>
    </div>
  );
}

function StandingsScreen() {
  const { nav } = useNav();
  const { isMobile } = useViewport();
  const [tab, setTab] = React.useState("import");
  const [cat, setCat] = React.useState("u16");
  const [mode, setMode] = React.useState("image");

  return (
    <div className="screen-pad" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <PageHeader eyebrow="Fixture · Copa Apertura 2026" title="Posiciones y playoffs"
        sub="Importa la tabla final de la fase regular para generar el cuadro de playoffs." />

      <div style={{ borderBottom: "1px solid var(--line)", marginBottom: 20 }}>
        <SegTabs tabs={[{ id: "import", label: "Importar", icon: "upload" }, { id: "review", label: "Revisar y emparejar", icon: "list" }]} value={tab} onChange={setTab} />
      </div>

      {tab === "import" && (
        <Card style={{ padding: isMobile ? 16 : "22px 24px" }} className="card-pad-lg">
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "200px 1fr", gap: 16, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", marginBottom: 7 }}>Categoría</div>
              <div style={{ position: "relative" }}>
                <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: "100%", appearance: "none", WebkitAppearance: "none", padding: "11px 32px 11px 13px", borderRadius: 11, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 14, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                  {Object.values(CATS).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Icon name="chevdown" size={15} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", marginBottom: 7 }}>Modo de entrada</div>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 14 }}>
                {[["manual", "edit", "Manual"], ["image", "eye", "Imagen / foto"], ["excel", "upload", "Excel"]].map(([id, ic, lb]) => {
                  const on = mode === id;
                  return <button key={id} onClick={() => setMode(id)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10, border: `1px solid ${on ? "var(--accent)" : "var(--line-strong)"}`, background: on ? "var(--accent-soft)" : "var(--surface)", color: on ? "var(--accent-strong)" : "var(--text-soft)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)" }}><Icon name={ic} size={15} />{lb}</button>;
                })}
              </div>
              {mode === "image" && (
                <div style={{ border: "2px dashed var(--line-strong)", borderRadius: "var(--radius)", padding: "30px 20px", textAlign: "center", background: "var(--surface-2)" }}>
                  <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}><Icon name="eye" size={22} /></div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Sube una foto de la tabla de posiciones</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-mute)", marginTop: 4 }}>La IA detecta posiciones y nombres de equipos</div>
                </div>
              )}
              {mode === "manual" && (
                <textarea rows={6} placeholder={"1. Los Andes Quito\n2. Spartans BC\n3. Águilas Doradas…"} style={{ width: "100%", resize: "vertical", padding: "12px 14px", borderRadius: "var(--radius)", border: "1px solid var(--line-strong)", background: "var(--surface-2)", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7, outline: "none" }} />
              )}
              {mode === "excel" && (
                <div style={{ border: "2px dashed var(--line-strong)", borderRadius: "var(--radius)", padding: "30px 20px", textAlign: "center", background: "var(--surface-2)" }}>
                  <Icon name="upload" size={24} style={{ color: "var(--accent)", marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Arrastra tu planilla .xlsx</div>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <Btn variant="primary" icon="zap" onClick={() => setTab("review")}>Detectar posiciones</Btn>
          </div>
        </Card>
      )}

      {tab === "review" && (
        <>
          <Card>
            <CardHead title={`Posiciones detectadas · ${CATS[cat].name}`} sub="Verifica el emparejamiento con los equipos del torneo" icon="list"
              right={<SevTag sev="warn" size="sm">2 baja confianza</SevTag>} />
            <TableScroll minWidth={620}>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1.3fr 1.3fr 130px 70px", padding: "10px 16px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
                <div>Pos.</div><div>Detectado</div><div>Equipo del torneo</div><div>Confianza</div><div style={{ textAlign: "right" }}>Editar</div>
              </div>
              {STANDINGS.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1.3fr 1.3fr 130px 70px", alignItems: "center", padding: "12px 16px", borderBottom: i < STANDINGS.length - 1 ? "1px solid var(--line)" : "none", background: r.conf < 75 ? "color-mix(in srgb, var(--warn-bg) 45%, transparent)" : "transparent" }}>
                  <div className="mono" style={{ fontWeight: 800, fontSize: 15, color: "var(--accent)" }}>{r.pos}</div>
                  <div className="mono" style={{ fontSize: 12.5, color: "var(--text-soft)", fontWeight: 600 }}>{r.detected}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13.5 }}><Icon name="arrowright" size={13} style={{ color: "var(--text-mute)" }} />{r.matched}</div>
                  <div><ConfBar v={r.conf} /></div>
                  <div style={{ textAlign: "right" }}><button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--text-mute)", display: "inline-grid", placeItems: "center", cursor: "pointer" }}><Icon name="edit" size={14} /></button></div>
                </div>
              ))}
            </TableScroll>
          </Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <Btn variant="ghost" icon="chevleft" onClick={() => setTab("import")}>Atrás</Btn>
            <div style={{ flex: 1 }} />
            <Btn variant="primary" icon="zap" onClick={() => nav("dryrun")}>Confirmar y generar playoffs</Btn>
          </div>
        </>
      )}
    </div>
  );
}

window.StandingsScreen = StandingsScreen;

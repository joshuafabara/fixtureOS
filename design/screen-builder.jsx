/* fixtureOS — Screen: Fixture Builder (configure + generate) */

function BuilderScreen() {
  const { nav } = useNav();
  const { isMobile, narrow } = useViewport();
  const [base, setBase] = React.useState("V4");
  const [picked, setPicked] = React.useState(() => CATEGORIES.filter((c) => c.status === "ready").map((c) => c.id));
  const toggle = (id, ready) => { if (!ready) return; setPicked((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]); };
  const readyCount = picked.length;
  const incomplete = CATEGORIES.filter((c) => c.status !== "ready");
  const canGenerate = readyCount > 0;

  return (
    <div className="screen-pad" style={{ maxWidth: 1180, margin: "0 auto" }}>
      <PageHeader eyebrow="Torneos · Copa Apertura 2026" title="Constructor de fixture"
        sub="Selecciona la base y las categorías a generar. El motor respeta contexto y overrides manuales." />

      <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        {/* Left config */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <CardHead title="Base de generación" sub="La nueva versión se construye sobre esta" icon="layers" />
            <div style={{ padding: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 200px" }}>
                <select value={base} onChange={(e) => setBase(e.target.value)} style={{ width: "100%", appearance: "none", WebkitAppearance: "none", padding: "11px 32px 11px 14px", borderRadius: 11, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 14, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                  {VERSIONS.map((v) => <option key={v.v} value={v.v}>{v.v} · {STATE_MAP[v.state].label} · {v.date.split("·")[0]}</option>)}
                </select>
                <Icon name="chevdown" size={15} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
              </div>
              <Btn variant="ghost" icon="sliders" onClick={() => nav("ctxtournament")}>Ver contexto</Btn>
            </div>
          </Card>

          <Card>
            <CardHead title="Categorías a generar" sub={`${readyCount} de ${CATEGORIES.length} seleccionadas`} icon="layers"
              right={<button onClick={() => setPicked(CATEGORIES.filter((c) => c.status === "ready").map((c) => c.id))} style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>Todas las listas</button>} />
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              {CATEGORIES.map((c) => {
                const ready = c.status === "ready";
                const on = picked.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggle(c.id, ready)} disabled={!ready} style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 14px", borderRadius: 11, border: `1px solid ${on ? "var(--accent-soft-2)" : "var(--line)"}`, background: on ? "var(--accent-soft)" : ready ? "var(--surface)" : "var(--surface-2)", cursor: ready ? "pointer" : "not-allowed", opacity: ready ? 1 : .65, textAlign: "left", fontFamily: "var(--font-sans)", width: "100%" }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${on ? "var(--accent)" : "var(--line-strong)"}`, background: on ? "var(--accent)" : "transparent", display: "grid", placeItems: "center", flex: "0 0 auto" }}>{on && <Icon name="check" size={14} style={{ color: "#fff" }} sw={2.6} />}</span>
                    <CatBadge cat={c.id} />
                    <span className="mono" style={{ fontSize: 12.5, color: "var(--text-mute)", fontWeight: 700 }}>{c.teams} equipos</span>
                    <div style={{ flex: 1 }} />
                    {ready ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--ok)" }}><Icon name="checkcircle" size={14} sw={2.2} />Lista</span>
                      : <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--warn)" }}><Icon name="alert" size={14} sw={2.2} />Falta config.</span>}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right validation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>Validación</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {CATEGORIES.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
                  <Icon name={c.status === "ready" ? "checkcircle" : "alert"} size={15} style={{ color: c.status === "ready" ? "var(--ok)" : "var(--warn)", flex: "0 0 auto" }} sw={2.2} />
                  <span style={{ fontWeight: 700 }}>{c.name}</span>
                  <span style={{ color: "var(--text-mute)", fontSize: 12.5 }}>{c.status === "ready" ? "lista para generar" : c.start === "—" ? "falta fecha y modo" : "falta modo de juego"}</span>
                </div>
              ))}
            </div>
            {incomplete.length > 0 && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 11, background: "var(--warn-bg)", border: "1px solid var(--warn-line)", fontSize: 12.5, color: "var(--text-soft)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--warn)" }}>{incomplete.length} categoría(s) incompleta(s)</strong> se omitirán. <span style={{ color: "var(--accent)", fontWeight: 700, cursor: "pointer" }} onClick={() => nav("tournament")}>Completar ahora →</span>
              </div>
            )}
          </Card>

          <Card style={{ padding: 18, position: narrow ? "static" : "sticky", top: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)" }}>Listo para generar</span>
              <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{readyCount}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-mute)", marginBottom: 14 }}>categorías · base {base}</div>
            <Btn variant="primary" icon="zap" style={{ justifyContent: "center", width: "100%", opacity: canGenerate ? 1 : .55, cursor: canGenerate ? "pointer" : "not-allowed" }} onClick={() => canGenerate && nav("dryrun")}>Generar Dry Run</Btn>
            <div style={{ fontSize: 11.5, color: "var(--text-mute)", marginTop: 11, lineHeight: 1.5, display: "flex", gap: 7 }}>
              <Icon name="lock" size={14} style={{ flex: "0 0 auto", marginTop: 1 }} />No se publica nada todavía. Revisarás los cambios en el Dry Run.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

window.BuilderScreen = BuilderScreen;

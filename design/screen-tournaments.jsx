/* fixtureOS — Screen: Tournaments List
   Tournament is chosen via a single dropdown (never shown side-by-side).
   Selecting one reveals its summary + entry points. */

function TournamentDropdown({ value, onChange }) {
  const { nav } = useNav();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", off, true);
    return () => document.removeEventListener("pointerdown", off, true);
  }, [open]);
  const cur = TOURNAMENTS.find((t) => t.id === value) || TOURNAMENTS[0];

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", maxWidth: 560 }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "var(--text-mute)", marginBottom: 7 }}>Torneo seleccionado</div>
      <button onClick={() => setOpen((o) => !o)} style={{
        display: "flex", alignItems: "center", gap: 13, width: "100%", padding: "13px 15px", borderRadius: "var(--radius)",
        border: `1px solid ${open ? "var(--accent)" : "var(--line-strong)"}`, background: "var(--surface)", cursor: "pointer",
        fontFamily: "var(--font-sans)", boxShadow: open ? "0 0 0 3px var(--accent-soft)" : "var(--shadow-sm)", textAlign: "left",
      }}>
        <span style={{ width: 42, height: 42, borderRadius: 11, background: "linear-gradient(150deg, var(--accent-hot), var(--accent-strong))", color: "#fff", display: "grid", placeItems: "center", flex: "0 0 auto", boxShadow: "0 6px 16px color-mix(in srgb, var(--accent) 32%, transparent)" }}><Icon name="trophy" size={21} /></span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: 16.5, letterSpacing: -.3, color: "var(--text)" }}>{cur.name}</span>
            <StatePill state={cur.state} />
          </span>
          <span style={{ display: "block", fontSize: 12.5, color: "var(--text-mute)", marginTop: 3, fontWeight: 600 }}>{cur.sport} · {cur.teams} equipos · {cur.cats} categorías · Versión {cur.version}</span>
        </span>
        <Icon name="chevdown" size={18} style={{ color: "var(--text-mute)", flex: "0 0 auto", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 8, zIndex: 40, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--shadow-lg)", padding: 8, maxHeight: 360, overflowY: "auto" }}>
          {TOURNAMENTS.map((t) => {
            const on = t.id === value;
            return (
              <button key={t.id} onClick={() => { onChange(t.id); setOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 12px", borderRadius: 10, marginBottom: 2,
                border: `1px solid ${on ? "var(--accent-soft-2)" : "transparent"}`, background: on ? "var(--accent-soft)" : "transparent",
                cursor: "pointer", fontFamily: "var(--font-sans)", textAlign: "left",
              }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: on ? "var(--surface)" : "var(--ink-100)", color: "var(--accent)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name="trophy" size={17} /></span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{t.name}</span>
                    <StatePill state={t.state} dot={false} />
                  </span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--text-mute)", marginTop: 2 }}>{t.teams} equipos · {t.cats} categorías · {t.version}</span>
                </span>
                {on && <Icon name="check" size={17} style={{ color: "var(--accent)", flex: "0 0 auto" }} sw={2.4} />}
              </button>
            );
          })}
          <div style={{ height: 1, background: "var(--line)", margin: "6px 4px" }} />
          <button onClick={() => { setOpen(false); nav("newtournament"); }} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px dashed var(--line-strong)", background: "transparent", color: "var(--accent)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            <Icon name="plus" size={16} /> Crear nuevo torneo
          </button>
        </div>
      )}
    </div>
  );
}

function TournamentsScreen() {
  const { nav } = useNav();
  const { isMobile } = useViewport();
  const [sel, setSel] = React.useState("t1");
  const cur = TOURNAMENTS.find((t) => t.id === sel) || TOURNAMENTS[0];
  const ready = cur.state === "published";

  const kpis = [
    ["Versión actual", cur.version, ready ? "Publicada" : "Borrador activo", "layers"],
    ["Equipos inscritos", String(cur.teams), `${cur.cats} categorías`, "users"],
    ["Fechas publicadas", ready ? "18 / 30" : "0 / 24", ready ? "60% del torneo" : "Sin publicar", "calendar"],
    ["Conflictos abiertos", ready ? "1" : "0", ready ? "1 crítico" : "Sin conflictos", "alert"],
  ];

  return (
    <div className="screen-pad" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <PageHeader
        title="Torneos"
        sub={`${TOURNAMENTS.length} torneos en Quito Basket Liga · elige uno para gestionarlo`}
        right={<>
          <Btn variant="ghost" icon="upload" onClick={() => nav("import")}>Importar</Btn>
          <Btn variant="primary" icon="plus" onClick={() => nav("newtournament")}>Nuevo torneo</Btn>
        </>}
      />

      <Card style={{ padding: isMobile ? 16 : "20px 22px", marginBottom: 16 }}>
        <TournamentDropdown value={sel} onChange={setSel} />
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {kpis.map(([l, v, s, ic], i) => (
          <Card key={i} style={{ padding: "15px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={ic} size={15} /></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)" }}>{l}</span>
            </div>
            <div className="mono tnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, marginTop: 10, lineHeight: 1, color: l.includes("Conflictos") && ready ? "var(--crit)" : "var(--text)" }}>{v}</div>
            <div style={{ fontSize: 11.5, marginTop: 5, color: "var(--text-mute)" }}>{s}</div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHead title={cur.name} sub={`${cur.sport} · 11–13 Julio 2026`} icon="trophy"
          right={<Btn variant="primary" size="sm" icon="arrowright" onClick={() => nav("tournament")}>Abrir detalle</Btn>} />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 0 }}>
          <div style={{ padding: "16px 18px", borderRight: isMobile ? "none" : "1px solid var(--line)", borderBottom: isMobile ? "1px solid var(--line)" : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", marginBottom: 12 }}>Categorías</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {CATEGORIES.map((c) => <CatBadge key={c.id} cat={c.id} size="sm" />)}
            </div>
            <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--text-soft)", lineHeight: 1.5 }}>
              {ready ? "1 categoría (Senior) requiere fecha de inicio y modo de juego." : "Completa la configuración de categorías para generar el fixture."}
            </div>
          </div>
          <div style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", marginBottom: 12 }}>Acciones rápidas</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[["Ver fixture", "layers", () => nav("fixture")], ["Generar Dry Run", "zap", () => nav("dryrun")], ["Constructor de fixture", "edit", () => nav("builder")], ["Posiciones y playoffs", "list", () => nav("standings")], ["Exportes", "download", () => nav("exports")], ["Vista pública", "external", () => nav("public")]].map(([lb, ic, fn], i) => (
                <button key={i} onClick={fn} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface-2)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, color: "var(--text)", textAlign: "left", width: "100%" }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={ic} size={14} /></span>
                  {lb}
                  <Icon name="chevright" size={15} style={{ color: "var(--text-mute)", marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

window.TournamentsScreen = TournamentsScreen;

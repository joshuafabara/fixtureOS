/* Dashboard Direction C — "Scoreboard"
   Dense control-panel. Slim icon rail, mono KPI strip, tight fixture
   table, week heat-map. Power-user, utilitarian, sporty. */

function DashScoreboard() {
  const NAV = [
    ["dashboard", "Panel", true], ["trophy", "Torneos"], ["layers", "Fixture"],
    ["building", "Clubes"], ["message", "Comunicaciones"], ["settings", "Configuración"],
  ];
  const W = "1360", H = "940";

  const KPIS = [
    ["Torneos", "03", "+1", "ok"], ["Dry runs", "02", "pend.", "warn"],
    ["Fechas pub.", "18", "+4", "ok"], ["Partidos", "126", "total", ""],
    ["Conflictos", "02", "críticos", "crit"], ["Sin WA", "03", "clubes", "warn"],
  ];

  const DAYS = ["Vie 11", "Sáb 12", "Dom 13"];
  // load matrix court x day (count)
  const heat = [
    [0, 3, 1], [2, 2, 1], [1, 2, 0], [0, 1, 1],
  ];
  const heatColor = (n) => n === 0 ? "var(--ink-100)" : n === 1 ? "var(--accent-soft-2)" : n === 2 ? "#fbbf90" : "var(--accent)";

  const rows = MATCHES.map((m, i) => ({ ...m, no: String(i + 1).padStart(2, "0"), dur: "60'" }));

  return (
    <div className="fos" style={{ width: W, height: H, display: "flex", background: "var(--page)", overflow: "hidden", fontSize: 14 }}>
      {/* Icon rail */}
      <aside style={{ width: 70, flex: "0 0 70px", background: "var(--surface)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent)", display: "grid", placeItems: "center", color: "#fff", boxShadow: "0 4px 12px rgba(234,88,12,.4)", marginBottom: 20 }}>
          <Icon name="zap" size={20} sw={2.2} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", alignItems: "center" }}>
          {NAV.map(([ic, lb, active]) => (
            <div key={lb} title={lb} style={{ width: 44, height: 44, borderRadius: 11, display: "grid", placeItems: "center",
              background: active ? "var(--accent-soft)" : "transparent", color: active ? "var(--accent-strong)" : "var(--text-mute)", cursor: "pointer" }}>
              <Icon name={ic} size={20} sw={active ? 2.1 : 1.9} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", width: 38, height: 38, borderRadius: 99, background: "linear-gradient(135deg,#1e293b,#475569)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12 }}>AR</div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ height: 58, flex: "0 0 58px", borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 12, padding: "0 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 800, letterSpacing: -.2 }}>
            Quito Basket Liga <Icon name="chevright" size={14} style={{ color: "var(--text-mute)" }} />
            <span style={{ color: "var(--accent)" }}>Copa Apertura 2026</span>
            <Icon name="chevdown" size={15} style={{ color: "var(--text-mute)" }} />
          </div>
          <div style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 7, background: "var(--ok-bg)", color: "var(--ok)", fontSize: 11.5, fontWeight: 800, border: "1px solid var(--ok-line)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor" }} /> V5 · PUBLICADO
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 8, background: "var(--ink-50)", border: "1px solid var(--line)", color: "var(--text-mute)", fontSize: 12.5, width: 200 }}>
            <Icon name="search" size={15} /> Buscar partido, club…
          </div>
          <button style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", display: "grid", placeItems: "center", color: "var(--text-soft)", cursor: "pointer" }}><Icon name="bell" size={17} /></button>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 9, background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
            <Icon name="zap" size={15} sw={2.2} /> Dry Run
          </button>
        </header>

        <div style={{ flex: 1, overflow: "hidden", padding: "18px 22px 0" }}>
          {/* KPI strip */}
          <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow-sm)", marginBottom: 16, overflow: "hidden" }}>
            {KPIS.map(([lb, val, delta, tone], i) => (
              <div key={lb} style={{ flex: 1, padding: "14px 18px", borderLeft: i ? "1px solid var(--line)" : "none" }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-mute)" }}>{lb}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 7 }}>
                  <span className="mono tnum" style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1,
                    color: tone === "crit" ? "var(--crit)" : tone === "warn" ? "var(--warn)" : "var(--text)" }}>{val}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: tone === "ok" ? "var(--ok)" : tone === "crit" ? "var(--crit)" : tone === "warn" ? "var(--warn)" : "var(--text-mute)" }}>{delta}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            {/* Dense fixture table */}
            <div style={{ flex: "1 1 0", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -.2 }}>Fixture · Jornada 3</div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-mute)", padding: "3px 8px", background: "var(--ink-100)", borderRadius: 6 }}>{rows.length} partidos</span>
                </div>
                <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--ink-100)", borderRadius: 8 }}>
                  {["Lista", "Calendario"].map((t, i) => (
                    <span key={t} style={{ padding: "5px 11px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: i === 0 ? "var(--surface)" : "transparent", color: i === 0 ? "var(--text)" : "var(--text-mute)", boxShadow: i === 0 ? "var(--shadow-sm)" : "none", cursor: "pointer" }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "34px 60px 1fr 110px 56px 96px", padding: "8px 18px", fontSize: 10.5, fontWeight: 800, letterSpacing: .6, textTransform: "uppercase", color: "var(--text-mute)", background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
                <div>#</div><div>Hora</div><div>Partido</div><div>Cancha</div><div>Dur</div><div style={{ textAlign: "right" }}>Estado</div>
              </div>
              <div>
                {rows.map((m, i) => (
                  <div key={m.id} style={{ display: "grid", gridTemplateColumns: "34px 60px 1fr 110px 56px 96px", alignItems: "center", padding: "9px 18px", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none", fontSize: 13 }}>
                    <div className="mono" style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 600 }}>{m.no}</div>
                    <div className="mono" style={{ fontWeight: 700 }}>{m.time}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: CAT_VARS[CATS[m.cat].key].dot, flex: "0 0 auto" }} />
                      <span style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.home} <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>vs</span> {m.away}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-soft)", fontWeight: 600 }}>{m.court}</div>
                    <div className="mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>{m.dur}</div>
                    <div style={{ textAlign: "right" }}><StatePill state={m.state} dot={false} /></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right rail */}
            <div style={{ flex: "0 0 300px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow-sm)", padding: "15px 17px" }}>
                <div style={{ fontWeight: 800, fontSize: 14.5, letterSpacing: -.2, marginBottom: 13 }}>Mapa de la semana</div>
                <div style={{ display: "grid", gridTemplateColumns: "86px repeat(3,1fr)", gap: 6, alignItems: "center" }}>
                  <div />
                  {DAYS.map((d) => <div key={d} style={{ fontSize: 10.5, fontWeight: 800, color: "var(--text-mute)", textAlign: "center" }}>{d}</div>)}
                  {COURTS.map((c, ci) => (
                    <React.Fragment key={c}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-soft)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c}</div>
                      {heat[ci].map((n, di) => (
                        <div key={di} style={{ height: 34, borderRadius: 7, background: heatColor(n), display: "grid", placeItems: "center",
                          color: n >= 2 ? "#fff" : "var(--text-soft)", fontWeight: 700, fontSize: 12 }} className="mono">{n || ""}</div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 10.5, color: "var(--text-mute)", fontWeight: 600 }}>
                  Menos
                  {[0, 1, 2, 3].map((n) => <span key={n} style={{ width: 16, height: 10, borderRadius: 3, background: heatColor(n) }} />)}
                  Más
                </div>
              </div>

              <div style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow-sm)", padding: "15px 17px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 14.5, letterSpacing: -.2 }}>Por revisar</div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent)", cursor: "pointer" }}>Ver todo</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {[
                    ["crit", "Solapamiento de cancha", "U16 · Cancha Norte · 10:30"],
                    ["crit", "Equipo retirado sin resolver", "Senior · Dragones"],
                    ["warn", "3 clubes sin WhatsApp", "Cóndores, Toros, Dragones"],
                    ["info", "2 dry runs pendientes", "Generados hoy"],
                  ].map(([sev, t, d], i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "9px 10px", borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                      <div style={{ flex: "0 0 auto", marginTop: 1, color: sev === "crit" ? "var(--crit)" : sev === "warn" ? "var(--warn)" : "var(--info)" }}>
                        <Icon name={sev === "info" ? "zap" : "alert"} size={16} sw={2.1} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3 }}>{t}</div>
                        <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}>{d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DashScoreboard = DashScoreboard;

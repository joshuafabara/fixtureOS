/* Dashboard Direction B — "Court Side"
   Dark navy sidebar, energetic ops console. Filled orange hero stat,
   live "Hoy en cancha" board, category progress rail. */

function DashCourtside() {
  const NAV = [
    ["dashboard", "Panel", true], ["trophy", "Torneos"], ["layers", "Fixture"],
    ["building", "Clubes"], ["message", "Comunicaciones"], ["settings", "Configuración"],
  ];
  const W = "1360", H = "940";

  // matches grouped by court (today)
  const board = COURTS.map((c) => ({
    court: c,
    items: MATCHES.filter((m) => m.court === c).slice(0, 2),
  }));

  const catProgress = [
    { cat: "u12", pub: 8, total: 10 }, { cat: "u14", pub: 6, total: 9 },
    { cat: "u16", pub: 4, total: 12 }, { cat: "u18", pub: 3, total: 6 },
    { cat: "sub21", pub: 2, total: 6 }, { cat: "senior", pub: 0, total: 5 },
  ];

  const Tile = ({ icon, label, value, sub, filled, tone }) => (
    <div style={{ flex: 1, borderRadius: "var(--radius)", padding: "16px 18px",
      background: filled ? "linear-gradient(150deg,#f97316,#ea580c)" : "var(--surface)",
      border: filled ? "none" : "1px solid var(--line)", color: filled ? "#fff" : "var(--text)",
      boxShadow: filled ? "0 10px 26px rgba(234,88,12,.32)" : "var(--shadow-sm)", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center",
          background: filled ? "rgba(255,255,255,.2)" : "var(--ink-100)", color: filled ? "#fff" : (tone || "var(--ink-500)") }}>
          <Icon name={icon} size={16} />
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, opacity: filled ? .95 : 1, color: filled ? "#fff" : "var(--text-soft)" }}>{label}</div>
      </div>
      <div className="mono tnum" style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1.2, marginTop: 12, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, marginTop: 5, opacity: filled ? .9 : 1, color: filled ? "#fff" : "var(--text-mute)" }}>{sub}</div>
    </div>
  );

  return (
    <div className="fos" style={{ width: W, height: H, display: "flex", background: "var(--page)", overflow: "hidden", fontSize: 14 }}>
      {/* Dark Sidebar */}
      <aside style={{ width: 236, flex: "0 0 236px", background: "var(--ink-950)", color: "#cdd7e6", display: "flex", flexDirection: "column", padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 24px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--accent)", display: "grid", placeItems: "center", color: "#fff", boxShadow: "0 4px 14px rgba(234,88,12,.5)" }}>
            <Icon name="zap" size={18} sw={2.2} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: -.4, color: "#fff" }}>fixture<span style={{ color: "var(--accent-hot)" }}>OS</span></div>
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#56688a", padding: "0 10px 8px" }}>Menú</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV.map(([ic, lb, active]) => (
            <div key={lb} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 11px", borderRadius: 9,
              background: active ? "linear-gradient(90deg,rgba(234,88,12,.22),rgba(234,88,12,.05))" : "transparent",
              color: active ? "#fff" : "#9fb0c9", fontWeight: active ? 700 : 600, fontSize: 13.5, cursor: "pointer", position: "relative" }}>
              {active && <span style={{ position: "absolute", left: -16, top: 8, bottom: 8, width: 3, borderRadius: 3, background: "var(--accent-hot)" }} />}
              <Icon name={ic} size={18} style={{ color: active ? "var(--accent-hot)" : "#7689a8" }} />{lb}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", borderRadius: 12, padding: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: "#fff" }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--accent-hot)" }} /> En vivo · Sáb 12 Jul
          </div>
          <div style={{ fontSize: 11.5, color: "#8da0bd", marginTop: 5, lineHeight: 1.45 }}>5 partidos hoy en 4 canchas</div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ height: 62, flex: "0 0 62px", borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 14, padding: "0 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 9, border: "1px solid var(--line)", fontSize: 13, fontWeight: 700 }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: "var(--ink-800)", color: "#fff", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800 }}>QB</span>
            Quito Basket Liga <Icon name="chevdown" size={14} style={{ color: "var(--text-mute)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", borderRadius: 9, background: "var(--accent-soft)", border: "1px solid var(--accent-soft-2)", fontSize: 13, fontWeight: 700, color: "var(--accent-strong)" }}>
            <Icon name="trophy" size={15} /> Copa Apertura 2026 <Icon name="chevdown" size={15} />
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: 9, background: "var(--ink-50)", border: "1px solid var(--line)", color: "var(--text-mute)", fontSize: 13, width: 200 }}>
            <Icon name="search" size={16} /> Buscar…
          </div>
          <button style={{ width: 38, height: 38, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", display: "grid", placeItems: "center", color: "var(--text-soft)", position: "relative", cursor: "pointer" }}>
            <Icon name="bell" size={18} /><span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: 9, background: "var(--accent)", border: "2px solid var(--surface)" }} />
          </button>
          <div style={{ width: 38, height: 38, borderRadius: 99, background: "linear-gradient(135deg,#1e293b,#475569)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13 }}>AR</div>
        </header>

        <div style={{ flex: 1, overflow: "hidden", padding: "22px 26px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -.7, margin: 0, whiteSpace: "nowrap" }}>Centro de operaciones</h1>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 15px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line-strong)", color: "var(--text)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
                <Icon name="download" size={16} /> Exportar
              </button>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 13.5, border: "none", cursor: "pointer", boxShadow: "0 6px 18px rgba(234,88,12,.3)" }}>
                <Icon name="zap" size={16} sw={2.2} /> Generar Dry Run
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
            <Tile icon="zap" label="Dry runs pendientes" value="2" sub="Toca para revisar →" filled />
            <Tile icon="trophy" label="Torneos activos" value="3" sub="1 publicado · 2 borrador" tone="var(--accent)" />
            <Tile icon="calendar" label="Fechas publicadas" value="18" sub="+4 esta semana" tone="var(--ok)" />
            <Tile icon="phone" label="Contactos faltantes" value="3" sub="clubes sin WhatsApp" tone="var(--warn)" />
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            {/* Court board */}
            <div style={{ flex: "1 1 0", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)", padding: "16px 18px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -.3 }}>Hoy en cancha</div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: "var(--text-mute)" }}><Icon name="calendar" size={14} /> Sábado 12 Julio</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {board.map((col) => (
                  <div key={col.court} style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 11, padding: 10, minHeight: 230 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--text)", paddingBottom: 9, marginBottom: 4, borderBottom: "1px solid var(--line)" }}>
                      <Icon name="pin" size={13} style={{ color: "var(--accent)" }} /> {col.court}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {col.items.length ? col.items.map((m) => {
                        const v = CAT_VARS[CATS[m.cat].key];
                        return (
                          <div key={m.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderLeft: `3px solid ${v.dot}`, borderRadius: 8, padding: "8px 9px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                              <span className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{m.time}</span>
                              <CatBadge cat={m.cat} size="sm" dot={false} />
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.35 }}>{m.home}</div>
                            <div style={{ fontSize: 11, color: "var(--text-mute)", lineHeight: 1.35 }}>vs {m.away}</div>
                          </div>
                        );
                      }) : <div style={{ fontSize: 11.5, color: "var(--text-mute)", textAlign: "center", padding: "20px 0" }}>Sin partidos</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category progress */}
            <div style={{ flex: "0 0 300px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)", padding: "16px 18px" }}>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -.3, marginBottom: 14 }}>Avance por categoría</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {catProgress.map((c) => {
                  const v = CAT_VARS[CATS[c.cat].key];
                  const pct = Math.round((c.pub / c.total) * 100);
                  return (
                    <div key={c.cat}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <CatBadge cat={c.cat} size="sm" />
                        <span className="mono tnum" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)" }}>{c.pub}/{c.total} fechas</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 99, background: "var(--ink-100)", overflow: "hidden" }}>
                        <div style={{ width: pct + "%", height: "100%", borderRadius: 99, background: v.dot }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Conflictos abiertos</span>
                  <SevTag sev="crit" size="sm">2 críticos</SevTag>
                </div>
                <div style={{ marginTop: 9, fontSize: 12, color: "var(--text-mute)", lineHeight: 1.5 }}>Solapamiento de cancha en U16 · revisar antes de publicar.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DashCourtside = DashCourtside;

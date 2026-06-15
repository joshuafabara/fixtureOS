/* Dashboard Direction A — "Hardwood"
   Light, editorial, confident. White sidebar, bold display headers,
   restrained orange, airy stat cards with mono numerals. */

function DashHardwood() {
  const NAV = [
    ["dashboard", "Panel", true], ["trophy", "Torneos"], ["layers", "Fixture"],
    ["building", "Clubes"], ["message", "Comunicaciones"], ["settings", "Configuración"],
  ];
  const W = "1360", H = "940";

  const Stat = ({ icon, label, value, sub, tone, trend }) => (
    <div style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)",
      borderRadius: "var(--radius)", padding: "18px 20px 16px", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center",
          background: tone ? "var(--accent-soft)" : "var(--ink-100)", color: tone ? "var(--accent)" : "var(--ink-500)" }}>
          <Icon name={icon} size={18} />
        </div>
        {trend && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12,
          fontWeight: 700, color: trend[0] === "+" ? "var(--ok)" : "var(--warn)" }}>
          <Icon name={trend[0] === "+" ? "arrowup" : "arrowdown"} size={13} sw={2.4} />{trend.slice(1)}</span>}
      </div>
      <div className="mono tnum" style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.5, marginTop: 14, lineHeight: 1, color: "var(--text)" }}>{value}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 8, color: "var(--text)" }}>{label}</div>
      <div style={{ fontSize: 12.5, color: "var(--text-mute)", marginTop: 2 }}>{sub}</div>
    </div>
  );

  return (
    <div className="fos" style={{ width: W, height: H, display: "flex", background: "var(--page)", overflow: "hidden", fontSize: 14 }}>
      {/* Sidebar */}
      <aside style={{ width: 236, flex: "0 0 236px", background: "var(--surface)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 22px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--accent)", display: "grid", placeItems: "center", color: "#fff", boxShadow: "0 4px 12px rgba(234,88,12,.35)" }}>
            <Icon name="zap" size={18} sw={2.2} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: -.4 }}>fixture<span style={{ color: "var(--accent)" }}>OS</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(([ic, lb, active]) => (
            <div key={lb} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", borderRadius: 9,
              background: active ? "var(--accent-soft)" : "transparent", color: active ? "var(--accent-strong)" : "var(--text-soft)",
              fontWeight: active ? 700 : 600, fontSize: 13.5, cursor: "pointer", position: "relative" }}>
              {active && <span style={{ position: "absolute", left: -16, top: 9, bottom: 9, width: 3, borderRadius: 3, background: "var(--accent)" }} />}
              <Icon name={ic} size={18} sw={active ? 2.1 : 1.9} />{lb}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>Dry runs pendientes</div>
          <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 3, lineHeight: 1.4 }}>2 revisiones requieren tu aprobación.</div>
          <div style={{ marginTop: 11, padding: "8px 0", borderRadius: 8, background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 12.5, textAlign: "center", cursor: "pointer" }}>Revisar ahora</div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <header style={{ height: 62, flex: "0 0 62px", borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 14, padding: "0 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, fontWeight: 700 }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: "var(--ink-800)", color: "#fff", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800 }}>QB</span>
            Quito Basket Liga
          </div>
          <div style={{ width: 1, height: 22, background: "var(--line)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", borderRadius: 9, border: "1px solid var(--line)", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
            <Icon name="trophy" size={15} style={{ color: "var(--accent)" }} /> Copa Apertura 2026
            <Icon name="chevdown" size={15} style={{ color: "var(--text-mute)", marginLeft: 2 }} />
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: 9, background: "var(--ink-50)", border: "1px solid var(--line)", color: "var(--text-mute)", fontSize: 13, width: 220 }}>
            <Icon name="search" size={16} /> Buscar…
          </div>
          <button style={{ width: 38, height: 38, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", display: "grid", placeItems: "center", color: "var(--text-soft)", position: "relative", cursor: "pointer" }}>
            <Icon name="bell" size={18} /><span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: 9, background: "var(--accent)", border: "2px solid var(--surface)" }} />
          </button>
          <div style={{ width: 38, height: 38, borderRadius: 99, background: "linear-gradient(135deg,#1e293b,#475569)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13 }}>AR</div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflow: "hidden", padding: "26px 26px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ minWidth: 0, flex: "1 1 auto" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 1.4 }}>Panel general</div>
              <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, margin: "4px 0 0", whiteSpace: "nowrap" }}>Buenos días, Andrés</h1>
              <p style={{ margin: "6px 0 0", color: "var(--text-mute)", fontSize: 14 }}>Copa Apertura 2026 · 48 equipos en 6 categorías</p>
            </div>
            <button style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 11, background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 6px 18px rgba(234,88,12,.3)" }}>
              <Icon name="zap" size={17} sw={2.2} /> Generar Dry Run
            </button>
          </div>

          <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
            <Stat icon="trophy" label="Torneos activos" value="3" sub="1 publicado · 2 borrador" tone trend="+1" />
            <Stat icon="zap" label="Dry runs pendientes" value="2" sub="requieren revisión" />
            <Stat icon="calendar" label="Fechas publicadas" value="18" sub="esta temporada" trend="+4" />
            <Stat icon="phone" label="Contactos faltantes" value="3" sub="sin WhatsApp" />
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            {/* Upcoming matches */}
            <div style={{ flex: "1 1 0", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -.3 }}>Próximos partidos</div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "var(--accent)", cursor: "pointer" }}>Ver fixture <Icon name="chevright" size={14} sw={2.3} /></span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "76px 1fr 110px", padding: "9px 20px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
                <div>Hora</div><div>Partido</div><div style={{ textAlign: "right" }}>Estado</div>
              </div>
              {MATCHES.slice(0, 6).map((m, i) => (
                <div key={m.id} style={{ display: "grid", gridTemplateColumns: "76px 1fr 110px", alignItems: "center", padding: "12px 20px", borderBottom: i < 5 ? "1px solid var(--line)" : "none" }}>
                  <div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{m.time}</div>
                    <div style={{ fontSize: 11, color: "var(--text-mute)" }}>{m.date.replace("Sáb ", "").replace("Dom ", "")}</div>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CatBadge cat={m.cat} size="sm" />
                      <span style={{ fontWeight: 700, fontSize: 13.5 }}>{m.home} <span style={{ color: "var(--text-mute)", fontWeight: 600 }}>vs</span> {m.away}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-mute)", marginTop: 3 }}>
                      <Icon name="pin" size={12} /> {m.court}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}><StatePill state={m.state} /></div>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div style={{ flex: "0 0 340px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid var(--line)", fontWeight: 800, fontSize: 16, letterSpacing: -.3 }}>Actividad reciente</div>
              <div style={{ padding: "6px 0" }}>
                {ACTIVITY.slice(0, 6).map((a, i) => {
                  const dot = { approve: "var(--ok)", edit: "var(--info)", publish: "var(--accent)", contact: "var(--cat-cia-dot)", alert: "var(--warn)", import: "var(--ink-400)" }[a.kind];
                  return (
                    <div key={i} style={{ display: "flex", gap: 11, padding: "7px 18px" }}>
                      <div style={{ position: "relative", flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ width: 9, height: 9, borderRadius: 99, background: dot, marginTop: 4, boxShadow: `0 0 0 3px color-mix(in srgb, ${dot} 16%, transparent)` }} />
                        {i < 5 && <span style={{ flex: 1, width: 2, background: "var(--line)", marginTop: 3 }} />}
                      </div>
                      <div style={{ paddingBottom: 8, minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                          <strong style={{ fontWeight: 700 }}>{a.user}</strong> <span style={{ color: "var(--text-soft)" }}>{a.action}</span> <strong style={{ fontWeight: 700 }}>{a.entity}</strong>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>{a.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DashHardwood = DashHardwood;

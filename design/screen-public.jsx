/* fixtureOS — Screen: Public Fixture (read-only, outside shell) */

function PublicScreen() {
  const { nav } = useNav();
  const { isMobile } = useViewport();
  const [cat, setCat] = React.useState("all");
  const pubDates = FIX_DATES.filter((d) => MATCHES.some((m) => m.dateKey === d.key && m.state === "published"));

  return (
    <div className="fos" style={{ minHeight: "100vh", width: "100vw", background: "var(--page)", fontFamily: "var(--font-sans)", color: "var(--text)" }}>
      {/* Public header */}
      <header style={{ background: "linear-gradient(150deg, var(--ink-900), var(--ink-950))", color: "#fff", padding: isMobile ? "20px 16px 26px" : "26px 40px 34px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name="zap" size={16} sw={2.2} /></div>
              <span style={{ fontWeight: 800, fontSize: 16 }}>fixture<span style={{ color: "var(--accent-hot)" }}>OS</span></span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#9fb0c9", padding: "3px 9px", borderRadius: 99, background: "rgba(255,255,255,.08)", marginLeft: 4 }}>Vista pública</span>
            </div>
            <button onClick={() => nav("dashboard")} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 9, border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.06)", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
              <Icon name="logout" size={14} /> Volver al panel
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#9fb0c9", fontWeight: 700 }}>
            <Icon name="basket" size={15} /> Quito Basket Liga
          </div>
          <h1 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, letterSpacing: -1, margin: "8px 0 0" }}>Copa Apertura 2026</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, fontSize: 13, color: "#aab8cc", fontWeight: 600, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="calendar" size={15} /> 11–13 Julio 2026</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="users" size={15} /> 48 equipos</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="pin" size={15} /> 4 canchas</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--accent-hot)" }}><Icon name="checkcircle" size={15} /> Solo fechas publicadas</span>
          </div>
        </div>
      </header>

      {/* Category filter */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: "var(--surface)", borderBottom: "1px solid var(--line)", padding: isMobile ? "11px 14px" : "12px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", gap: 7, overflowX: "auto" }} className="tbl-scroll">
          {[{ id: "all", name: "Todas" }, ...Object.values(CATS)].map((c) => {
            const on = cat === c.id;
            return (
              <button key={c.id} onClick={() => setCat(c.id)} style={{ flex: "0 0 auto", padding: "7px 14px", borderRadius: 99, border: `1px solid ${on ? "var(--accent)" : "var(--line)"}`, background: on ? "var(--accent)" : "var(--surface)", color: on ? "#fff" : "var(--text-soft)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)" }}>{c.name}</button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "18px 14px 60px" : "26px 40px 70px", display: "flex", flexDirection: "column", gap: 18 }}>
        {pubDates.map((d) => {
          const rows = MATCHES.filter((m) => m.dateKey === d.key && m.state === "published" && (cat === "all" || m.cat === cat)).sort((a, b) => a.time.localeCompare(b.time));
          if (!rows.length) return null;
          return (
            <div key={d.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent-soft)", color: "var(--accent-strong)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13 }} className="mono">{d.num}</span>
                <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -.3, margin: 0 }}>{d.label}</h2>
                <span style={{ fontSize: 12.5, color: "var(--text-mute)", fontWeight: 600 }}>{rows.length} partidos</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 10 }}>
                {rows.map((m) => {
                  const v = CAT_VARS[CATS[m.cat].key];
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 15px", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--line)", borderLeft: `3px solid ${v.dot}`, boxShadow: "var(--shadow-sm)" }}>
                      <div style={{ textAlign: "center", flex: "0 0 auto" }}>
                        <div className="mono" style={{ fontSize: 15, fontWeight: 800, letterSpacing: -.5 }}>{m.time}</div>
                        <div style={{ fontSize: 10.5, color: "var(--text-mute)", marginTop: 1 }}>{m.court.replace("Cancha ", "C. ")}</div>
                      </div>
                      <div style={{ width: 1, height: 34, background: "var(--line)" }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.home}</div>
                        <div style={{ fontSize: 12.5, color: "var(--text-mute)" }}>vs {m.away}</div>
                      </div>
                      <CatBadge cat={m.cat} size="sm" dot={false} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-mute)", marginTop: 8, lineHeight: 1.6 }}>
          Las fechas en borrador no se muestran aquí. Última actualización: hoy 14:20 · Versión pública V4.
        </div>
      </div>
    </div>
  );
}

window.PublicScreen = PublicScreen;

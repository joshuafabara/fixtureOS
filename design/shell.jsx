/* ===========================================================
   fixtureOS — App shell: dark sidebar + topbar (responsive)
   Desktop: static sidebar. Mobile: off-canvas drawer + hamburger.
   =========================================================== */

const NAV_ITEMS = [
  { ic: "dashboard", lb: "Panel",          screen: "dashboard" },
  { ic: "trophy",    lb: "Torneos",        screen: "tournaments" },
  { ic: "layers",    lb: "Fixture",        screen: "fixture" },
  { ic: "sliders",   lb: "Contexto",       screen: "context" },
  { ic: "building",  lb: "Clubes",         screen: "clubs" },
  { ic: "message",   lb: "Comunicaciones", screen: "comms" },
  { ic: "settings",  lb: "Configuración",  screen: "settings" },
];
const SCREEN_SECTION = {
  dashboard: "dashboard",
  tournaments: "tournaments", tournament: "tournaments", import: "tournaments", builder: "tournaments",
  fixture: "fixture", dryrun: "fixture", compare: "fixture", manualedit: "fixture", history: "fixture", standings: "fixture", standingsreview: "fixture",
  context: "context", ctxorg: "context", ctxtournament: "context", ctxcategory: "context", ctxdate: "context", ctxhistory: "context", ctxcompare: "context", ctximpact: "context",
  clubs: "clubs", clubdetail: "clubs", comms: "comms",
  settings: "settings", courts: "settings", users: "settings", org: "settings", audit: "settings", exports: "settings",
};

function Sidebar({ mobile, open, onClose, collapsed, onToggleCollapse }) {
  const { screen, nav } = useNav();
  const section = SCREEN_SECTION[screen] || "dashboard";
  const go = (s) => { nav(s); if (mobile && onClose) onClose(); };
  const mini = collapsed && !mobile;
  const W = mini ? 76 : 234;

  const panel = (
    <aside style={{
      width: W, flex: `0 0 ${W}px`, background: "var(--ink-950)", color: "#cdd7e6",
      display: "flex", flexDirection: "column", padding: mini ? "20px 12px" : "20px 16px", height: "100%",
      transition: "width .18s ease",
      ...(mobile ? { position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 70, animation: "fos-slide-in .22s cubic-bezier(.2,.8,.2,1)", boxShadow: "0 0 60px rgba(0,0,0,.5)" } : {}),
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: mini ? "4px 0 18px" : "4px 8px 18px", justifyContent: mini ? "center" : "flex-start" }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--accent)", display: "grid", placeItems: "center", color: "#fff", boxShadow: "0 4px 14px rgba(234,88,12,.5)", flex: "0 0 auto" }}>
          <Icon name="zap" size={18} sw={2.2} />
        </div>
        {!mini && <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: -.4, color: "#fff" }}>fixture<span style={{ color: "var(--accent-hot)" }}>OS</span></div>}
        {mobile && <button onClick={onClose} aria-label="Cerrar menú" style={{ marginLeft: "auto", width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "#cdd7e6", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="x" size={18} /></button>}
        {!mobile && !mini && <button onClick={onToggleCollapse} aria-label="Colapsar menú" title="Colapsar menú" style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#9fb0c9", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="chevleft" size={16} /></button>}
      </div>

      {!mobile && mini && (
        <button onClick={onToggleCollapse} aria-label="Expandir menú" title="Expandir menú" style={{ width: "100%", height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#9fb0c9", display: "grid", placeItems: "center", cursor: "pointer", marginBottom: 10 }}><Icon name="chevright" size={16} /></button>
      )}

      {!mini && <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#56688a", padding: "0 10px 8px" }}>Menú</div>}
      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {NAV_ITEMS.map((it) => {
          const active = section === it.screen;
          return (
            <button key={it.screen} onClick={() => go(it.screen)} title={mini ? it.lb : undefined} style={{
              display: "flex", alignItems: "center", gap: 11, padding: mini ? "11px 0" : "11px 11px", borderRadius: 9, border: "none", cursor: "pointer",
              justifyContent: mini ? "center" : "flex-start",
              background: active ? "linear-gradient(90deg,rgba(234,88,12,.22),rgba(234,88,12,.05))" : "transparent",
              color: active ? "#fff" : "#9fb0c9", fontWeight: active ? 700 : 600, fontSize: 13.5, fontFamily: "var(--font-sans)",
              position: "relative", textAlign: "left",
            }}>
              {active && <span style={{ position: "absolute", left: mini ? -12 : -16, top: 8, bottom: 8, width: 3, borderRadius: 3, background: "var(--accent-hot)" }} />}
              <Icon name={it.ic} size={18} style={{ color: active ? "var(--accent-hot)" : "#7689a8", flex: "0 0 auto" }} />{!mini && it.lb}
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", borderRadius: 12, padding: mini ? 10 : 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", display: mini ? "grid" : "block", placeItems: "center" }} title={mini ? "En vivo · hoy" : undefined}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: "#fff", justifyContent: mini ? "center" : "flex-start" }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--accent-hot)", boxShadow: "0 0 0 3px rgba(249,115,22,.25)", flex: "0 0 auto" }} />{!mini && "En vivo · hoy"}
        </div>
        {!mini && <div style={{ fontSize: 11.5, color: "#8da0bd", marginTop: 5, lineHeight: 1.45 }}>Sábado 12 Jul · 5 partidos en 4 canchas</div>}
      </div>
    </aside>
  );

  if (!mobile) return panel;
  if (!open) return null;
  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      {panel}
    </>
  );
}

function Topbar({ tweaksBtn, mobile, onMenu }) {
  const { nav } = useNav();
  return (
    <header style={{ height: 62, flex: "0 0 62px", borderBottom: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10, padding: mobile ? "0 14px" : "0 24px", zIndex: 5 }}>
      {mobile && (
        <button onClick={onMenu} aria-label="Abrir menú" style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--text)", display: "grid", placeItems: "center", cursor: "pointer", flex: "0 0 auto" }}>
          <Icon name="list" size={20} />
        </button>
      )}
      {mobile && (
        <button onClick={() => nav("dashboard")} style={{ display: "flex", alignItems: "center", gap: 8, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent)", display: "grid", placeItems: "center", color: "#fff" }}><Icon name="zap" size={15} sw={2.2} /></div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: -.4, color: "var(--text)" }}>fixture<span style={{ color: "var(--accent)" }}>OS</span></span>
        </button>
      )}
      {!mobile && (
        <>
          <button onClick={() => nav("dashboard")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)", color: "var(--text)" }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: "var(--ink-800)", color: "#fff", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800 }}>QB</span>
            Quito Basket Liga <Icon name="chevdown" size={14} style={{ color: "var(--text-mute)" }} />
          </button>
          <button onClick={() => nav("tournaments")} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", borderRadius: 9, border: "1px solid var(--accent-soft-2)", background: "var(--accent-soft)", fontSize: 13, fontWeight: 700, color: "var(--accent-strong)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            <Icon name="trophy" size={15} /> Copa Apertura 2026 <Icon name="chevdown" size={15} />
          </button>
        </>
      )}
      <div style={{ flex: 1 }} />
      {!mobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 13px", borderRadius: 9, background: "var(--ink-50)", border: "1px solid var(--line)", color: "var(--text-mute)", fontSize: 13, width: 210 }}>
          <Icon name="search" size={16} /> Buscar partido, club…
        </div>
      )}
      {mobile && <IconBtn icon="search" title="Buscar" />}
      {tweaksBtn}
      <IconBtn icon="bell" dot title="Notificaciones" />
      <button onClick={() => nav("login")} title="Cuenta · cerrar sesión" style={{ width: 38, height: 38, borderRadius: 99, border: "none", padding: 0, background: "linear-gradient(135deg,#1e293b,#475569)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, flex: "0 0 auto", cursor: "pointer", fontFamily: "var(--font-sans)" }}>AR</button>
    </header>
  );
}

function AppShell({ children, tweaksBtn }) {
  const { isMobile } = useViewport();
  const [drawer, setDrawer] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(() => { try { return localStorage.getItem("fos.sidebarCollapsed") === "1"; } catch (e) { return false; } });
  React.useEffect(() => { if (!isMobile) setDrawer(false); }, [isMobile]);
  React.useEffect(() => { try { localStorage.setItem("fos.sidebarCollapsed", collapsed ? "1" : "0"); } catch (e) {} }, [collapsed]);
  React.useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", isMobile ? "0px" : (collapsed ? "76px" : "234px"));
  }, [isMobile, collapsed]);

  return (
    <div className="fos" style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--page)", fontSize: 14 }}>
      {!isMobile && <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />}
      {isMobile && <Sidebar mobile open={drawer} onClose={() => setDrawer(false)} />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar tweaksBtn={tweaksBtn} mobile={isMobile} onMenu={() => setDrawer(true)} />
        <main style={{ flex: 1, overflow: "auto", minHeight: 0 }}>{children}</main>
      </div>
    </div>
  );
}

/* Placeholder for screens not yet designed */
function ScreenStub({ title, icon }) {
  return (
    <div className="screen-pad">
      <PageHeader title={title} sub="Pantalla incluida en el alcance completo · pendiente de diseño." />
      <Card style={{ padding: 60, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", marginBottom: 16 }}>
          <Icon name={icon || "layers"} size={26} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 17 }}>{title}</div>
        <div style={{ color: "var(--text-mute)", fontSize: 13.5, marginTop: 5, maxWidth: 340 }}>Esta pantalla forma parte del alcance completo del producto.</div>
      </Card>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, AppShell, ScreenStub, NAV_ITEMS });

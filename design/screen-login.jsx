/* fixtureOS — Screen: Login (full-bleed, outside shell) */

function LoginScreen() {
  const { nav } = useNav();
  const [email, setEmail] = React.useState("andres@quitobasket.ec");
  const [pwd, setPwd] = React.useState("••••••••");
  const { isMobile } = useViewport();

  const field = (label, value, onChange, type, ic) => (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", marginBottom: 7 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", borderRadius: 11, border: "1px solid var(--line-strong)", background: "var(--surface)" }}>
        <Icon name={ic} size={17} style={{ color: "var(--text-mute)" }} />
        <input value={value} type={type} onChange={(e) => onChange(e.target.value)} style={{ border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 600, width: "100%", color: "var(--text)" }} />
      </div>
    </label>
  );

  return (
    <div className="fos" style={{ minHeight: "100vh", width: "100vw", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.05fr .95fr", background: "var(--page)", fontFamily: "var(--font-sans)" }}>
      {/* Brand panel */}
      <div style={{ display: isMobile ? "none" : "flex", flexDirection: "column", justifyContent: "space-between", padding: "44px 48px", background: "radial-gradient(120% 120% at 0% 0%, var(--ink-900), var(--ink-950))", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 40%, transparent), transparent 70%)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 11, position: "relative" }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--accent)", display: "grid", placeItems: "center", boxShadow: "0 6px 18px color-mix(in srgb, var(--accent) 50%, transparent)" }}><Icon name="zap" size={21} sw={2.2} /></div>
          <div style={{ fontWeight: 800, fontSize: 21, letterSpacing: -.5 }}>fixture<span style={{ color: "var(--accent-hot)" }}>OS</span></div>
        </div>
        <div style={{ position: "relative", maxWidth: 420 }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, lineHeight: 1.12, margin: 0 }}>Genera, revisa y publica fixtures sin caos.</h1>
          <p style={{ fontSize: 15, color: "#9fb0c9", marginTop: 16, lineHeight: 1.6 }}>Dry runs revisables, versiones inmutables y contacto por WhatsApp — todo en un solo lugar para tu liga.</p>
          <div style={{ display: "flex", gap: 22, marginTop: 28 }}>
            {[["48", "equipos"], ["6", "categorías"], ["V5", "versión activa"]].map(([n, l]) => (
              <div key={l}>
                <div className="mono" style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1 }}>{n}</div>
                <div style={{ fontSize: 12, color: "#7689a8", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", fontSize: 12, color: "#56688a" }}>© 2026 Quito Basket Liga · Spanish-first</div>
      </div>

      {/* Form */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "40px 18px" : "44px" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          {isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--accent)", display: "grid", placeItems: "center", color: "#fff" }}><Icon name="zap" size={18} sw={2.2} /></div>
              <div style={{ fontWeight: 800, fontSize: 19, color: "var(--text)" }}>fixture<span style={{ color: "var(--accent)" }}>OS</span></div>
            </div>
          )}
          <h2 style={{ fontSize: 25, fontWeight: 800, letterSpacing: -.6, margin: 0, color: "var(--text)" }}>Inicia sesión</h2>
          <p style={{ fontSize: 13.5, color: "var(--text-mute)", margin: "7px 0 26px" }}>Accede al panel de tu organización.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {field("Correo electrónico", email, setEmail, "email", "message")}
            {field("Contraseña", pwd, setPwd, "password", "lock")}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--text-soft)", fontWeight: 600, cursor: "pointer" }}>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--accent)", width: 15, height: 15 }} /> Recordarme
              </label>
              <span style={{ color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}>¿Olvidaste tu contraseña?</span>
            </div>
            <Btn variant="primary" size="lg" iconR="arrowright" style={{ justifyContent: "center", width: "100%", marginTop: 4 }} onClick={() => nav("dashboard")}>Entrar al panel</Btn>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0", color: "var(--text-mute)", fontSize: 12 }}>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} /> o <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>
          <button onClick={() => nav("dashboard")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, width: "100%", padding: "11px 0", borderRadius: 11, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            <span style={{ width: 20, height: 20, borderRadius: 6, background: "var(--ink-800)", color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800 }}>QB</span>
            Continuar con Quito Basket SSO
          </button>
          <p style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 22, lineHeight: 1.5 }}>¿Problemas para entrar? Escribe a soporte@fixtureos.app</p>
        </div>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;

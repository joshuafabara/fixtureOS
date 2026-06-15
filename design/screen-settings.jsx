/* fixtureOS — Screen: Settings (Organización · Canchas · Usuarios) */

const SET_COURTS = [
  { name: "Cancha Central", active: true, avail: "Vie–Dom 08:00–21:00" },
  { name: "Cancha Norte", active: true, avail: "Vie–Dom 08:00–21:00" },
  { name: "Cancha Sur", active: false, avail: "Dom cerrada · mantenimiento" },
  { name: "Polideportivo", active: true, avail: "Sáb–Dom 09:00–20:00" },
];
const SET_USERS = [
  { name: "Andrés Rojas", email: "andres@quitobasket.ec", role: "Administrador", status: "active" },
  { name: "Mónica Vera", email: "monica@quitobasket.ec", role: "Editor", status: "active" },
  { name: "Diego Salas", email: "diego@quitobasket.ec", role: "Editor", status: "active" },
  { name: "Sofía Ramos", email: "sofia@quitobasket.ec", role: "Lector", status: "invited" },
];

function FieldRow({ label, children, sub }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 6, padding: "15px 0", borderBottom: "1px solid var(--line)" }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: -2 }}>{sub}</div>}
      <div style={{ marginTop: 4 }}>{children}</div>
    </div>
  );
}
function TextInput({ value, mono }) {
  return <input defaultValue={value} style={{ width: "100%", maxWidth: 420, padding: "10px 13px", borderRadius: 10, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text)", fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", fontSize: 13.5, fontWeight: 600, outline: "none" }} />;
}

function SettingsScreen({ initial }) {
  const { nav } = useNav();
  const { isMobile } = useViewport();
  const [tab, setTab] = React.useState(initial || "org");
  const tabs = [{ id: "org", label: "Organización", icon: "building" }, { id: "courts", label: "Canchas", icon: "pin" }, { id: "users", label: "Usuarios", icon: "users" }];

  return (
    <div className="screen-pad" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <PageHeader title="Configuración" sub="Quito Basket Liga · ajustes de la organización"
        right={<div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" icon="history" onClick={() => nav("audit")}>Auditoría</Btn>
          <Btn variant="ghost" icon="download" onClick={() => nav("exports")}>Exportes</Btn>
        </div>} />

      <div style={{ borderBottom: "1px solid var(--line)", marginBottom: 20, overflowX: "auto" }} className="tbl-scroll">
        <SegTabs tabs={tabs} value={tab} onChange={setTab} />
      </div>

      {tab === "org" && (
        <Card style={{ padding: isMobile ? 16 : "8px 24px 20px" }} className="card-pad-lg">
          <FieldRow label="Nombre de la organización"><TextInput value="Quito Basket Liga" /></FieldRow>
          <FieldRow label="Idioma principal">
            <div style={{ position: "relative", maxWidth: 420 }}>
              <select style={{ width: "100%", appearance: "none", WebkitAppearance: "none", padding: "10px 32px 10px 13px", borderRadius: 10, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text)", fontWeight: 600, fontSize: 13.5, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                <option>Español (Ecuador)</option><option>English</option>
              </select>
              <Icon name="chevdown" size={14} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
            </div>
          </FieldRow>
          <FieldRow label="Conexión Drupal" sub="API JSON:API para importar equipos y categorías">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <TextInput value="https://liga.quitobasket.ec/jsonapi" mono />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--ok)" }}><span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--ok)" }} />Conectado</span>
            </div>
          </FieldRow>
          <FieldRow label="Duración por defecto del partido"><div style={{ display: "flex", alignItems: "center", gap: 9 }}><TextInput value="60" /><span style={{ fontSize: 13, color: "var(--text-mute)", fontWeight: 600 }}>minutos</span></div></FieldRow>
          <FieldRow label="Contexto global" sub="Reglas base aplicadas a todos los torneos">
            <Btn variant="ghost" size="sm" icon="sliders" onClick={() => nav("ctxorg")}>Editar contexto global</Btn>
          </FieldRow>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}><Btn variant="primary" icon="check">Guardar cambios</Btn></div>
        </Card>
      )}

      {tab === "courts" && (
        <Card>
          <CardHead title="Canchas" sub="Disponibilidad usada por el motor de fixture" icon="pin" right={<Btn variant="primary" size="sm" icon="plus">Añadir cancha</Btn>} />
          <TableScroll minWidth={560}>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 90px 1.6fr 70px", padding: "10px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
              <div>Cancha</div><div>Activa</div><div>Disponibilidad</div><div style={{ textAlign: "right" }}>Editar</div>
            </div>
            {SET_COURTS.map((c, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.3fr 90px 1.6fr 70px", alignItems: "center", padding: "13px 18px", borderBottom: i < SET_COURTS.length - 1 ? "1px solid var(--line)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: 13.5 }}><Icon name="pin" size={15} style={{ color: c.active ? "var(--accent)" : "var(--text-mute)" }} />{c.name}</div>
                <div><span style={{ display: "inline-flex", width: 38, height: 22, borderRadius: 99, background: c.active ? "var(--accent)" : "var(--ink-200)", padding: 2, transition: "background .15s" }}><span style={{ width: 18, height: 18, borderRadius: 99, background: "#fff", transform: c.active ? "translateX(16px)" : "none", transition: "transform .15s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} /></span></div>
                <div style={{ fontSize: 13, color: c.active ? "var(--text-soft)" : "var(--warn)", fontWeight: c.active ? 600 : 700 }}>{c.avail}</div>
                <div style={{ textAlign: "right" }}><button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--text-mute)", display: "inline-grid", placeItems: "center", cursor: "pointer" }}><Icon name="edit" size={14} /></button></div>
              </div>
            ))}
          </TableScroll>
        </Card>
      )}

      {tab === "users" && (
        <Card>
          <CardHead title="Usuarios" sub="Roles y acceso al panel" icon="users" right={<Btn variant="primary" size="sm" icon="plus">Invitar usuario</Btn>} />
          <TableScroll minWidth={620}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 120px 110px 60px", padding: "10px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
              <div>Nombre</div><div>Correo</div><div>Rol</div><div>Estado</div><div></div>
            </div>
            {SET_USERS.map((u, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.6fr 120px 110px 60px", alignItems: "center", padding: "13px 18px", borderBottom: i < SET_USERS.length - 1 ? "1px solid var(--line)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 99, background: "linear-gradient(135deg,#1e293b,#475569)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 11.5, flex: "0 0 auto" }}>{u.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{u.name}</span>
                </div>
                <div className="mono" style={{ fontSize: 12.5, color: "var(--text-soft)" }}>{u.email}</div>
                <div><span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: u.role === "Administrador" ? "var(--accent-soft)" : "var(--ink-100)", color: u.role === "Administrador" ? "var(--accent-strong)" : "var(--text-soft)" }}>{u.role}</span></div>
                <div>{u.status === "active" ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--ok)" }}><span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--ok)" }} />Activo</span> : <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--warn)" }}><span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--warn)" }} />Invitado</span>}</div>
                <div style={{ textAlign: "right" }}><button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--text-mute)", display: "inline-grid", placeItems: "center", cursor: "pointer" }}><Icon name="more" size={16} /></button></div>
              </div>
            ))}
          </TableScroll>
        </Card>
      )}
    </div>
  );
}

window.SettingsScreen = SettingsScreen;

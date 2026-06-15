/* fixtureOS — Screen: Audit Log */

const AUDIT = [
  { date: "Hoy · 14:20", user: "Andrés Rojas", action: "Aprobó dry run", entity: "Fixture V5", detail: "9 cambios aplicados · equipo retirado", kind: "approve" },
  { date: "Hoy · 13:40", user: "Mónica Vera", action: "Editó contacto", entity: "Titanes", detail: "WhatsApp actualizado", kind: "edit" },
  { date: "Hoy · 11:02", user: "Sistema", action: "Detectó conflicto", entity: "U16 · Cancha Norte", detail: "Solapamiento 10:30", kind: "alert" },
  { date: "Ayer · 18:10", user: "Diego Salas", action: "Editó manualmente", entity: "Pumas vs Halcones", detail: "Cancha Sur → Central", kind: "edit" },
  { date: "Ayer · 09:10", user: "Andrés Rojas", action: "Publicó fechas", entity: "U12 · Jornada 3", detail: "4 fechas publicadas", kind: "publish" },
  { date: "10 Jul · 17:42", user: "Mónica Vera", action: "Creó versión", entity: "Fixture V3", detail: "Edición manual U16", kind: "version" },
  { date: "08 Jul · 11:05", user: "Andrés Rojas", action: "Importó equipos", entity: "Excel", detail: "24 equipos · 6 categorías", kind: "import" },
  { date: "05 Jul · 16:30", user: "Sistema", action: "Generó fixture", entity: "Fixture V1", detail: "Generación inicial", kind: "version" },
];
const AUDIT_DOT = { approve: "var(--ok)", edit: "var(--info)", publish: "var(--accent)", alert: "var(--warn)", version: "var(--cat-vio-dot)", import: "var(--ink-400)" };

function AuditScreen() {
  const { isMobile } = useViewport();
  const [user, setUser] = React.useState("all");
  const users = ["all", ...Array.from(new Set(AUDIT.map((a) => a.user)))];
  const rows = AUDIT.filter((a) => user === "all" || a.user === user);

  return (
    <div className="screen-pad" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <PageHeader title="Registro de auditoría" sub="Toda acción queda registrada · inmutable y exportable"
        right={<Btn variant="ghost" icon="download">Exportar CSV</Btn>} />

      <Card style={{ padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Icon name="users" size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
            <select value={user} onChange={(e) => setUser(e.target.value)} style={{ appearance: "none", WebkitAppearance: "none", padding: "9px 30px 9px 32px", borderRadius: 10, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              {users.map((u) => <option key={u} value={u}>{u === "all" ? "Todos los usuarios" : u}</option>)}
            </select>
            <Icon name="chevdown" size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line-strong)", color: "var(--text-mute)", fontSize: 13, width: 200 }}>
            <Icon name="search" size={15} /> Buscar entidad…
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12.5, color: "var(--text-mute)", fontWeight: 600 }}>{rows.length} eventos</span>
        </div>
      </Card>

      <Card>
        <TableScroll minWidth={680}>
          <div style={{ display: "grid", gridTemplateColumns: "130px 1.2fr 1.2fr 1.1fr 1.4fr", padding: "11px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
            <div>Fecha</div><div>Usuario</div><div>Acción</div><div>Entidad</div><div>Detalles</div>
          </div>
          {rows.map((a, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 1.2fr 1.2fr 1.1fr 1.4fr", alignItems: "center", padding: "13px 18px", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none" }}>
              <div className="mono" style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 600 }}>{a.date}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{a.user}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-soft)", fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: AUDIT_DOT[a.kind], flex: "0 0 auto" }} />{a.action}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{a.entity}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-mute)" }}>{a.detail}</div>
            </div>
          ))}
        </TableScroll>
      </Card>
    </div>
  );
}

window.AuditScreen = AuditScreen;

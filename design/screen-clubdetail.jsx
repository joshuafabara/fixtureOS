/* fixtureOS — Screen: Club Detail */

const CLUB_CONTACTS = [
  { name: "Carla Núñez", role: "Delegada principal", wa: "593998375914", primary: true },
  { name: "Marco Díaz", role: "Asistente técnico", wa: "593987112045", primary: false },
  { name: "Luis Paredes", role: "Coordinador U12", wa: "", primary: false },
];

function ClubDetailScreen() {
  const { nav } = useNav();
  const { isMobile, narrow } = useViewport();
  const club = CLUBS[0]; // Spartans BC

  return (
    <div className="screen-pad" style={{ maxWidth: 1120, margin: "0 auto" }}>
      <button onClick={() => nav("clubs")} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--text-soft)", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "var(--font-sans)", marginBottom: 16 }}>
        <Icon name="chevleft" size={15} /> Directorio de clubes
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 16, minWidth: 0 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--ink-800)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 21, flex: "0 0 auto" }}>{club.name.slice(0, 2).toUpperCase()}</div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: isMobile ? 22 : 27, fontWeight: 800, letterSpacing: -.7, margin: 0 }}>{club.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 7, fontSize: 13, color: "var(--text-soft)", fontWeight: 600, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="layers" size={15} style={{ color: "var(--text-mute)" }} /> {club.cats.length} categorías</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="users" size={15} style={{ color: "var(--text-mute)" }} /> 3 contactos</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ok)" }}><Icon name="checkcircle" size={15} /> WhatsApp listo</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" icon="edit">Editar club</Btn>
          <Btn variant="primary" icon="plus">Añadir contacto</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "320px minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        {/* Teams by category */}
        <Card>
          <CardHead title="Equipos por categoría" icon="layers" />
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            {club.cats.map((cid) => {
              const c = CATS[cid];
              return (
                <div key={cid} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", borderRadius: 11, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                  <CatBadge cat={cid} />
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{club.name.split(" ")[0]} {c.short}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-mute)", fontWeight: 700 }} className="mono">12 jug.</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Contacts */}
        <Card>
          <CardHead title="Contactos" sub="Listos para mensajería por WhatsApp en MVP" icon="phone"
            right={<Btn variant="soft" size="sm" icon="plus">Añadir</Btn>} />
          <TableScroll minWidth={580}>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.3fr 1.4fr 90px 70px", padding: "10px 16px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
              <div>Nombre</div><div>Rol</div><div>WhatsApp</div><div>Principal</div><div style={{ textAlign: "right" }}>Acción</div>
            </div>
            {CLUB_CONTACTS.map((p, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.3fr 1.3fr 1.4fr 90px 70px", alignItems: "center", padding: "13px 16px", borderBottom: i < CLUB_CONTACTS.length - 1 ? "1px solid var(--line)" : "none" }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-soft)" }}>{p.role}</div>
                <div>{p.wa ? <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{p.wa}</span> : <SevTag sev="warn" size="sm">Sin número</SevTag>}</div>
                <div>{p.primary ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--ok)" }}><Icon name="checkcircle" size={14} sw={2.2} />Sí</span> : <span style={{ fontSize: 12.5, color: "var(--text-mute)" }}>—</span>}</div>
                <div style={{ textAlign: "right" }}><button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--text-mute)", display: "inline-grid", placeItems: "center", cursor: "pointer" }}><Icon name="edit" size={14} /></button></div>
              </div>
            ))}
          </TableScroll>
        </Card>
      </div>
    </div>
  );
}

window.ClubDetailScreen = ClubDetailScreen;

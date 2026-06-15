/* fixtureOS — Screen: Communications Directory (contact readiness, MVP) */

const COMMS_UPDATED = ["Hoy · 13:40", "Ayer · 18:10", "Hace 3 días", "10 Jul", "08 Jul", "Hoy · 09:22", "07 Jul", "Ayer · 11:50", "—", "06 Jul"];

function CommsScreen() {
  const { nav } = useNav();
  const { isMobile } = useViewport();
  const [cat, setCat] = React.useState("all");
  const [filter, setFilter] = React.useState("all");

  const rows = CLUBS.filter((c) => {
    if (cat !== "all" && !c.cats.includes(cat)) return false;
    if (filter === "missing" && c.wa) return false;
    if (filter === "present" && !c.wa) return false;
    return true;
  });
  const ready = CLUBS.filter((c) => c.wa).length;
  const pct = Math.round((ready / CLUBS.length) * 100);

  return (
    <div className="screen-pad" style={{ maxWidth: 1180, margin: "0 auto" }}>
      <PageHeader eyebrow="Comunicaciones" title="Directorio de comunicaciones"
        sub="Solo lectura de preparación de contactos en MVP · el envío por WhatsApp llega después."
        right={<Btn variant="ghost" icon="download">Exportar contactos</Btn>} />

      {/* Readiness banner */}
      <Card style={{ padding: isMobile ? 16 : "18px 22px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
              <span className="mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1, color: "var(--ok)" }}>{pct}%</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>contactos listos para WhatsApp</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: "var(--ink-100)", overflow: "hidden", marginTop: 10 }}>
              <div style={{ width: pct + "%", height: "100%", borderRadius: 99, background: "linear-gradient(90deg, var(--ok), color-mix(in srgb, var(--ok) 70%, var(--accent)))" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 22 }}>
            <div><div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>{ready}</div><div style={{ fontSize: 12, color: "var(--text-mute)" }}>con número</div></div>
            <div><div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--warn)" }}>{CLUBS.length - ready}</div><div style={{ fontSize: 12, color: "var(--text-mute)" }}>faltantes</div></div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card style={{ padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Icon name="trophy" size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
            <select disabled style={{ appearance: "none", WebkitAppearance: "none", padding: "9px 30px 9px 32px", borderRadius: 10, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-sans)" }}>
              <option>Copa Apertura 2026</option>
            </select>
            <Icon name="chevdown" size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
          </div>
          <div style={{ position: "relative" }}>
            <Icon name="layers" size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
            <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ appearance: "none", WebkitAppearance: "none", padding: "9px 30px 9px 32px", borderRadius: 10, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              <option value="all">Todas las categorías</option>
              {Object.values(CATS).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Icon name="chevdown" size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
          </div>
          <SegTabs tabs={[{ id: "all", label: "Todos" }, { id: "present", label: "Con WhatsApp" }, { id: "missing", label: "Sin WhatsApp" }]} value={filter} onChange={setFilter} size="sm" />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12.5, color: "var(--text-mute)", fontWeight: 600 }}>{rows.length} clubes</span>
        </div>
      </Card>

      <Card>
        <TableScroll minWidth={640}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.3fr 1.4fr 130px", padding: "11px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
            <div>Club</div><div>Contacto principal</div><div>WhatsApp</div><div>Actualizado</div>
          </div>
          {rows.map((c, i) => (
            <div key={c.id} onClick={() => nav("clubdetail")} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.3fr 1.4fr 130px", alignItems: "center", padding: "13px 18px", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none", cursor: "pointer", background: !c.wa ? "color-mix(in srgb, var(--warn-bg) 40%, transparent)" : "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--ink-100)", color: "var(--text-soft)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12, flex: "0 0 auto" }}>{c.name.slice(0, 2).toUpperCase()}</div>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{c.name}</span>
              </div>
              <div style={{ fontSize: 13, color: c.contact === "—" ? "var(--text-mute)" : "var(--text)", fontWeight: 600 }}>{c.contact === "—" ? "Sin contacto" : c.contact}</div>
              <div>{c.wa ? <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{c.wa}</span> : <SevTag sev="warn" size="sm">Sin WhatsApp</SevTag>}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-mute)" }} className="mono">{COMMS_UPDATED[i % COMMS_UPDATED.length]}</div>
            </div>
          ))}
        </TableScroll>
      </Card>
    </div>
  );
}

window.CommsScreen = CommsScreen;

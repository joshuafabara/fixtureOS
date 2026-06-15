/* fixtureOS — Screen: Clubs Directory (inline WhatsApp edit) */

const WA_RE = /^\d{10,15}$/;
const fmtWA = (n) => n ? `+${n.slice(0, n.length - 9)} ${n.slice(-9, -6)} ${n.slice(-6, -3)} ${n.slice(-3)}` : "";

function WhatsAppCell({ club, onSave }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(club.wa);
  const valid = WA_RE.test(val);
  const start = () => { setVal(club.wa); setEditing(true); };
  const commit = () => { if (valid) { onSave(val); setEditing(false); } };

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 9px", borderRadius: 8, border: `1px solid ${val && !valid ? "var(--crit-line)" : "var(--accent-soft-2)"}`, background: "var(--surface)", boxShadow: `0 0 0 3px ${val && !valid ? "var(--crit-bg)" : "var(--accent-soft)"}` }}>
            <Icon name="phone" size={14} style={{ color: "var(--text-mute)" }} />
            <input autoFocus value={val} onChange={(e) => setVal(e.target.value.replace(/[^\d]/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
              placeholder="593998375914" inputMode="numeric"
              style={{ border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, width: 130, color: "var(--text)" }} />
          </div>
          <button onClick={commit} disabled={!valid} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: valid ? "var(--ok)" : "var(--ink-200)", color: "#fff", display: "grid", placeItems: "center", cursor: valid ? "pointer" : "not-allowed" }}><Icon name="check" size={15} sw={2.4} /></button>
          <button onClick={() => setEditing(false)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--text-mute)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="x" size={15} /></button>
        </div>
        <div style={{ fontSize: 11, color: val && !valid ? "var(--crit)" : "var(--text-mute)" }}>Formato: código de país + número. Ej: 593998375914</div>
      </div>
    );
  }
  if (club.wa) {
    return (
      <div className="wa-cell" style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ok)", fontWeight: 700, fontSize: 12.5 }}>
          <span style={{ width: 22, height: 22, borderRadius: 99, background: "var(--ok-bg)", display: "grid", placeItems: "center" }}><Icon name="phone" size={12} /></span>
        </span>
        <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{club.wa}</span>
        <button onClick={start} className="wa-edit" style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--text-mute)", display: "grid", placeItems: "center", cursor: "pointer", opacity: 0, transition: "opacity .12s" }}><Icon name="edit" size={13} /></button>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <SevTag sev="warn" size="sm">Sin WhatsApp</SevTag>
      <Btn variant="soft" size="sm" icon="plus" onClick={start}>Añadir</Btn>
    </div>
  );
}

function ClubsScreen() {
  const { nav } = useNav();
  const [clubs, setClubs] = React.useState(() => CLUBS.map((c) => ({ ...c })));
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("all");
  const [wa, setWa] = React.useState("all");

  const save = (id, val) => setClubs((s) => s.map((c) => c.id === id ? { ...c, wa: val, missing: !val } : c));

  const rows = clubs.filter((c) => {
    if (q && !(c.name.toLowerCase().includes(q.toLowerCase()) || c.contact.toLowerCase().includes(q.toLowerCase()))) return false;
    if (cat !== "all" && !c.cats.includes(cat)) return false;
    if (wa === "present" && !c.wa) return false;
    if (wa === "missing" && c.wa) return false;
    return true;
  });
  const missingCount = clubs.filter((c) => !c.wa).length;

  return (
    <div className="screen-pad" style={{ maxWidth: 1280, margin: "0 auto" }}>
      <style>{`.wa-cell:hover .wa-edit{opacity:1!important}`}</style>
      <PageHeader
        eyebrow="Comunicaciones · Copa Apertura 2026"
        title="Directorio de clubes"
        sub={<span>{clubs.length} clubes · <span style={{ color: missingCount ? "var(--warn)" : "var(--ok)", fontWeight: 700 }}>{missingCount} sin WhatsApp</span> · listos para WhatsApp en MVP</span>}
        right={<Btn variant="primary" icon="plus">Añadir club</Btn>}
      />

      <Card style={{ padding: "12px 16px", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line-strong)", width: 280 }}>
            <Icon name="search" size={16} style={{ color: "var(--text-mute)" }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar club o contacto…" style={{ border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, width: "100%", color: "var(--text)" }} />
            {q && <button onClick={() => setQ("")} style={{ border: "none", background: "transparent", color: "var(--text-mute)", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={15} /></button>}
          </div>
          <div style={{ position: "relative" }}>
            <Icon name="layers" size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
            <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ appearance: "none", WebkitAppearance: "none", padding: "9px 30px 9px 32px", borderRadius: 10, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              <option value="all">Todas las categorías</option>
              {Object.values(CATS).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Icon name="chevdown" size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
          </div>
          <SegTabs tabs={[{ id: "all", label: "Todos" }, { id: "present", label: "Con WhatsApp" }, { id: "missing", label: "Sin WhatsApp" }]} value={wa} onChange={setWa} size="sm" />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12.5, color: "var(--text-mute)", fontWeight: 600 }}>{rows.length} resultados</span>
        </div>
      </Card>

      <Card style={{ overflow: "visible" }}>
        <TableScroll minWidth={780}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.5fr 1fr 1.5fr 92px", padding: "11px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
          <div>Club</div><div>Categorías</div><div>Contacto principal</div><div>WhatsApp</div><div style={{ textAlign: "right" }}>Acciones</div>
        </div>
        {rows.map((c, i) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.5fr 1fr 1.5fr 92px", alignItems: "center", padding: "14px 18px", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none", background: !c.wa ? "color-mix(in srgb, var(--warn-bg) 45%, transparent)" : "transparent" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--ink-100)", color: "var(--text-soft)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, flex: "0 0 auto" }}>{c.name.slice(0, 2).toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-mute)" }}>{c.cats.length} categorías</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{c.cats.map((cc) => <CatBadge key={cc} cat={cc} size="sm" dot={false} />)}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.contact === "—" ? "var(--text-mute)" : "var(--text)" }}>{c.contact === "—" ? "Sin contacto" : c.contact}</div>
            <div><WhatsAppCell club={c} onSave={(v) => save(c.id, v)} /></div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <Btn variant="subtle" size="sm" onClick={() => nav("clubdetail")} iconR="chevright">Ver</Btn>
            </div>
          </div>
        ))}
        {!rows.length && <div style={{ padding: "40px 18px", textAlign: "center", color: "var(--text-mute)", fontSize: 13.5 }}>No hay clubes con esos filtros.</div>}
        </TableScroll>
      </Card>
    </div>
  );
}

window.ClubsScreen = ClubsScreen;

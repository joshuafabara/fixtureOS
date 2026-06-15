/* fixtureOS — Screen: Version Compare (V4 → V5) */

function VerPicker({ value, onChange, side }) {
  return (
    <div style={{ flex: "1 1 240px", minWidth: 0, border: "1px solid var(--line)", borderRadius: "var(--radius)", background: "var(--surface)", padding: "14px 16px", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "var(--text-mute)", marginBottom: 9 }}>{side === "left" ? "Versión base" : "Versión comparada"}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <select value={value} onChange={(e) => onChange(e.target.value)} style={{
            width: "100%", appearance: "none", WebkitAppearance: "none", padding: "10px 32px 10px 12px", borderRadius: 10,
            border: "1px solid var(--line-strong)", background: side === "left" ? "var(--ink-50)" : "var(--accent-soft)", color: side === "left" ? "var(--text)" : "var(--accent-strong)",
            fontWeight: 800, fontSize: 15, fontFamily: "var(--font-mono)", cursor: "pointer",
          }}>
            {VERSIONS.map((v) => <option key={v.v} value={v.v}>{v.v}</option>)}
          </select>
          <Icon name="chevdown" size={15} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
        </div>
        {(() => { const ver = VERSIONS.find((x) => x.v === value); return ver && <StatePill state={ver.state} />; })()}
      </div>
      {(() => { const ver = VERSIONS.find((x) => x.v === value); return ver && (
        <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 9, lineHeight: 1.45 }}>
          <span style={{ fontWeight: 700, color: "var(--text-soft)" }}>{ver.by}</span> · <span className="mono">{ver.date}</span><br />{ver.reason}
        </div>
      ); })()}
    </div>
  );
}

function CompareScreen() {
  const { nav } = useNav();
  const [left, setLeft] = React.useState("V4");
  const [right, setRight] = React.useState("V5");
  const c = COMPARE;
  const sum = c.summary;

  return (
    <div className="screen-pad" style={{ maxWidth: 1180, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Fixture · Copa Apertura 2026"
        title="Comparar versiones"
        sub="El historial nunca se sobrescribe · restaurar crea una nueva versión"
        right={<>
          <Btn variant="ghost" icon="refresh">Restaurar V4</Btn>
          <Btn variant="primary" icon="eye" onClick={() => nav("fixture")}>Abrir V5</Btn>
        </>}
      />

      <div style={{ display: "flex", alignItems: "stretch", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <VerPicker value={left} onChange={setLeft} side="left" />
        <button onClick={() => { setLeft(right); setRight(left); }} title="Intercambiar" style={{ alignSelf: "center", width: 40, height: 40, borderRadius: 99, border: "1px solid var(--line-strong)", background: "var(--surface)", display: "grid", placeItems: "center", color: "var(--text-soft)", cursor: "pointer", flex: "0 0 auto" }}>
          <Icon name="swap" size={18} />
        </button>
        <VerPicker value={right} onChange={setRight} side="right" />
      </div>

      {/* summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        {[["plus", sum.added, "Añadidos", "var(--ok)"], ["swap", sum.moved, "Movidos", "var(--info)"], ["x", sum.removed, "Eliminados", "var(--text-mute)"], ["alert", sum.warnings, "Advertencias", "var(--warn)"]].map(([ic, n, l, tone]) => (
          <div key={l} style={{ flex: "1 1 150px", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone }}><Icon name={ic} size={18} sw={2.2} /></div>
            <div>
              <div className="mono tnum" style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1, color: tone }}>{n}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)" }}>{l}</div>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <TableScroll minWidth={680}>
        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 1fr", borderBottom: "1px solid var(--line)" }}>
          <div style={{ padding: "12px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)" }}>Cambio</div>
          <div style={{ padding: "12px 18px", fontSize: 12.5, fontWeight: 800, color: "var(--text-soft)", borderLeft: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 7 }}><span className="mono">{left}</span><StatePill state={VERSIONS.find((v) => v.v === left)?.state} dot={false} /></div>
          <div style={{ padding: "12px 18px", fontSize: 12.5, fontWeight: 800, color: "var(--accent-strong)", borderLeft: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 7, background: "var(--accent-soft)" }}><span className="mono">{right}</span><StatePill state={VERSIONS.find((v) => v.v === right)?.state} dot={false} /></div>
        </div>
        {c.rows.map((r, i) => {
          const T = DIFF_TYPE[r.type];
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "150px 1fr 1fr", borderBottom: i < c.rows.length - 1 ? "1px solid var(--line)" : "none" }}>
              <div style={{ padding: "14px 18px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 99, background: T.bg, color: T.t, border: `1px solid ${T.ln}`, fontSize: 11, fontWeight: 800 }}>
                  <Icon name={T.ic} size={11} sw={2.4} />{T.label}
                </span>
                <div style={{ marginTop: 8 }}><CatBadge cat={r.cat} size="sm" /></div>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 7, lineHeight: 1.3 }}>{r.match}</div>
              </div>
              <div style={{ padding: "14px 18px", borderLeft: "1px solid var(--line)", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: r.left === "—" ? "var(--text-mute)" : "var(--text-soft)", textDecoration: r.type === "removed" || r.type === "forfeit" ? "line-through" : "none", textDecorationColor: "var(--crit)" }}>{r.left}</span>
              </div>
              <div style={{ padding: "14px 18px", borderLeft: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 9, background: `color-mix(in srgb, ${T.t} 6%, transparent)` }}>
                <Icon name="arrowright" size={14} style={{ color: T.t, flex: "0 0 auto" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: r.right === "—" ? "var(--text-mute)" : "var(--text)" }}>{r.right}</span>
              </div>
            </div>
          );
        })}
        </TableScroll>
      </Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12.5, color: "var(--text-mute)" }}>
        <Icon name="history" size={15} /> Mostrando diferencias entre {left} y {right}. Los partidos sin cambios no se listan.
      </div>
    </div>
  );
}

window.CompareScreen = CompareScreen;

/* fixtureOS — Screen: Manual Edit Mode (scheduling board) */

const ME_SLOT0 = 9 * 60, ME_SLOTN = 19 * 60, ME_STEP = 30, ME_ROWH = 38;
const meSlots = () => { const a = []; for (let m = ME_SLOT0; m < ME_SLOTN; m += ME_STEP) a.push(m); return a; };
const minToTime = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const timeToMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

function ManualEditScreen() {
  const { nav } = useNav();
  const { isMobile } = useViewport();
  const dayKey = "2026-07-12";
  const initial = React.useMemo(() => MATCHES.filter((m) => m.dateKey === dayKey).map((m) => ({ ...m })), []);
  const [matches, setMatches] = React.useState(initial);
  const [sel, setSel] = React.useState(initial[3]?.id || initial[0]?.id);
  const [edits, setEdits] = React.useState([]);
  const [dragId, setDragId] = React.useState(null);
  const grabRef = React.useRef(0);

  // conflicts: same court + same time
  const conflictIds = React.useMemo(() => {
    const seen = {}, bad = new Set();
    matches.forEach((m) => {
      const k = m.court + "@" + m.time;
      if (seen[k]) { bad.add(m.id); bad.add(seen[k]); } else seen[k] = m.id;
    });
    return bad;
  }, [matches]);

  const selM = matches.find((m) => m.id === sel);
  const pushEdit = (label) => setEdits((e) => [...e, label]);

  const apply = (id, patch, label) => {
    setMatches((s) => s.map((m) => m.id === id ? { ...m, ...patch, manual: true } : m));
    if (label) pushEdit(label);
  };

  const onDrop = (court, e) => {
    e.preventDefault();
    if (!dragId) return;
    const m = matches.find((x) => x.id === dragId);
    if (!m || m.locked) { setDragId(null); return; }
    const colTop = e.currentTarget.getBoundingClientRect().top;
    const y = e.clientY - colTop - grabRef.current;
    let slot = Math.round(y / ME_ROWH);
    slot = Math.max(0, Math.min(meSlots().length - 2, slot));
    const newMin = ME_SLOT0 + slot * ME_STEP;
    const newTime = minToTime(newMin);
    if (newTime !== m.time || court !== m.court) {
      apply(dragId, { time: newTime, court }, `${m.home.split(" ")[0]} → ${court.replace("Cancha ", "")} ${newTime}`);
      setSel(dragId);
    }
    setDragId(null);
  };

  const slots = meSlots();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: isMobile ? "12px 14px" : "16px 26px", borderBottom: "1px solid var(--line)", background: "var(--surface)", flexWrap: "wrap" }}>
        <button onClick={() => nav("fixture")} style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", display: "grid", placeItems: "center", color: "var(--text-soft)", cursor: "pointer", flex: "0 0 auto" }}><Icon name="chevleft" size={18} /></button>
        <div style={{ flex: "0 1 auto", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -.5, margin: 0 }}>Edición manual</h1>
            <span className="mono" style={{ fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: "var(--accent-soft)", color: "var(--accent-strong)", whiteSpace: "nowrap" }}>V5 · borrador</span>
          </div>
          <div className="hide-mobile" style={{ fontSize: 12.5, color: "var(--text-mute)", marginTop: 2, whiteSpace: "nowrap" }}>Sábado 12 Julio · arrastrá los partidos para reprogramar</div>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: conflictIds.size ? "var(--crit)" : "var(--ok)" }}>
          <Icon name={conflictIds.size ? "alert" : "checkcircle"} size={15} sw={2.2} />{conflictIds.size ? `${conflictIds.size / 2} conflicto(s)` : "Sin conflictos"}
        </span>
        <span className="hide-mobile" style={{ fontSize: 12.5, color: "var(--text-mute)", fontWeight: 700 }}>{edits.length} cambios</span>
        <Btn variant="ghost" size="sm" icon="refresh" onClick={() => { setMatches(initial.map((m) => ({ ...m }))); setEdits([]); }}>Deshacer todo</Btn>
        <Btn variant="primary" size="sm" icon="zap" onClick={() => nav("dryrun")}>Previsualizar Dry Run</Btn>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: 0 }}>
        {/* board */}
        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "14px" : "18px 22px", minHeight: isMobile ? 360 : 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: `58px repeat(${COURTS.length}, minmax(150px,1fr))`, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ borderBottom: "1px solid var(--line)", borderRight: "1px solid var(--line)", background: "var(--surface-2)" }} />
            {COURTS.map((c) => (
              <div key={c} style={{ padding: "11px 12px", borderBottom: "1px solid var(--line)", borderRight: "1px solid var(--line)", background: "var(--surface-2)", fontWeight: 800, fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="pin" size={13} style={{ color: "var(--accent)" }} />{c}
              </div>
            ))}
            {/* time column */}
            <div style={{ position: "relative", borderRight: "1px solid var(--line)" }}>
              {slots.map((s, i) => (
                <div key={s} style={{ height: ME_ROWH, borderBottom: i % 2 ? "1px solid var(--line)" : "1px dashed var(--line)", position: "relative" }}>
                  {i % 2 === 0 && <span className="mono" style={{ position: "absolute", top: -7, right: 7, fontSize: 10.5, color: "var(--text-mute)", fontWeight: 600, background: "var(--surface)", padding: "0 2px" }}>{minToTime(s)}</span>}
                </div>
              ))}
            </div>
            {/* court lanes */}
            {COURTS.map((court) => (
              <div key={court} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(court, e)}
                style={{ position: "relative", borderRight: "1px solid var(--line)", background: dragId ? "color-mix(in srgb, var(--accent-soft) 40%, transparent)" : "transparent" }}>
                {slots.map((s, i) => <div key={s} style={{ height: ME_ROWH, borderBottom: i % 2 ? "1px solid var(--line)" : "1px dashed var(--line)" }} />)}
                {matches.filter((m) => m.court === court).map((m) => {
                  const v = CAT_VARS[CATS[m.cat].key];
                  const top = ((timeToMin(m.time) - ME_SLOT0) / ME_STEP) * ME_ROWH;
                  const isConflict = conflictIds.has(m.id);
                  const isSel = m.id === sel;
                  return (
                    <div key={m.id} draggable={!m.locked}
                      onDragStart={(e) => { setDragId(m.id); grabRef.current = e.nativeEvent.offsetY; }}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => setSel(m.id)}
                      style={{ position: "absolute", top: top + 2, left: 5, right: 5, height: ME_ROWH * 2 - 4,
                        background: isConflict ? "var(--crit-bg)" : v.bg, border: `1px solid ${isConflict ? "var(--crit-line)" : (isSel ? v.dot : v.ln)}`,
                        borderLeft: `3px solid ${isConflict ? "var(--crit)" : v.dot}`, borderRadius: 9, padding: "6px 9px", cursor: m.locked ? "not-allowed" : "grab",
                        boxShadow: isSel ? `0 0 0 3px color-mix(in srgb, ${v.dot} 28%, transparent), var(--shadow)` : "none", opacity: dragId === m.id ? .4 : 1, overflow: "hidden", userSelect: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: isConflict ? "var(--crit)" : v.t }}>{m.time}</span>
                        <span style={{ display: "flex", gap: 3 }}>
                          {m.locked && <Icon name="lock" size={11} style={{ color: "var(--text-mute)" }} />}
                          {m.manual && !m.locked && <Icon name="edit" size={11} style={{ color: v.t }} />}
                          {isConflict && <Icon name="alert" size={12} style={{ color: "var(--crit)" }} />}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text)", lineHeight: 1.25, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.home}</div>
                      <div style={{ fontSize: 10.5, color: "var(--text-soft)", lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>vs {m.away}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* inspector */}
        <aside style={{ width: isMobile ? "auto" : 320, flex: isMobile ? "0 0 auto" : "0 0 320px", borderLeft: isMobile ? "none" : "1px solid var(--line)", borderTop: isMobile ? "1px solid var(--line)" : "none", background: "var(--surface)", overflow: "auto", padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "var(--text-mute)", marginBottom: 12 }}>Partido seleccionado</div>
          {selM ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <CatBadge cat={selM.cat} />
                {selM.locked && <SevTag sev="warn" size="sm">Bloqueado</SevTag>}
                {selM.manual && !selM.locked && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--info)" }}><Icon name="edit" size={12} /> Override manual</span>}
              </div>
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.3 }}>{selM.home}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-mute)", margin: "2px 0 8px" }}>vs</div>
                <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.3 }}>{selM.away}</div>
              </div>

              {selM.locked ? (
                <div style={{ display: "flex", gap: 10, padding: 13, borderRadius: 11, background: "var(--ink-100)", border: "1px solid var(--line)" }}>
                  <Icon name="lock" size={18} style={{ color: "var(--text-mute)", flex: "0 0 auto" }} />
                  <div style={{ fontSize: 12.5, color: "var(--text-soft)", lineHeight: 1.45 }}>Partido bloqueado (jugado o publicado). No puede reprogramarse automáticamente.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <label>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", marginBottom: 6 }}>Cancha</div>
                    <ISelect value={selM.court} onChange={(v) => apply(selM.id, { court: v }, `${selM.home.split(" ")[0]} → ${v.replace("Cancha ", "")}`)} options={COURTS.map((c) => ({ v: c, l: c }))} icon="pin" />
                  </label>
                  <label>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)", marginBottom: 6 }}>Hora</div>
                    <ISelect value={selM.time} onChange={(v) => apply(selM.id, { time: v }, `${selM.home.split(" ")[0]} → ${v}`)} options={meSlots().slice(0, -1).map((s) => ({ v: minToTime(s), l: minToTime(s) }))} icon="clock" mono />
                  </label>
                  {conflictIds.has(selM.id) && (
                    <div style={{ display: "flex", gap: 9, padding: 12, borderRadius: 11, background: "var(--crit-bg)", border: "1px solid var(--crit-line)" }}>
                      <Icon name="alert" size={17} style={{ color: "var(--crit)", flex: "0 0 auto" }} />
                      <div style={{ fontSize: 12, color: "var(--text-soft)", lineHeight: 1.45 }}><strong style={{ color: "var(--crit)" }}>Solapamiento de cancha.</strong> Otro partido usa {selM.court} a las {selM.time}. Movélo a otro horario.</div>
                    </div>
                  )}
                  <div style={{ height: 1, background: "var(--line)" }} />
                  <Btn variant="ghost" icon="swap" style={{ justifyContent: "center" }}>Intercambiar con otro partido</Btn>
                  <div style={{ fontSize: 11.5, color: "var(--text-mute)", lineHeight: 1.5, display: "flex", gap: 7 }}>
                    <Icon name="zap" size={14} style={{ color: "var(--text-mute)", flex: "0 0 auto", marginTop: 1 }} />
                    Los cambios manuales se respetan en la próxima generación. Previsualizá el Dry Run para ver advertencias antes de crear la versión.
                  </div>
                </div>
              )}
            </div>
          ) : <div style={{ color: "var(--text-mute)", fontSize: 13 }}>Seleccioná un partido en el tablero.</div>}

          {edits.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "var(--text-mute)", marginBottom: 10 }}>Cambios pendientes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {edits.slice(-6).reverse().map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-soft)", padding: "7px 10px", borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                    <Icon name="edit" size={13} style={{ color: "var(--info)", flex: "0 0 auto" }} />{e}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ISelect({ value, onChange, options, icon, mono }) {
  return (
    <div style={{ position: "relative" }}>
      <Icon name={icon} size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        width: "100%", appearance: "none", WebkitAppearance: "none", padding: "10px 30px 10px 33px", borderRadius: 10, border: "1px solid var(--line-strong)",
        background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13.5, fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", cursor: "pointer",
      }}>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <Icon name="chevdown" size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
    </div>
  );
}

window.ManualEditScreen = ManualEditScreen;

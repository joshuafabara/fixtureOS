/* fixtureOS — Screen: Fixture Viewer (date cards + calendar) */

function CatFilterChips({ active, onToggle }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {Object.values(CATS).map((c) => {
        const on = active.includes(c.id);
        const v = CAT_VARS[c.key];
        return (
          <button key={c.id} onClick={() => onToggle(c.id)} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 9px", borderRadius: 99, cursor: "pointer",
            border: `1px solid ${on ? v.ln : "var(--line)"}`, background: on ? v.bg : "var(--surface)",
            color: on ? v.t : "var(--text-mute)", fontWeight: 700, fontSize: 12.5, fontFamily: "var(--font-sans)", opacity: on ? 1 : .7,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: on ? v.dot : "var(--ink-300)" }} />{c.name}
          </button>
        );
      })}
    </div>
  );
}

function MiniSelect({ value, onChange, options, icon }) {
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <Icon name={icon} size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        appearance: "none", WebkitAppearance: "none", padding: "9px 30px 9px 32px", borderRadius: 10, border: "1px solid var(--line-strong)",
        background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-sans)", cursor: "pointer",
      }}>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <Icon name="chevdown" size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
    </div>
  );
}

function FixtureCardsView({ keys, cats, court }) {
  const { nav } = useNav();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {keys.map((k) => {
        const d = dateByKey(k);
        const rows = MATCHES.filter((m) => m.dateKey === k && cats.includes(m.cat) && (court === "all" || m.court === court)).sort((a, b) => a.time.localeCompare(b.time));
        const pub = rows.filter((r) => r.state === "published").length;
        return (
          <Card key={k}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent-soft)", color: "var(--accent-strong)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13 }} className="mono">{d.num}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: -.2 }}>{d.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-mute)" }}>{rows.length} partidos · {pub} publicados</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {pub < rows.length && <Btn variant="ok" size="sm" icon="check">Publicar fecha</Btn>}
                {pub >= rows.length && rows.length > 0 && <StatePill state="published" />}
              </div>
            </div>
            {rows.length ? (
              <TableScroll minWidth={600}>
                <div style={{ display: "grid", gridTemplateColumns: "64px 130px 1fr 110px 110px", padding: "9px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
                  <div>Hora</div><div>Cancha</div><div>Partido</div><div>Categoría</div><div style={{ textAlign: "right" }}>Estado</div>
                </div>
                {rows.map((m, i) => (
                  <div key={m.id} onClick={() => nav("manualedit")} style={{ display: "grid", gridTemplateColumns: "64px 130px 1fr 110px 110px", alignItems: "center", padding: "12px 18px", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none", cursor: "pointer" }}>
                    <div className="mono" style={{ fontWeight: 700, fontSize: 13.5 }}>{m.time}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-soft)", fontWeight: 600 }}><Icon name="pin" size={13} style={{ color: "var(--text-mute)" }} />{m.court.replace("Cancha ", "")}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13.5 }}>
                      {m.locked && <Icon name="lock" size={13} style={{ color: "var(--text-mute)" }} />}
                      {m.conflict && <Icon name="alert" size={14} style={{ color: "var(--crit)" }} />}
                      {m.home} <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>vs</span> {m.away}
                    </div>
                    <div><CatBadge cat={m.cat} size="sm" /></div>
                    <div style={{ textAlign: "right" }}><StatePill state={m.state} dot={false} /></div>
                  </div>
                ))}
              </TableScroll>
            ) : <div style={{ padding: "30px 18px", textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>Sin partidos con los filtros actuales.</div>}
          </Card>
        );
      })}
    </div>
  );
}

const SLOT0 = 9 * 60, SLOTN = 19 * 60, SLOT = 30;
const toSlot = (t) => { const [h, m] = t.split(":").map(Number); return (h * 60 + m - SLOT0) / SLOT; };

function FixtureCalendarView({ dayKey, cats, court }) {
  const courts = court === "all" ? COURTS : [court];
  const slots = [];
  for (let m = SLOT0; m < SLOTN; m += SLOT) slots.push(m);
  const rows = MATCHES.filter((mm) => mm.dateKey === dayKey && cats.includes(mm.cat) && (court === "all" || mm.court === court));
  const d = dateByKey(dayKey);
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontWeight: 800, fontSize: 15.5 }}>{d.label}</div>
        <div style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 600 }}>{rows.length} partidos · cuadrícula 30 min</div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `60px repeat(${courts.length}, minmax(150px,1fr))`, minWidth: 560 }}>
          {/* header */}
          <div style={{ borderBottom: "1px solid var(--line)", borderRight: "1px solid var(--line)" }} />
          {courts.map((c) => (
            <div key={c} style={{ padding: "11px 12px", borderBottom: "1px solid var(--line)", borderRight: "1px solid var(--line)", fontWeight: 800, fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="pin" size={13} style={{ color: "var(--accent)" }} />{c}
            </div>
          ))}
          {/* time col + lanes */}
          <div style={{ position: "relative" }}>
            {slots.map((s, i) => (
              <div key={s} style={{ height: 34, borderRight: "1px solid var(--line)", borderBottom: i % 2 ? "1px solid var(--line)" : "1px dashed var(--line)", position: "relative" }}>
                {i % 2 === 0 && <span className="mono" style={{ position: "absolute", top: -8, right: 8, fontSize: 11, color: "var(--text-mute)", fontWeight: 600, background: "var(--surface)", padding: "0 2px" }}>{String(9 + i / 2).padStart(2, "0")}:00</span>}
              </div>
            ))}
          </div>
          {courts.map((c) => (
            <div key={c} style={{ position: "relative", borderRight: "1px solid var(--line)" }}>
              {slots.map((s, i) => <div key={s} style={{ height: 34, borderBottom: i % 2 ? "1px solid var(--line)" : "1px dashed var(--line)" }} />)}
              {rows.filter((m) => m.court === c).map((m) => {
                const v = CAT_VARS[CATS[m.cat].key];
                const top = toSlot(m.time) * 34;
                return (
                  <div key={m.id} style={{ position: "absolute", top: top + 2, left: 5, right: 5, height: 64, background: v.bg, border: `1px solid ${v.ln}`, borderLeft: `3px solid ${v.dot}`, borderRadius: 8, padding: "6px 9px", overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: v.t }}>{m.time}</span>
                      <span style={{ display: "flex", gap: 3 }}>{m.locked && <Icon name="lock" size={11} style={{ color: v.t }} />}{m.conflict && <Icon name="alert" size={12} style={{ color: "var(--crit)" }} />}</span>
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.home}</div>
                    <div style={{ fontSize: 10.5, color: "var(--text-soft)", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>vs {m.away}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function FixtureScreen() {
  const { nav } = useNav();
  const { isMobile } = useViewport();
  const [view, setView] = React.useState("calendar");
  const [dates, setDates] = React.useState({ start: "2026-07-12", end: "2026-07-12" });
  const [cats, setCats] = React.useState(Object.keys(CATS));
  const [court, setCourt] = React.useState("all");
  const keys = rangeKeys(dates.start, dates.end);
  const toggleCat = (id) => setCats((s) => s.includes(id) ? (s.length > 1 ? s.filter((x) => x !== id) : s) : [...s, id]);

  return (
    <div className="screen-pad" style={{ maxWidth: 1380, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Fixture · Copa Apertura 2026"
        title="Fixture Viewer"
        sub={<span style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontWeight: 700, color: "var(--text)" }}>Versión V5</span>
          <StatePill state="draft" />
          <span style={{ color: "var(--text-mute)" }}>· solo las fechas publicadas son públicas</span>
        </span>}
        right={<>
          <Btn variant="ghost" icon="edit" onClick={() => nav("manualedit")}>Edición manual</Btn>
          <Btn variant="ghost" icon="download" onClick={() => nav("exports")}>Exportar</Btn>
          <Btn variant="ok" icon="check">Publicar fechas</Btn>
        </>}
      />

      <Card style={{ padding: "12px 16px", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <SegTabs tabs={[{ id: "calendar", label: "Calendario", icon: "grid2" }, { id: "cards", label: "Tarjetas por fecha", icon: "list" }]} value={view} onChange={setView} />
          {!isMobile && <div style={{ width: 1, height: 26, background: "var(--line)" }} />}
          <DateFilter value={dates} onChange={setDates} />
          <MiniSelect icon="pin" value={court} onChange={setCourt} options={[{ v: "all", l: "Todas las canchas" }, ...COURTS.map((c) => ({ v: c, l: c }))]} />
          <div style={{ flex: 1 }} />
          <CatFilterChips active={cats} onToggle={toggleCat} />
        </div>
      </Card>

      {view === "cards"
        ? <FixtureCardsView keys={keys} cats={cats} court={court} />
        : <FixtureCalendarView dayKey={keys[0]} cats={cats} court={court} />}

      {view === "calendar" && keys.length > 1 && (
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12.5, color: "var(--text-mute)" }}>Vista calendario muestra un día. Estás viendo <strong>{dateByKey(keys[0]).label}</strong>.</div>
      )}
    </div>
  );
}

window.FixtureScreen = FixtureScreen;

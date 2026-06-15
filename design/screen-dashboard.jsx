/* fixtureOS — Screen: Dashboard (Court Side)
   Date-filterable court board (single day or stacked range) +
   right rail: Avance por categoría · Actividad reciente · Por revisar. */

function StatTile({ icon, label, value, sub, filled, tone, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: "1 1 160px", minWidth: 0, textAlign: "left", borderRadius: "var(--radius)", padding: "16px 18px", cursor: onClick ? "pointer" : "default",
      background: filled ? "linear-gradient(150deg, var(--accent-hot), var(--accent-strong))" : "var(--surface)",
      border: filled ? "none" : "1px solid var(--line)", color: filled ? "#fff" : "var(--text)",
      boxShadow: filled ? "0 10px 26px color-mix(in srgb, var(--accent) 34%, transparent)" : "var(--shadow-sm)", fontFamily: "var(--font-sans)", position: "relative", overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", background: filled ? "rgba(255,255,255,.2)" : "var(--ink-100)", color: filled ? "#fff" : (tone || "var(--ink-500)") }}>
          <Icon name={icon} size={16} />
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: filled ? "#fff" : "var(--text-soft)" }}>{label}</div>
      </div>
      <div className="mono tnum" style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1.2, marginTop: 12, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, marginTop: 5, color: filled ? "rgba(255,255,255,.92)" : "var(--text-mute)" }}>{sub}</div>
    </button>
  );
}

function MatchChip({ m }) {
  const v = CAT_VARS[CATS[m.cat].key];
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderLeft: `3px solid ${v.dot}`, borderRadius: 8, padding: "8px 9px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5, gap: 6 }}>
        <span className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{m.time}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {m.locked && <Icon name="lock" size={12} style={{ color: "var(--text-mute)" }} title="Bloqueado" />}
          {m.conflict && <Icon name="alert" size={13} style={{ color: "var(--crit)" }} title="Conflicto" />}
          <CatBadge cat={m.cat} size="sm" dot={false} />
        </span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.35 }}>{m.home}</div>
      <div style={{ fontSize: 11, color: "var(--text-mute)", lineHeight: 1.35 }}>vs {m.away}</div>
    </div>
  );
}

function CourtColumns({ dateKey, cols = 4 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},minmax(0,1fr))`, gap: 10 }}>
      {COURTS.map((court) => {
        const items = MATCHES.filter((m) => m.dateKey === dateKey && m.court === court).sort((a, b) => a.time.localeCompare(b.time));
        return (
          <div key={court} style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 11, padding: 10, minHeight: 150 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, paddingBottom: 9, marginBottom: 8, borderBottom: "1px solid var(--line)" }}>
              <Icon name="pin" size={13} style={{ color: "var(--accent)" }} /> {court}
              <span className="mono" style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-mute)", fontWeight: 700 }}>{items.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.length ? items.map((m) => <MatchChip key={m.id} m={m} />)
                : <div style={{ fontSize: 11.5, color: "var(--text-mute)", textAlign: "center", padding: "18px 0" }}>Sin partidos</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CatProgress() {
  const data = [
    { cat: "u12", pub: 8, total: 10 }, { cat: "u14", pub: 6, total: 9 }, { cat: "u16", pub: 4, total: 12 },
    { cat: "u18", pub: 3, total: 6 }, { cat: "sub21", pub: 2, total: 6 }, { cat: "senior", pub: 0, total: 5 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((c) => {
        const v = CAT_VARS[CATS[c.cat].key];
        const pct = Math.round((c.pub / c.total) * 100);
        return (
          <div key={c.cat}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <CatBadge cat={c.cat} size="sm" />
              <span className="mono tnum" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)" }}>{c.pub}/{c.total} fechas</span>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: "var(--ink-100)", overflow: "hidden" }}>
              <div style={{ width: pct + "%", height: "100%", borderRadius: 99, background: v.dot }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityFeed() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {ACTIVITY.map((a, i) => {
        const dot = { approve: "var(--ok)", edit: "var(--info)", publish: "var(--accent)", contact: "var(--cat-cia-dot)", alert: "var(--warn)", import: "var(--ink-400)" }[a.kind];
        return (
          <div key={i} style={{ display: "flex", gap: 11, padding: "7px 0" }}>
            <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: dot, marginTop: 4, boxShadow: `0 0 0 3px color-mix(in srgb, ${dot} 16%, transparent)` }} />
              {i < ACTIVITY.length - 1 && <span style={{ flex: 1, width: 2, background: "var(--line)", marginTop: 3 }} />}
            </div>
            <div style={{ paddingBottom: 6, minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                <strong style={{ fontWeight: 700 }}>{a.user}</strong> <span style={{ color: "var(--text-soft)" }}>{a.action}</span> <strong style={{ fontWeight: 700 }}>{a.entity}</strong>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 4 }}>{a.time}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewQueue() {
  const { nav } = useNav();
  const items = [
    ["crit", "Solapamiento de cancha", "U16 · Cancha Norte · 10:30", "dryrun"],
    ["crit", "Equipo retirado sin resolver", "Senior · Dragones", "dryrun"],
    ["warn", "3 clubes sin WhatsApp", "Cóndores, Toros, Dragones", "clubs"],
    ["info", "2 dry runs pendientes", "Generados hoy", "dryrun"],
  ];
  const tint = (sev) => sev === "crit" ? "var(--crit)" : sev === "warn" ? "var(--warn)" : "var(--info)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {items.map(([sev, t, d, to], i) => (
        <button key={i} onClick={() => nav(to)} style={{ display: "flex", gap: 10, padding: "10px 11px", borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--line)", borderLeft: `3px solid ${tint(sev)}`, cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)", width: "100%", color: "var(--text)" }}>
          <div style={{ flex: "0 0 auto", marginTop: 1, color: tint(sev) }}>
            <Icon name={sev === "info" ? "zap" : "alert"} size={16} sw={2.1} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, color: "var(--text)" }}>{t}</div>
            <div style={{ fontSize: 11, color: "var(--text-soft)", marginTop: 2 }}>{d}</div>
          </div>
          <Icon name="chevright" size={15} style={{ color: "var(--text-mute)", flex: "0 0 auto", marginTop: 2 }} />
        </button>
      ))}
    </div>
  );
}

function DashboardScreen() {
  const { nav } = useNav();
  const { isMobile, isTablet, narrow } = useViewport();
  const [dates, setDates] = React.useState({ start: "2026-07-12", end: "2026-07-12" });
  const keys = rangeKeys(dates.start, dates.end);
  const courtCols = isMobile ? 1 : isTablet ? 2 : 4;

  const rail = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHead title="Por revisar" icon="alert" right={<span onClick={() => nav("dryrun")} style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", cursor: "pointer" }}>Ver todo</span>} />
        <div style={{ padding: "14px 16px 16px" }}><ReviewQueue /></div>
      </Card>
      <Card>
        <CardHead title="Avance por categoría" icon="layers" />
        <div style={{ padding: "15px 18px" }}><CatProgress /></div>
      </Card>
      <Card>
        <CardHead title="Actividad reciente" icon="history" />
        <div style={{ padding: "10px 18px 14px" }}><ActivityFeed /></div>
      </Card>
    </div>
  );

  return (
    <div className="screen-pad" style={{ maxWidth: 1480, margin: "0 auto" }}>
      <PageHeader
        title="Centro de operaciones"
        sub="Copa Apertura 2026 · 48 equipos en 6 categorías"
        right={<>
          <Btn variant="ghost" icon="download" onClick={() => nav("exports")}>Exportar</Btn>
          <Btn variant="primary" icon="zap" onClick={() => nav("dryrun")}>Generar Dry Run</Btn>
        </>}
      />

      <div style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <StatTile icon="zap" label="Dry runs pendientes" value="2" sub="Toca para revisar →" filled onClick={() => nav("dryrun")} />
        <StatTile icon="trophy" label="Torneos activos" value="3" sub="1 publicado · 2 borrador" tone="var(--accent)" onClick={() => nav("tournaments")} />
        <StatTile icon="calendar" label="Fechas publicadas" value="18" sub="+4 esta semana" tone="var(--ok)" onClick={() => nav("fixture")} />
        <StatTile icon="phone" label="Contactos faltantes" value="3" sub="clubes sin WhatsApp" tone="var(--warn)" onClick={() => nav("clubs")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: narrow ? "minmax(0,1fr)" : "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        {/* Court board */}
        <Card style={{ padding: "16px 18px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -.3 }}>En cancha</div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-mute)", padding: "3px 8px", background: "var(--ink-100)", borderRadius: 99 }}>
                {MATCHES.filter((m) => keys.includes(m.dateKey)).length} partidos
              </span>
            </div>
            <DateFilter value={dates} onChange={setDates} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {keys.map((k, i) => {
              const d = dateByKey(k);
              const count = MATCHES.filter((m) => m.dateKey === k).length;
              return (
                <div key={k}>
                  {keys.length > 1 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent-strong)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12 }} className="mono">{d.num}</span>
                      <span style={{ fontWeight: 800, fontSize: 14.5 }}>{d.label}</span>
                      <span className="mono" style={{ fontSize: 11.5, color: "var(--text-mute)", fontWeight: 700 }}>{count} partidos</span>
                      <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                    </div>
                  )}
                  <CourtColumns dateKey={k} cols={courtCols} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right rail */}
        {rail}
      </div>
    </div>
  );
}

window.DashboardScreen = DashboardScreen;

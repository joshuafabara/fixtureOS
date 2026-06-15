/* fixtureOS — Screen: Date Context (/context/date) */

const DOW_ES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const MONTH_ES = "Julio 2026";
const TOURNEY_DAYS = { 11: "2026-07-11", 12: "2026-07-12", 13: "2026-07-13" };

function MiniCalendar({ selected, onSelect }) {
  // July 2026: build a Monday-first grid
  const first = new Date(2026, 6, 1);
  let lead = (first.getDay() + 6) % 7; // Mon=0
  const days = 31;
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--text-mute)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="chevleft" size={15} /></button>
        <div style={{ fontWeight: 800, fontSize: 14.5 }}>{MONTH_ES}</div>
        <button style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--text-mute)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="chevright" size={15} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {DOW_ES.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: "var(--text-mute)", padding: "4px 0" }}>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = TOURNEY_DAYS[d];
          const isTourney = !!key;
          const on = key && key === selected;
          return (
            <button key={i} onClick={() => isTourney && onSelect(key)} disabled={!isTourney} style={{
              aspectRatio: "1", borderRadius: 9, border: on ? "1px solid var(--accent)" : "1px solid transparent",
              background: on ? "var(--accent)" : isTourney ? "var(--accent-soft)" : "transparent",
              color: on ? "#fff" : isTourney ? "var(--accent-strong)" : "var(--text-mute)",
              fontWeight: isTourney ? 800 : 500, fontSize: 13, cursor: isTourney ? "pointer" : "default", fontFamily: "var(--font-mono)",
              position: "relative",
            }}>
              {d}
              {isTourney && !on && <span style={{ position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: 99, background: "var(--accent)" }} />}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, fontSize: 11.5, color: "var(--text-mute)" }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--accent-soft)", border: "1px solid var(--accent-soft-2)" }} /> Días del torneo
      </div>
    </div>
  );
}

function DateContextScreen() {
  const { nav } = useNav();
  const { wide } = useViewport();
  const [sel, setSel] = React.useState("2026-07-12");
  const d = dateByKey(sel) || FIX_DATES[1];
  const [text, setText] = React.useState("Spartans U16 no puede jugar antes de las 11:00. La Cancha Sur no está disponible después de las 18:00. El cruce U14 solo después de las 14:00.");
  const [parsed, setParsed] = React.useState(true);
  const append = (ex) => { setText((t) => (t ? t + " " : "") + ex); setParsed(false); };

  const affected = [
    { match: "Spartans BC vs Águilas", cat: "u16", slot: "10:30 · Cancha Norte", issue: "Antes de 11:00", fix: "Mover a 11:00", sev: "warn" },
    { match: "Titanes vs Spartans", cat: "u14", slot: "16:30 · Cancha Sur", issue: "Sur tras 18:00 OK", fix: "Sin cambio", sev: "info" },
    { match: "Pumas vs Halcones", cat: "u18", slot: "12:00 · Cancha Sur", issue: "Sur disponible", fix: "Sin cambio", sev: "info" },
  ];

  return (
    <div className="screen-pad" style={{ maxWidth: 1380, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Contexto · Fecha Específica"
        title="Contexto de Fecha"
        sub="Restricciones de una fecha o fin de semana · sobrescriben a categoría, torneo y organización."
        right={<>
          <Btn variant="ghost" icon="history" onClick={() => nav("ctxhistory")}>Historial</Btn>
          <Btn variant="primary" icon="zap" onClick={() => nav("dryrun")}>Generar Dry Run</Btn>
        </>}
      />

      <CtxVersionBar scope="date" version="CV12" by="Admin" date="Hoy · 14:02" />

      <div style={{ display: "grid", gridTemplateColumns: wide ? "260px minmax(0,1.7fr) 300px" : "1fr", gap: 16, alignItems: "start" }}>
        {/* Calendar + existing rules */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 16 }}>
            <MiniCalendar selected={sel} onSelect={setSel} />
          </Card>
          <Card>
            <CardHead title="Reglas existentes" sub={d.label} icon="lock" />
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              {CTX_RULES.date.map((r, i) => <ActiveRuleCard key={i} rule={r} />)}
            </div>
          </Card>
        </div>

        {/* Editor */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name="calendar" size={16} /></span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Restricciones para {d.dow} {d.num}</div>
              <div style={{ fontSize: 12, color: "var(--text-mute)" }} className="mono">{sel}</div>
            </div>
          </div>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setParsed(false); }} rows={wide ? 8 : 7}
            placeholder="Describe las restricciones para esta fecha…"
            style={{ width: "100%", resize: "vertical", padding: "13px 14px", borderRadius: "var(--radius)", border: "1px solid var(--line-strong)", background: "var(--surface-2)", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.6, outline: "none", marginTop: 12 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "13px 0 16px", flexWrap: "wrap" }}>
            <Btn variant="primary" icon="zap" onClick={() => setParsed(true)}>Interpretar</Btn>
          </div>
          <PromptExamples scope="date" onPick={append} />

          {/* Affected matches */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}><Icon name="layers" size={14} style={{ color: "var(--accent)" }} /> Partidos afectados</div>
            <TableScroll minWidth={560}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1fr 1fr", padding: "9px 13px", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: .5, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
                <div>Partido</div><div>Slot actual</div><div>Posible problema</div><div>Sugerencia</div>
              </div>
              {affected.map((a, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 1fr 1fr", alignItems: "center", padding: "11px 13px", borderBottom: i < affected.length - 1 ? "1px solid var(--line)" : "none", background: a.sev === "warn" ? "color-mix(in srgb, var(--warn-bg) 40%, transparent)" : "transparent" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}><CatBadge cat={a.cat} size="sm" dot={false} /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{a.match}</span></div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--text-soft)" }}>{a.slot}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: a.sev === "warn" ? "var(--warn)" : "var(--text-mute)" }}>{a.issue}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: a.sev === "warn" ? "var(--accent)" : "var(--text-mute)" }}>{a.fix}</div>
                </div>
              ))}
            </TableScroll>
          </div>
        </Card>

        {/* Parsed */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Vista previa interpretada</div>
            {parsed ? <SevTag sev="info" size="sm">Interpretado</SevTag> : <span style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 700 }}>Pendiente</span>}
          </div>
          {parsed ? (
            <div>
              <ParsedGroup title="Restricciones de equipo" icon="users" tone="var(--warn)" items={["Spartans U16: no antes de 11:00"]} />
              <ParsedGroup title="Restricciones de cancha" icon="pin" tone="var(--accent)" items={["Cancha Sur: no disponible tras 18:00"]} />
              <ParsedGroup title="Restricciones de horario" icon="clock" tone="var(--info)" items={["Cruce U14: solo después de 14:00"]} />
              <ParsedGroup title="Overrides de prioridad" icon="flag" tone="var(--cat-vio-dot)" items={["Ninguno en esta fecha"]} />
              <ParsedGroup title="Advertencias" icon="alert" tone="var(--warn)" items={["1 partido (U16) requiere reubicación"]} />
            </div>
          ) : (
            <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>
              <Icon name="zap" size={24} style={{ color: "var(--text-mute)", marginBottom: 8 }} />
              <div>Pulsa <strong style={{ color: "var(--text-soft)" }}>Interpretar</strong>.</div>
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <Btn variant="subtle" icon="x">Descartar cambios</Btn>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" icon="target" onClick={() => nav("ctximpact")}>Simular impacto</Btn>
        <Btn variant="primary" icon="check" onClick={() => nav("ctxhistory")}>Guardar contexto de fecha</Btn>
      </div>
    </div>
  );
}

window.DateContextScreen = DateContextScreen;

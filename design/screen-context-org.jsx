/* fixtureOS — Screen: Organization Context (/context/organization) */

function CtxVersionBar({ scope, version, by, date, eligibleBadge }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)", marginBottom: 16, flexWrap: "wrap" }}>
      <CtxScopeBadge scope={scope} />
      <div style={{ width: 1, height: 22, background: "var(--line)" }} className="hide-mobile" />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text-soft)", fontWeight: 600 }}>
        <Icon name="branch" size={14} style={{ color: "var(--text-mute)" }} /> Versión actual <span className="mono" style={{ fontWeight: 800, color: "var(--text)" }}>{version}</span>
      </span>
      <span style={{ fontSize: 12.5, color: "var(--text-mute)" }} className="hide-mobile">· editado por {by} · <span className="mono">{date}</span></span>
      <div style={{ flex: 1 }} />
      {eligibleBadge}
    </div>
  );
}

function OrgContextScreen() {
  const { nav } = useNav();
  const { wide } = useViewport();
  const [text, setText] = React.useState("Todos los torneos usan las cuatro canchas. Los partidos van de viernes a domingo, de 08:00 a 21:00. La duración por defecto es de 60 minutos. Intenta agrupar a los equipos del mismo club. Todas las categorías tienen la misma prioridad.");
  const [parsed, setParsed] = React.useState(true);
  const append = (ex) => { setText((t) => (t ? t + " " : "") + ex); setParsed(false); };

  return (
    <div className="screen-pad" style={{ maxWidth: 1480, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Contexto · Quito Basket Liga"
        title="Contexto de Organización"
        sub="Reglas globales aplicadas a todos los torneos de la organización."
        right={<>
          <Btn variant="ghost" icon="history" onClick={() => nav("ctxhistory")}>Historial</Btn>
          <Btn variant="ghost" icon="target" onClick={() => nav("ctximpact")}>Simular impacto</Btn>
        </>}
      />

      <CtxVersionBar scope="org" version="CV8" by="Admin" date="Ayer · 09:10" />

      <div style={{ display: "grid", gridTemplateColumns: wide ? "250px minmax(0,1.7fr) 290px" : "1fr", gap: 16, alignItems: "start" }}>
        {/* Active rules */}
        <Card>
          <CardHead title="Reglas activas" sub="6 reglas en esta organización" icon="check" />
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            {CTX_RULES.org.map((r, i) => <ActiveRuleCard key={i} rule={r} />)}
          </div>
        </Card>

        {/* Prompt editor */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name="message" size={16} /></span>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Editor de reglas</div>
          </div>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setParsed(false); }} rows={wide ? 9 : 7}
            placeholder="Describe las reglas globales para todos los torneos…"
            style={{ width: "100%", resize: "vertical", padding: "13px 14px", borderRadius: "var(--radius)", border: "1px solid var(--line-strong)", background: "var(--surface-2)", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.6, outline: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "13px 0 16px", flexWrap: "wrap" }}>
            <Btn variant="primary" icon="zap" onClick={() => setParsed(true)}>Interpretar contexto</Btn>
            {!parsed && <span style={{ fontSize: 12, color: "var(--warn)", fontWeight: 700 }}>Cambios sin interpretar</span>}
          </div>
          <PromptExamples scope="org" onPick={append} />
        </Card>

        {/* Parsed preview */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Vista previa interpretada</div>
            {parsed ? <SevTag sev="info" size="sm">Interpretado</SevTag> : <span style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 700 }}>Pendiente</span>}
          </div>
          {parsed ? (
            <div>
              <ParsedGroup title="Disponibilidad" icon="calendar" tone="var(--info)" items={["Días de juego: Vie, Sáb, Dom", "Horario: 08:00 – 21:00"]} />
              <ParsedGroup title="Canchas" icon="pin" tone="var(--accent)" items={["Central, Norte, Sur, Polideportivo"]} />
              <ParsedGroup title="Duraciones" icon="clock" tone="var(--info)" items={["Por defecto: 60 minutos"]} />
              <ParsedGroup title="Prioridades" icon="flag" tone="var(--accent)" items={["Todas las categorías iguales"]} />
              <ParsedGroup title="Agrupación de clubes" icon="users" tone="var(--cat-cia-dot)" items={["Activada (suave)"]} />
              <ParsedGroup title="Advertencias" icon="alert" tone="var(--warn)" items={["Sin reglas de descanso entre partidos definidas"]} />
            </div>
          ) : (
            <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>
              <Icon name="zap" size={24} style={{ color: "var(--text-mute)", marginBottom: 8 }} />
              <div>Pulsa <strong style={{ color: "var(--text-soft)" }}>Interpretar contexto</strong>.</div>
            </div>
          )}
        </Card>
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <Btn variant="subtle" icon="x">Descartar cambios</Btn>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" icon="target" onClick={() => nav("ctximpact")}>Simular impacto</Btn>
        <Btn variant="primary" icon="check" onClick={() => nav("ctxhistory")}>Guardar versión de contexto</Btn>
      </div>
    </div>
  );
}

window.OrgContextScreen = OrgContextScreen;
window.CtxVersionBar = CtxVersionBar;

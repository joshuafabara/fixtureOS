/* fixtureOS — Screen: Tournament Context (/context/tournament/:id) */

function TournamentContextScreen() {
  const { nav } = useNav();
  const { wide } = useViewport();
  const [text, setText] = React.useState("Los domingos usa solo Cancha Central y Norte. La Cancha Sur está cerrada el domingo por mantenimiento. Prioriza las categorías menores en los horarios tempranos. Sin partidos antes de las 09:00.");
  const [parsed, setParsed] = React.useState(true);
  const append = (ex) => { setText((t) => (t ? t + " " : "") + ex); setParsed(false); };

  return (
    <div className="screen-pad" style={{ maxWidth: 1480, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Contexto · Torneo"
        title="Contexto de Torneo · Copa Apertura 2026"
        sub="Sobrescribe las reglas de organización para este torneo."
        right={<>
          <Btn variant="ghost" icon="history" onClick={() => nav("ctxhistory")}>Historial</Btn>
          <Btn variant="primary" icon="zap" onClick={() => nav("dryrun")}>Generar Dry Run</Btn>
        </>}
      />

      <CtxVersionBar scope="tournament" version="CV10" by="M. Vera" date="Hoy · 11:40" />

      <div style={{ display: "grid", gridTemplateColumns: wide ? "260px minmax(0,1.7fr) 300px" : "1fr", gap: 16, alignItems: "start" }}>
        {/* Inherited + overrides */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <CardHead title="Reglas heredadas" sub="Desde Organización" icon="arrowdown" />
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              {CTX_INHERITED.tournament.map((r, i) => <ActiveRuleCard key={i} rule={r} inherited />)}
            </div>
          </Card>
          <Card>
            <CardHead title="Sobrescrituras del torneo" sub="Específicas de Copa Apertura" icon="edit" />
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              {CTX_RULES.tournament.map((r, i) => <ActiveRuleCard key={i} rule={r} />)}
            </div>
          </Card>
        </div>

        {/* Prompt editor */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name="message" size={16} /></span>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Editor de reglas del torneo</div>
          </div>
          <textarea value={text} onChange={(e) => { setText(e.target.value); setParsed(false); }} rows={wide ? 9 : 7}
            placeholder="Describe las reglas específicas de este torneo…"
            style={{ width: "100%", resize: "vertical", padding: "13px 14px", borderRadius: "var(--radius)", border: "1px solid var(--line-strong)", background: "var(--surface-2)", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.6, outline: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "13px 0 16px", flexWrap: "wrap" }}>
            <Btn variant="primary" icon="zap" onClick={() => setParsed(true)}>Interpretar</Btn>
            {!parsed && <span style={{ fontSize: 12, color: "var(--warn)", fontWeight: 700 }}>Cambios sin interpretar</span>}
          </div>
          <PromptExamples scope="tournament" onPick={append} />

          <div style={{ marginTop: 16 }}>
            <RuleConflictWarning>
              <strong style={{ color: "var(--crit)" }}>Regla en conflicto:</strong> "Cancha Sur cerrada el domingo" choca con un partido U18 programado en Cancha Sur el Dom 13. La regla de torneo gana — el partido se reubicará.
            </RuleConflictWarning>
          </div>
        </Card>

        {/* Parsed preview */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Vista previa interpretada</div>
            {parsed ? <SevTag sev="info" size="sm">Interpretado</SevTag> : <span style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 700 }}>Pendiente</span>}
          </div>
          {parsed ? (
            <div>
              <ParsedGroup title="Reglas nuevas" icon="plus" tone="var(--ok)" items={["Domingos solo Central y Norte", "Cancha Sur cerrada el domingo"]} />
              <ParsedGroup title="Reglas cambiadas" icon="swap" tone="var(--info)" items={["Prioridad: categorías menores temprano (antes: iguales)"]} />
              <ParsedGroup title="Reglas en conflicto" icon="alert" tone="var(--warn)" items={["Cancha Sur cerrada vs partido U18 programado"]} />
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", marginBottom: 9 }}>Categorías afectadas</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {["u14", "u16", "u18", "senior"].map((c) => <CatBadge key={c} cat={c} size="sm" />)}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>
              <Icon name="zap" size={24} style={{ color: "var(--text-mute)", marginBottom: 8 }} />
              <div>Pulsa <strong style={{ color: "var(--text-soft)" }}>Interpretar</strong>.</div>
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

window.TournamentContextScreen = TournamentContextScreen;

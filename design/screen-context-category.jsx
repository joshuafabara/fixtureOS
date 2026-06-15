/* fixtureOS — Screen: Category Context (/context/category/:id) */

function CategoryContextScreen() {
  const { nav } = useNav();
  const { narrow } = useViewport();
  const [catId, setCatId] = React.useState("u16");
  const cat = CATEGORIES.find((c) => c.id === catId) || CATEGORIES[0];
  const eligible = cat.status === "ready";
  const [text, setText] = React.useState("U16 empieza el 11 de julio. Usa 2 grupos, round robin simple, los 2 mejores de cada grupo avanzan a semifinales y final. Los partidos duran 75 minutos.");
  const [parsed, setParsed] = React.useState(true);
  const append = (ex) => { setText((t) => (t ? t + " " : "") + ex); setParsed(false); };

  return (
    <div className="screen-pad" style={{ maxWidth: 1380, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Contexto · Categoría"
        title="Contexto de Categoría"
        sub="Define elegibilidad, fecha de inicio, modo de juego, duración y restricciones."
        right={<>
          <Btn variant="ghost" icon="history" onClick={() => nav("ctxhistory")}>Historial</Btn>
          <Btn variant="primary" icon="zap" onClick={() => nav("dryrun")} style={eligible ? {} : { opacity: .5, cursor: "not-allowed", boxShadow: "none" }}>Generar Dry Run</Btn>
        </>}
      />

      {/* Category selector */}
      <div style={{ display: "flex", gap: 7, marginBottom: 16, overflowX: "auto" }} className="tbl-scroll">
        {CATEGORIES.map((c) => {
          const on = c.id === catId;
          const v = CAT_VARS[c.key];
          return (
            <button key={c.id} onClick={() => setCatId(c.id)} style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 10, border: `1px solid ${on ? v.dot : "var(--line)"}`, background: on ? v.bg : "var(--surface)", color: on ? v.t : "var(--text-soft)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: v.dot }} />{c.name}
              {c.status !== "ready" && <Icon name="alert" size={13} style={{ color: "var(--warn)" }} />}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "330px minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        {/* Eligibility + inherited */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
              <CatBadge cat={cat.id} />
              <span className="mono" style={{ fontSize: 12.5, color: "var(--text-mute)", fontWeight: 700, marginLeft: "auto" }}>{cat.teams} equipos</span>
            </div>
            <EligibilityPanel
              startDate={cat.start === "—" ? null : `${cat.start} 2026`}
              gameMode={cat.mode === "—" ? null : cat.mode}
              teams={cat.teams}
              eligible={eligible}
            />
          </Card>
          <Card>
            <CardHead title="Reglas heredadas" icon="arrowdown" />
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              {CTX_INHERITED.category.map((r, i) => <ActiveRuleCard key={i} rule={r} inherited />)}
            </div>
          </Card>
        </div>

        {/* Editor + game mode */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name="message" size={16} /></span>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Editor de contexto de categoría</div>
            </div>
            <textarea value={text} onChange={(e) => { setText(e.target.value); setParsed(false); }} rows={4}
              placeholder="Ej: U17 empieza el 15 de junio. 2 grupos, round robin simple, top 2 a semifinales…"
              style={{ width: "100%", resize: "vertical", padding: "13px 14px", borderRadius: "var(--radius)", border: "1px solid var(--line-strong)", background: "var(--surface-2)", color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.6, outline: "none" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "13px 0 16px", flexWrap: "wrap" }}>
              <Btn variant="primary" icon="zap" onClick={() => setParsed(true)}>Interpretar contexto de categoría</Btn>
            </div>
            <PromptExamples scope="category" onPick={append} />
          </Card>

          {/* Parsed game mode + visual */}
          <Card>
            <CardHead title="Modo de juego interpretado" icon="layers" right={parsed ? <SevTag sev="info" size="sm">Interpretado</SevTag> : null} />
            <div style={{ padding: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 10, marginBottom: 18 }}>
                {[["Grupos", GAME_MODE.groups], ["Vueltas", GAME_MODE.rounds], ["Clasifican", GAME_MODE.classify], ["Playoffs", GAME_MODE.playoffs.join(" · ")], ["Duración", GAME_MODE.duration + " min"], ["Prioridad", "Heredada"]].map(([l, v]) => (
                  <div key={l} style={{ padding: "11px 13px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: .4 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}><Icon name="branch" size={14} style={{ color: "var(--accent)" }} /> Vista previa del cuadro</div>
              <GameModePreview mode={GAME_MODE} />
            </div>
          </Card>
        </div>
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <Btn variant="subtle" icon="x">Descartar cambios</Btn>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" icon="target" onClick={() => nav("ctximpact")}>Simular impacto</Btn>
        <Btn variant="ok" icon="check" onClick={() => nav("ctxhistory")}>Confirmar modo de juego</Btn>
      </div>
    </div>
  );
}

window.CategoryContextScreen = CategoryContextScreen;

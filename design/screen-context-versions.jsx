/* fixtureOS — Screens: Context Version History · Compare · Impact Simulator */

/* ---------------- Context Version History ---------------- */
function ContextHistoryScreen() {
  const { nav } = useNav();
  const [scope, setScope] = React.useState("all");
  const rows = CTX_VERSIONS.filter((v) => scope === "all" || v.scope === scope);

  return (
    <div className="screen-pad" style={{ maxWidth: 1280, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Contexto"
        title="Historial de Contextos"
        sub="Cada cambio de reglas crea una versión inmutable · restaurar genera una versión nueva."
        right={<Btn variant="ghost" icon="gitcompare" onClick={() => nav("ctxcompare")}>Comparar versiones</Btn>}
      />

      {/* Filters */}
      <Card style={{ padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {[["all", "Todos los ámbitos"], ...Object.values(CTX_SCOPES).map((s) => [s.id, s.label])].map(([id, lb]) => {
            const on = scope === id;
            return <button key={id} onClick={() => setScope(id)} style={{ padding: "7px 13px", borderRadius: 99, border: `1px solid ${on ? "var(--accent)" : "var(--line)"}`, background: on ? "var(--accent-soft)" : "var(--surface)", color: on ? "var(--accent-strong)" : "var(--text-soft)", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}>{lb}</button>;
          })}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12.5, color: "var(--text-mute)", fontWeight: 600 }}>{rows.length} versiones</span>
        </div>
      </Card>

      <Card>
        <TableScroll minWidth={760}>
          <div style={{ display: "grid", gridTemplateColumns: "70px 120px 1.2fr 1fr 130px 250px", padding: "10px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
            <div>Versión</div><div>Ámbito</div><div>Objetivo</div><div>Resumen</div><div>Autor</div><div style={{ textAlign: "right" }}>Acciones</div>
          </div>
          {rows.map((v, i) => (
            <div key={v.v} style={{ display: "grid", gridTemplateColumns: "70px 120px 1.2fr 1fr 130px 250px", alignItems: "center", padding: "13px 18px", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none", background: v.current ? "var(--accent-soft)" : "transparent" }}>
              <div className="mono" style={{ fontWeight: 800, fontSize: 13.5, color: v.current ? "var(--accent-strong)" : "var(--text)" }}>{v.v}</div>
              <div><CtxScopeBadge scope={v.scope} size="sm" /></div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{v.target}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-soft)", paddingRight: 10 }}>{v.summary}</div>
              <div style={{ fontSize: 12.5 }}><div style={{ fontWeight: 700 }}>{v.by}</div><div className="mono" style={{ fontSize: 11.5, color: "var(--text-mute)" }}>{v.date}</div></div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <Btn variant="subtle" size="sm" icon="eye" onClick={() => nav(CTX_SCOPES[v.scope].screen)}>Ver</Btn>
                <Btn variant="subtle" size="sm" icon="gitcompare" onClick={() => nav("ctxcompare")}>Comparar</Btn>
                {!v.current && <Btn variant="subtle" size="sm" icon="refresh" title="Restaurar (crea versión nueva)" />}
              </div>
            </div>
          ))}
        </TableScroll>
      </Card>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12.5, color: "var(--text-mute)" }}>
        <Icon name="lock" size={15} /> El historial nunca se sobrescribe. Restaurar una versión puede disparar una simulación de impacto.
      </div>
    </div>
  );
}

/* ---------------- Context Compare ---------------- */
function ContextCompareScreen() {
  const { nav } = useNav();
  const { isMobile } = useViewport();
  const [left, setLeft] = React.useState("CV10");
  const [right, setRight] = React.useState("CV12");
  const counts = { added: CTX_DIFF.filter((r) => r.type === "added").length, changed: CTX_DIFF.filter((r) => r.type === "changed").length, removed: CTX_DIFF.filter((r) => r.type === "removed").length, impacts: CTX_DIFF.filter((r) => r.sev === "warn").length };

  const Picker = ({ value, onChange, side }) => (
    <div style={{ flex: "1 1 240px", minWidth: 0, border: "1px solid var(--line)", borderRadius: "var(--radius)", background: "var(--surface)", padding: "14px 16px", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "var(--text-mute)", marginBottom: 9 }}>{side === "left" ? "Versión base" : "Versión comparada"}</div>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", appearance: "none", WebkitAppearance: "none", padding: "10px 32px 10px 12px", borderRadius: 10, border: "1px solid var(--line-strong)", background: side === "left" ? "var(--ink-50)" : "var(--accent-soft)", color: side === "left" ? "var(--text)" : "var(--accent-strong)", fontWeight: 800, fontSize: 14, fontFamily: "var(--font-mono)", cursor: "pointer" }}>
          {CTX_VERSIONS.map((v) => <option key={v.v} value={v.v}>{v.v} · {CTX_SCOPES[v.scope].label}</option>)}
        </select>
        <Icon name="chevdown" size={15} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
      </div>
      {(() => { const ver = CTX_VERSIONS.find((x) => x.v === value); return ver && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}><CtxScopeBadge scope={ver.scope} size="sm" /><span style={{ fontSize: 12, color: "var(--text-mute)" }} className="mono">{ver.date}</span></div>; })()}
    </div>
  );

  return (
    <div className="screen-pad" style={{ maxWidth: 1180, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Contexto"
        title="Comparar Contextos"
        sub="Diferencias de reglas entre dos versiones · con estimación de impacto en el fixture."
        right={<Btn variant="primary" icon="target" onClick={() => nav("ctximpact")}>Simular impacto</Btn>}
      />

      <div style={{ display: "flex", alignItems: "stretch", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <Picker value={left} onChange={setLeft} side="left" />
        <button onClick={() => { setLeft(right); setRight(left); }} title="Intercambiar" style={{ alignSelf: "center", width: 40, height: 40, borderRadius: 99, border: "1px solid var(--line-strong)", background: "var(--surface)", display: "grid", placeItems: "center", color: "var(--text-soft)", cursor: "pointer", flex: "0 0 auto" }}><Icon name="swap" size={18} /></button>
        <Picker value={right} onChange={setRight} side="right" />
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        {[["plus", counts.added, "Reglas añadidas", "var(--ok)"], ["swap", counts.changed, "Reglas cambiadas", "var(--info)"], ["x", counts.removed, "Reglas eliminadas", "var(--text-mute)"], ["alert", counts.impacts, "Impactos en fixture", "var(--warn)"]].map(([ic, n, l, tone]) => (
          <div key={l} style={{ flex: "1 1 150px", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone }}><Icon name={ic} size={18} sw={2.2} /></div>
            <div><div className="mono tnum" style={{ fontSize: 24, fontWeight: 700, letterSpacing: -1, color: tone }}>{n}</div><div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-soft)" }}>{l}</div></div>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontWeight: 800, fontSize: 14.5 }}>Diferencias de reglas</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700 }}><span className="mono" style={{ color: "var(--text-soft)" }}>{left}</span><Icon name="arrowright" size={14} style={{ color: "var(--text-mute)" }} /><span className="mono" style={{ color: "var(--accent-strong)" }}>{right}</span></div>
        </div>
        {CTX_DIFF.map((row, i) => <RuleDiffRow key={i} row={row} />)}
      </Card>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-mute)" }}><Icon name="history" size={15} /> Las reglas sin cambios no se listan.</div>
        <div style={{ flex: 1 }} />
        <Btn variant="primary" icon="target" onClick={() => nav("ctximpact")}>Simular impacto en fixture</Btn>
      </div>
    </div>
  );
}

/* ---------------- Context Impact Simulator ---------------- */
function ContextImpactScreen() {
  const { nav } = useNav();
  const { isMobile } = useViewport();
  const I = CTX_IMPACT;

  return (
    <div className="screen-pad" style={{ maxWidth: 1180, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Contexto"
        title="Simulador de Impacto"
        sub="Vista previa rápida de cómo un cambio de contexto afectaría al fixture · antes del Dry Run."
        right={<Btn variant="ghost" icon="chevleft" onClick={() => nav("context")}>Volver a contexto</Btn>}
      />

      {/* Change banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: "var(--radius)", background: "var(--accent-soft)", border: "1px solid var(--accent-soft-2)", marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--surface)", color: "var(--accent)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name="target" size={18} /></span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--accent-strong)" }}>Cambio de contexto</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }} className="mono">{I.change}</div>
        </div>
        <div style={{ flex: 1 }} />
        <SevTag sev="warn" size="sm">{I.summary.warnings} advertencias</SevTag>
        {I.summary.conflicts > 0 && <SevTag sev="crit" size="sm">{I.summary.conflicts} conflicto</SevTag>}
      </div>

      {/* Impact cards */}
      <div style={{ marginBottom: 16 }}>
        <ImpactCards summary={I.summary} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, alignItems: "start" }}>
        {/* Affected categories */}
        <Card>
          <CardHead title="Categorías afectadas" icon="layers" />
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            {I.cats.map((c, i) => (
              <button key={i} onClick={() => nav("ctxcategory")} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line)", borderLeft: `3px solid ${c.sev === "warn" ? "var(--warn)" : "var(--info)"}`, cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)", width: "100%" }}>
                <CatBadge cat={c.cat} size="sm" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{c.impact}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-mute)" }}>{c.detail}</div>
                </div>
                <SevTag sev={c.sev} size="sm" />
                <Icon name="chevright" size={15} style={{ color: "var(--text-mute)", flex: "0 0 auto" }} />
              </button>
            ))}
          </div>
        </Card>

        {/* Affected dates */}
        <Card>
          <CardHead title="Fechas afectadas" icon="calendar" />
          <TableScroll minWidth={420}>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 70px 70px 90px 70px", padding: "10px 16px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .5, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
              <div>Fecha</div><div>Nuevos</div><div>Movidos</div><div>Conflictos</div><div style={{ textAlign: "right" }}>Ver</div>
            </div>
            {I.dates.map((dt, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.3fr 70px 70px 90px 70px", alignItems: "center", padding: "12px 16px", borderBottom: i < I.dates.length - 1 ? "1px solid var(--line)" : "none" }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{dt.label}</div>
                <div className="mono" style={{ fontSize: 13, color: dt.added ? "var(--ok)" : "var(--text-mute)", fontWeight: 700 }}>{dt.added}</div>
                <div className="mono" style={{ fontSize: 13, color: dt.moved ? "var(--info)" : "var(--text-mute)", fontWeight: 700 }}>{dt.moved}</div>
                <div className="mono" style={{ fontSize: 13, color: dt.conflicts ? "var(--crit)" : "var(--text-mute)", fontWeight: 700 }}>{dt.conflicts}</div>
                <div style={{ textAlign: "right" }}><button onClick={() => nav("fixture")} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--text-mute)", display: "inline-grid", placeItems: "center", cursor: "pointer" }}><Icon name="chevright" size={14} /></button></div>
              </div>
            ))}
          </TableScroll>
        </Card>
      </div>

      {/* Distinction note */}
      <div style={{ display: "flex", gap: 11, padding: "13px 16px", borderRadius: "var(--radius)", background: "var(--surface-2)", border: "1px solid var(--line)", marginTop: 16 }}>
        <Icon name="zap" size={18} style={{ color: "var(--accent)", flex: "0 0 auto", marginTop: 1 }} />
        <div style={{ fontSize: 12.5, color: "var(--text-soft)", lineHeight: 1.5 }}>
          El <strong>simulador</strong> es una vista previa rápida. El <strong>Dry Run</strong> es la propuesta antes/después autoritativa requerida antes de confirmar cualquier cambio.
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <Btn variant="subtle" icon="x">Descartar cambio</Btn>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" icon="chevleft" onClick={() => nav("context")}>Volver a contexto</Btn>
        <Btn variant="primary" icon="zap" onClick={() => nav("dryrun")}>Generar Dry Run completo</Btn>
      </div>
    </div>
  );
}

Object.assign(window, { ContextHistoryScreen, ContextCompareScreen, ContextImpactScreen });

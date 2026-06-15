/* fixtureOS — Screen: Context Dashboard (/context) */

function CtxStatCard({ scope, count, label, tone, onClick, icon }) {
  return (
    <button onClick={onClick} style={{ flex: "1 1 150px", minWidth: 0, textAlign: "left", padding: "15px 16px", borderRadius: "var(--radius)", border: "1px solid var(--line)", background: "var(--surface)", boxShadow: "var(--shadow-sm)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: `color-mix(in srgb, ${tone} 13%, transparent)`, color: tone, display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={icon} size={15} sw={2.1} /></span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 11 }}>
        <span className="mono tnum" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, color: "var(--text)" }}>{count}</span>
        <span style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 600 }}>activas</span>
      </div>
    </button>
  );
}

function ContextDashboardScreen() {
  const { nav } = useNav();
  const { narrow } = useViewport();
  const totalConflicts = CTX_LAYERS.reduce((a, l) => a + l.conflicts, 0);

  return (
    <div className="screen-pad" style={{ maxWidth: 1380, margin: "0 auto" }}>
      <PageHeader
        eyebrow="Copa Apertura 2026"
        title="Centro de Contexto"
        sub="Las reglas legibles que controlan cómo se genera el fixture · cada cambio crea una versión."
        right={<>
          <Btn variant="ghost" icon="history" onClick={() => nav("ctxhistory")}>Historial</Btn>
          <Btn variant="primary" icon="target" onClick={() => nav("ctximpact")}>Simular impacto</Btn>
        </>}
      />

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {CTX_LAYERS.map((l) => {
          const s = CTX_SCOPES[l.scope];
          return <CtxStatCard key={l.scope} scope={l.scope} count={l.rules} label={`Reglas · ${s.label}`} tone={s.tone} icon={s.icon} onClick={() => nav(s.screen)} />;
        })}
        <button onClick={() => nav("ctximpact")} style={{ flex: "1 1 150px", minWidth: 0, textAlign: "left", padding: "15px 16px", borderRadius: "var(--radius)", border: "1px solid var(--warn-line)", background: "var(--warn-bg)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "color-mix(in srgb, var(--warn) 16%, transparent)", color: "var(--warn)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name="target" size={15} sw={2.1} /></span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--warn)" }}>Impactos por revisar</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 11 }}>
            <span className="mono tnum" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, color: "var(--warn)" }}>2</span>
            <span style={{ fontSize: 12, color: "var(--text-soft)", fontWeight: 600 }}>pendientes</span>
          </div>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "minmax(0,1fr) 340px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Active rule layers */}
          <Card>
            <CardHead title="Capas de reglas activas" sub="Cada capa sobrescribe a la de menor prioridad" icon="sliders" />
            <TableScroll minWidth={620}>
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 110px 1.2fr 110px 90px", padding: "10px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
                <div>Ámbito</div><div>Reglas</div><div>Actualizado</div><div>Conflictos</div><div style={{ textAlign: "right" }}>Acción</div>
              </div>
              {CTX_LAYERS.map((l, i) => {
                const s = CTX_SCOPES[l.scope];
                return (
                  <div key={l.scope} style={{ display: "grid", gridTemplateColumns: "1.3fr 110px 1.2fr 110px 90px", alignItems: "center", padding: "13px 18px", borderBottom: i < CTX_LAYERS.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <div><CtxScopeBadge scope={l.scope} /></div>
                    <div className="mono" style={{ fontWeight: 700, fontSize: 14 }}>{l.rules}</div>
                    <div className="mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>{l.updated}</div>
                    <div>{l.conflicts ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--crit)" }}><Icon name="alert" size={13} sw={2.2} />{l.conflicts}</span> : <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--ok)" }}><Icon name="checkcircle" size={13} sw={2.2} />0</span>}</div>
                    <div style={{ textAlign: "right" }}><Btn variant="subtle" size="sm" iconR="chevright" onClick={() => nav(s.screen)}>Abrir</Btn></div>
                  </div>
                );
              })}
            </TableScroll>
          </Card>

          {/* Recent changes */}
          <Card>
            <CardHead title="Cambios recientes de contexto" icon="history" right={<span onClick={() => nav("ctxhistory")} style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", cursor: "pointer" }}>Ver historial</span>} />
            <TableScroll minWidth={620}>
              <div style={{ display: "grid", gridTemplateColumns: "130px 110px 1fr 1.4fr 80px", padding: "10px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
                <div>Fecha</div><div>Usuario</div><div>Ámbito</div><div>Resumen</div><div style={{ textAlign: "right" }}>Versión</div>
              </div>
              {CTX_RECENT.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 110px 1fr 1.4fr 80px", alignItems: "center", padding: "12px 18px", borderBottom: i < CTX_RECENT.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <div className="mono" style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 600 }}>{r.date}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{r.user}</div>
                  <div><CtxScopeBadge scope={r.scope} size="sm" /></div>
                  <div style={{ fontSize: 12.5, color: "var(--text-soft)" }}>{r.summary}</div>
                  <div style={{ textAlign: "right" }}><span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{r.ver}</span></div>
                </div>
              ))}
            </TableScroll>
          </Card>
        </div>

        {/* Right rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Missing config */}
          <Card style={{ padding: 16, background: "var(--warn-bg)", border: "1px solid var(--warn-line)" }}>
            <div style={{ display: "flex", gap: 11 }}>
              <Icon name="alert" size={19} style={{ color: "var(--warn)", flex: "0 0 auto", marginTop: 1 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--warn)" }}>Contexto de categoría incompleto</div>
                <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginTop: 4, lineHeight: 1.5 }}><strong>Senior</strong> no tiene fecha de inicio ni modo de juego. No se incluirá en el fixture hasta completarse.</div>
                <div style={{ marginTop: 11 }}><Btn variant="ghost" size="sm" icon="layers" onClick={() => nav("ctxcategory")}>Completar contexto</Btn></div>
              </div>
            </div>
          </Card>

          {/* Conflicts */}
          <Card>
            <CardHead title="Reglas en conflicto" icon="alert" right={<span style={{ fontSize: 12, fontWeight: 800, color: "var(--crit)" }} className="mono">{totalConflicts}</span>} />
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              {[["category", "U16: duración 75 min vs torneo 60 min", "ctxcategory"], ["tournament", "Cancha Sur cerrada vs partido U18 programado", "ctxtournament"], ["category", "Senior prioridad 100 vs prioridad menores", "ctxcategory"]].map(([sc, txt, to], i) => (
                <button key={i} onClick={() => nav(to)} style={{ display: "flex", gap: 10, padding: "10px 11px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line)", borderLeft: "3px solid var(--crit)", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)", width: "100%", color: "var(--text)", alignItems: "center" }}>
                  <Icon name="alert" size={15} style={{ color: "var(--crit)", flex: "0 0 auto" }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--text-soft)", lineHeight: 1.4 }}>{txt}</div>
                  </div>
                  <Icon name="chevright" size={14} style={{ color: "var(--text-mute)", flex: "0 0 auto" }} />
                </button>
              ))}
            </div>
          </Card>

          {/* Constraint hierarchy */}
          <Card style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 13 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name="layers" size={15} /></span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>Jerarquía de restricciones</div>
                <div style={{ fontSize: 11.5, color: "var(--text-mute)" }}>Qué regla gana en conflictos</div>
              </div>
            </div>
            <ConstraintHierarchy />
          </Card>
        </div>
      </div>
    </div>
  );
}

window.ContextDashboardScreen = ContextDashboardScreen;

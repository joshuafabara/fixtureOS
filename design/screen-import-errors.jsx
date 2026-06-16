/* fixtureOS — Screen: Import Error Resolution (/imports/:id/errors) */

function IssueIcon({ type, active }) {
  const e = IMP_ERROR_TYPE[type] || IMP_ERROR_TYPE.duplicate;
  return (
    <span style={{ width: 30, height: 30, borderRadius: 8, flex: "0 0 auto", display: "grid", placeItems: "center",
      background: active ? e.tone : `color-mix(in srgb, ${e.tone} 13%, transparent)`, color: active ? "#fff" : e.tone }}>
      <Icon name={e.ic} size={15} sw={2.1} />
    </span>
  );
}

function ImportErrorsScreen() {
  const { nav } = useNav();
  const { narrow } = useViewport();
  const [sel, setSel] = React.useState(0);
  const [choice, setChoice] = React.useState(() => Object.fromEntries(IMP_ERRORS.map((e) => [e.id, e.def])));
  const [resolved, setResolved] = React.useState({});
  const issue = IMP_ERRORS[sel];
  const et = IMP_ERROR_TYPE[issue.type];
  const doneCount = Object.values(resolved).filter(Boolean).length;

  const saveNext = () => {
    setResolved((r) => ({ ...r, [issue.id]: true }));
    if (sel < IMP_ERRORS.length - 1) setSel(sel + 1);
  };

  return (
    <div className="screen-pad" style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 110 }}>
      <PageHeader eyebrow="Importación · resolución de problemas"
        title="Resolver Problemas"
        sub="Revisa cada fila ambigua o inválida y elige cómo resolverla. Nada se aplica hasta confirmar la importación."
        right={<Btn variant="ghost" icon="chevleft" onClick={() => nav("importdiff")}>Volver a cambios</Btn>} />

      {/* progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderRadius: "var(--radius)", marginBottom: 16,
        background: doneCount === IMP_ERRORS.length ? "var(--ok-bg)" : "var(--warn-bg)", border: `1px solid ${doneCount === IMP_ERRORS.length ? "var(--ok-line)" : "var(--warn-line)"}` }}>
        <Icon name={doneCount === IMP_ERRORS.length ? "checkcircle" : "alert"} size={19} style={{ color: doneCount === IMP_ERRORS.length ? "var(--ok)" : "var(--warn)", flex: "0 0 auto" }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{doneCount} de {IMP_ERRORS.length} problemas resueltos</div>
        <div style={{ flex: 1, maxWidth: 320, height: 7, borderRadius: 99, background: "var(--ink-100)", overflow: "hidden" }}>
          <div style={{ width: `${(doneCount / IMP_ERRORS.length) * 100}%`, height: "100%", background: doneCount === IMP_ERRORS.length ? "var(--ok)" : "var(--warn)", borderRadius: 99, transition: "width .2s" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "320px minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        {/* Issue list */}
        <Card style={{ overflow: "hidden" }}>
          <CardHead title="Problemas" sub={`${IMP_ERRORS.length} en total`} icon="list" />
          <div style={{ maxHeight: narrow ? "none" : 560, overflowY: "auto" }}>
            {IMP_ERRORS.map((e, i) => {
              const on = i === sel;
              const ok = resolved[e.id];
              return (
                <button key={e.id} onClick={() => setSel(i)} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "12px 15px", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-sans)",
                  border: "none", borderBottom: i < IMP_ERRORS.length - 1 ? "1px solid var(--line)" : "none", borderLeft: `3px solid ${on ? IMP_ERROR_TYPE[e.type].tone : "transparent"}`,
                  background: on ? "var(--accent-soft)" : "transparent" }}>
                  <IssueIcon type={e.type} active={on} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontWeight: 700, fontSize: 12.5, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{IMP_ERROR_TYPE[e.type].label}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--text-mute)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Fila {e.row} · {e.fields.Equipo || e.fields.Categoría}</span>
                  </span>
                  {ok
                    ? <Icon name="checkcircle" size={17} style={{ color: "var(--ok)", flex: "0 0 auto" }} sw={2.1} />
                    : <span style={{ width: 8, height: 8, borderRadius: 99, background: IMP_ERROR_TYPE[e.type].tone, flex: "0 0 auto" }} />}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected issue */}
        <Card>
          <CardHead title={issue.title} icon={et.ic}
            right={resolved[issue.id] ? <SevTag sev="info" size="sm">Resuelto</SevTag> : <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 800, color: et.tone, padding: "3px 9px", borderRadius: 99, background: `color-mix(in srgb, ${et.tone} 13%, transparent)` }}><Icon name={et.ic} size={12} sw={2.3} />{et.label}</span>} />
          <div style={{ padding: 18 }}>
            {/* imported row */}
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", marginBottom: 9 }}>Fila importada · {issue.row}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "13px 15px", borderRadius: "var(--radius)", background: "var(--surface-2)", border: "1px solid var(--line)", marginBottom: 8 }}>
              {Object.entries(issue.fields).map(([k, v]) => (
                <div key={k} style={{ minWidth: 90 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: .4 }}>{k}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 3, color: v === "—" || v.includes("?") ? "var(--warn)" : "var(--text)" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "0 2px 18px" }}>
              <Icon name="message" size={15} style={{ color: "var(--text-mute)", flex: "0 0 auto", marginTop: 2 }} />
              <div style={{ fontSize: 12.5, color: "var(--text-soft)", lineHeight: 1.5 }}>{issue.detail}</div>
            </div>

            {/* resolution options */}
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", marginBottom: 10 }}>Resolución sugerida</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {issue.options.map((opt, i) => {
                const on = choice[issue.id] === i;
                return (
                  <button key={i} onClick={() => setChoice((c) => ({ ...c, [issue.id]: i }))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--radius)", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-sans)",
                    border: `1px solid ${on ? "var(--accent)" : "var(--line-strong)"}`, background: on ? "var(--accent-soft)" : "var(--surface)", boxShadow: on ? "0 0 0 3px var(--accent-soft)" : "none" }}>
                    <span style={{ width: 20, height: 20, borderRadius: 99, border: `2px solid ${on ? "var(--accent)" : "var(--line-strong)"}`, display: "grid", placeItems: "center", flex: "0 0 auto" }}>{on && <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--accent)" }} />}</span>
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: on ? "var(--accent-strong)" : "var(--text)" }}>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <Btn variant="ghost" icon="chevleft" onClick={() => setSel(Math.max(0, sel - 1))} style={sel === 0 ? { opacity: .5, cursor: "not-allowed" } : {}}>Anterior</Btn>
              <div style={{ flex: 1 }} />
              <Btn variant="ok" icon="check" onClick={saveNext}>{sel < IMP_ERRORS.length - 1 ? "Guardar y siguiente" : "Guardar resolución"}</Btn>
            </div>
          </div>
        </Card>
      </div>

      {/* sticky footer */}
      <div style={{ position: "fixed", left: "var(--sidebar-w, 234px)", right: 0, bottom: 0, background: "var(--surface)", borderTop: "1px solid var(--line)", padding: "14px 32px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 -6px 24px rgba(15,23,42,.06)", zIndex: 10, flexWrap: "wrap", transition: "left .18s ease" }}>
        <Btn variant="ghost" icon="chevleft" onClick={() => nav("importdiff")}>Volver a cambios</Btn>
        <div style={{ flex: 1 }} />
        <Btn variant={doneCount === IMP_ERRORS.length ? "primary" : "subtle"} icon="check" onClick={() => nav("importdiff")}
          style={doneCount === IMP_ERRORS.length ? {} : { opacity: .6, cursor: "not-allowed", boxShadow: "none" }}>
          Aplicar resoluciones
        </Btn>
      </div>
    </div>
  );
}

window.ImportErrorsScreen = ImportErrorsScreen;

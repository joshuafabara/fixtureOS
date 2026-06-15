/* fixtureOS — Screen: Dry Run Review (diff approval) */

function SummaryCard({ ic, n, label, tone, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: "1 1 110px", minWidth: 0, textAlign: "left", padding: "14px 16px", borderRadius: "var(--radius)", cursor: "pointer", fontFamily: "var(--font-sans)",
      background: "var(--surface)", border: `1px solid ${active ? tone : "var(--line)"}`, boxShadow: active ? `0 0 0 3px color-mix(in srgb, ${tone} 14%, transparent)` : "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone }}><Icon name={ic} size={15} sw={2.2} /></div>
        <span className="mono tnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, color: tone }}>{n}</span>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8, color: "var(--text-soft)" }}>{label}</div>
    </button>
  );
}

function DiffCard({ row, accepted, onAccept }) {
  const { nav } = useNav();
  const T = DIFF_TYPE[row.type];
  const isConflict = row.type === "conflict";
  const resolved = isConflict && accepted;
  return (
    <div style={{ border: `1px solid ${isConflict && !resolved ? "var(--crit-line)" : "var(--line)"}`, borderRadius: "var(--radius)", background: isConflict && !resolved ? "var(--crit-bg)" : "var(--surface)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: T.bg, color: T.t, border: `1px solid ${T.ln}`, fontSize: 11.5, fontWeight: 800 }}>
          <Icon name={T.ic} size={12} sw={2.4} />{T.label}
        </span>
        <CatBadge cat={row.cat} size="sm" />
        <span style={{ fontWeight: 700, fontSize: 14 }}>{row.match}</span>
        <div style={{ marginLeft: "auto" }}>
          {resolved ? <SevTag sev="info">Aceptado</SevTag> : <SevTag sev={row.sev} />}
        </div>
      </div>
      <div className="diff-ba" style={{ display: "flex", alignItems: "stretch", gap: 0, padding: "14px 16px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: .7, color: "var(--text-mute)", marginBottom: 6 }}>Antes</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-soft)", padding: "9px 12px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 9, minHeight: 38, display: "flex", alignItems: "center" }}>{row.before.txt}</div>
        </div>
        <div className="diff-arrow" style={{ display: "grid", placeItems: "center", padding: "0 14px", alignSelf: "center" }}>
          <div style={{ width: 30, height: 30, borderRadius: 99, background: T.bg, color: T.t, display: "grid", placeItems: "center" }}><Icon name="arrowright" size={16} sw={2.2} /></div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: .7, color: T.t, marginBottom: 6 }}>Después</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", padding: "9px 12px", background: T.bg, border: `1px solid ${T.ln}`, borderRadius: 9, minHeight: 38, display: "flex", alignItems: "center" }}>{row.after.txt}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 14px", flexWrap: "wrap" }}>
        <Icon name={row.sev === "crit" ? "alert" : "message"} size={15} style={{ color: row.sev === "crit" ? "var(--crit)" : "var(--text-mute)", flex: "0 0 auto" }} />
        <div style={{ fontSize: 12.5, color: "var(--text-soft)", lineHeight: 1.45, flex: "1 1 200px", minWidth: 0 }}>{row.note}</div>
        {isConflict && !resolved && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flex: "0 0 auto" }}>
            <Btn variant="ghost" size="sm" icon="edit" onClick={() => nav("manualedit")}>Resolver</Btn>
            <Btn variant="danger" size="sm" icon="check" onClick={onAccept}>Aceptar conflicto</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function DryRunScreen() {
  const { nav } = useNav();
  const { isMobile } = useViewport();
  const [filter, setFilter] = React.useState("all");
  const [accepted, setAccepted] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const s = DRYRUN.summary;
  const conflictsOpen = s.conflicts > 0 && !accepted;
  const rows = DRYRUN.rows.filter((r) => filter === "all" || r.type === filter || (filter === "warnings" && r.sev === "warn"));

  if (done) {
    return (
      <div className="screen-pad" style={{ maxWidth: 720, margin: "0 auto", paddingTop: 60 }}>
        <Card style={{ padding: 44, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--ok-bg)", color: "var(--ok)", display: "grid", placeItems: "center", margin: "0 auto 18px" }}><Icon name="checkcircle" size={32} sw={2} /></div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -.5 }}>Versión V5 creada</h2>
          <p style={{ color: "var(--text-soft)", fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>Se aplicaron 9 cambios y se creó una nueva versión inmutable. Las versiones anteriores se conservan en el historial.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 22 }}>
            <Btn variant="primary" icon="eye" onClick={() => nav("fixture")}>Ver fixture V5</Btn>
            <Btn variant="ghost" icon="gitcompare" onClick={() => nav("compare")}>Comparar V4 → V5</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="screen-pad" style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 120 }}>
      <PageHeader
        eyebrow="Dry Run · generado hoy 14:18"
        title="Revisión de cambios"
        sub={<span>Base <span className="mono" style={{ fontWeight: 700, color: "var(--text)" }}>V4</span> → candidata <span className="mono" style={{ fontWeight: 700, color: "var(--accent)" }}>V5</span> · motivo: equipo retirado (Dragones)</span>}
        right={<Btn variant="ghost" icon="refresh">Regenerar</Btn>}
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <SummaryCard ic="plus" n={s.added} label="Añadidos" tone="var(--ok)" active={filter === "added"} onClick={() => setFilter(filter === "added" ? "all" : "added")} />
        <SummaryCard ic="swap" n={s.moved} label="Movidos" tone="var(--info)" active={filter === "moved"} onClick={() => setFilter(filter === "moved" ? "all" : "moved")} />
        <SummaryCard ic="flag" n={s.forfeit} label="Forfeits" tone="var(--warn)" active={filter === "forfeit"} onClick={() => setFilter(filter === "forfeit" ? "all" : "forfeit")} />
        <SummaryCard ic="x" n={s.removed} label="Eliminados" tone="var(--text-mute)" active={filter === "removed"} onClick={() => setFilter(filter === "removed" ? "all" : "removed")} />
        <SummaryCard ic="alert" n={s.conflicts} label="Conflictos" tone="var(--crit)" active={filter === "conflict"} onClick={() => setFilter(filter === "conflict" ? "all" : "conflict")} />
      </div>

      {/* gate banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: "var(--radius)", marginBottom: 16,
        background: conflictsOpen ? "var(--crit-bg)" : "var(--ok-bg)", border: `1px solid ${conflictsOpen ? "var(--crit-line)" : "var(--ok-line)"}` }}>
        <Icon name={conflictsOpen ? "lock" : "checkcircle"} size={20} style={{ color: conflictsOpen ? "var(--crit)" : "var(--ok)", flex: "0 0 auto" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: conflictsOpen ? "var(--crit)" : "var(--ok)" }}>
            {conflictsOpen ? "Aprobación bloqueada · 1 conflicto crítico sin resolver" : "Listo para aprobar · sin conflictos abiertos"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginTop: 2 }}>
            {conflictsOpen ? "Resolvé el solapamiento de cancha en edición manual o aceptá el conflicto explícitamente." : "Las advertencias quedan registradas. Los partidos bloqueados y overrides manuales se conservan."}
          </div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-mute)", fontWeight: 700 }}><Icon name="lock" size={13} /> {s.warnings} advertencias · overrides preservados</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r, i) => <DiffCard key={i} row={r} accepted={accepted} onAccept={() => setAccepted(true)} />)}
      </div>

      {/* sticky footer */}
      <div style={{ position: "fixed", left: isMobile ? 0 : "var(--sidebar-w, 234px)", right: 0, bottom: 0, background: "var(--surface)", borderTop: "1px solid var(--line)", padding: isMobile ? "12px 16px" : "14px 32px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 -6px 24px rgba(15,23,42,.06)", zIndex: 10, flexWrap: "wrap", transition: "left .18s ease" }}>
        <div className="hide-mobile" style={{ fontSize: 13, color: "var(--text-soft)" }}>
          <strong style={{ color: "var(--text)" }}>{DRYRUN.rows.length} cambios</strong> en esta revisión · {conflictsOpen ? <span style={{ color: "var(--crit)", fontWeight: 700 }}>1 conflicto sin resolver</span> : <span style={{ color: "var(--ok)", fontWeight: 700 }}>conflictos resueltos</span>}
        </div>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" icon="x" onClick={() => nav("fixture")}>Rechazar</Btn>
        <Btn variant={conflictsOpen ? "subtle" : "primary"} icon="check" onClick={() => !conflictsOpen && setDone(true)}
          style={conflictsOpen ? { opacity: .55, cursor: "not-allowed", boxShadow: "none" } : {}}>Aprobar y crear versión</Btn>
      </div>
    </div>
  );
}

window.DryRunScreen = DryRunScreen;

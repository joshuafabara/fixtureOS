/* fixtureOS — Screen: Import Diff Review (/imports/:id/diff) · Step 3 · CENTERPIECE */

function ImpSummaryCard({ ic, n, label, tone, active, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: "1 1 130px", minWidth: 0, textAlign: "left", padding: "14px 16px", borderRadius: "var(--radius)", cursor: "pointer", fontFamily: "var(--font-sans)",
      background: "var(--surface)", border: `1px solid ${active ? tone : "var(--line)"}`, boxShadow: active ? `0 0 0 3px color-mix(in srgb, ${tone} 14%, transparent)` : "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone }}><Icon name={ic} size={15} sw={2.2} /></div>
        <span className="mono tnum" style={{ fontSize: 25, fontWeight: 700, letterSpacing: -1, color: tone }}>{n}</span>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8, color: "var(--text-soft)" }}>{label}</div>
    </button>
  );
}

function DiffDecision({ row, value, onChange }) {
  // destructive-ish decisions get a warning tint when chosen
  const danger = ["Equipo Retirado", "Marcar removido"];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {row.decisions.map((d, i) => {
        const on = value === i;
        const isDanger = danger.includes(d);
        return (
          <button key={d} onClick={() => onChange(i)} style={{ padding: "6px 11px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)",
            border: `1px solid ${on ? (isDanger ? "var(--warn-line)" : "var(--accent)") : "var(--line-strong)"}`,
            background: on ? (isDanger ? "var(--warn-bg)" : "var(--accent-soft)") : "var(--surface)",
            color: on ? (isDanger ? "var(--warn)" : "var(--accent-strong)") : "var(--text-soft)",
            display: "inline-flex", alignItems: "center", gap: 5 }}>
            {on && <Icon name="check" size={12} sw={2.5} />}{d}
          </button>
        );
      })}
    </div>
  );
}

function DiffRow({ row, value, onChange }) {
  const { nav } = useNav();
  const T = IMP_DIFF_TYPE[row.type];
  const warn = row.sev === "warn";
  return (
    <div style={{ border: `1px solid ${warn ? "var(--warn-line)" : "var(--line)"}`, borderRadius: "var(--radius)", background: warn ? "color-mix(in srgb, var(--warn-bg) 35%, var(--surface))" : "var(--surface)", overflow: "hidden" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
        <ImpDiffBadge type={row.type} />
        {row.cat && <span title="Color de categoría" style={{ width: 11, height: 11, borderRadius: 99, background: (CAT_VARS[row.cat] || CAT_VARS.azul).dot, flex: "0 0 auto", boxShadow: "0 0 0 3px color-mix(in srgb, " + (CAT_VARS[row.cat] || CAT_VARS.azul).dot + " 18%, transparent)" }} />}
        <span style={{ fontWeight: 800, fontSize: 14 }}>{row.entity}</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {row.impact && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "var(--info)", padding: "3px 9px", borderRadius: 99, background: "var(--info-bg)", border: "1px solid var(--info-bg2)" }}><Icon name="zap" size={12} sw={2.3} />Afecta fixture</span>}
          {row.needsError && <SevTag sev="warn" size="sm">Requiere resolución</SevTag>}
        </div>
      </div>
      {/* current → imported */}
      <div className="diff-ba" style={{ display: "flex", alignItems: "stretch", padding: "13px 16px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: .7, color: "var(--text-mute)", marginBottom: 6 }}>Valor actual</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-soft)", padding: "9px 12px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 9, minHeight: 38, display: "flex", alignItems: "center" }}>{row.current}</div>
        </div>
        <div className="diff-arrow" style={{ display: "grid", placeItems: "center", padding: "0 14px", alignSelf: "center" }}>
          <div style={{ width: 30, height: 30, borderRadius: 99, background: T.bg, color: T.t, display: "grid", placeItems: "center" }}><Icon name="arrowright" size={16} sw={2.2} /></div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: .7, color: T.t, marginBottom: 6 }}>Valor importado</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", padding: "9px 12px", background: T.bg, border: `1px solid ${T.ln}`, borderRadius: 9, minHeight: 38, display: "flex", alignItems: "center" }}>{row.imported}</div>
        </div>
      </div>
      {/* note + decision */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px 14px", flexWrap: "wrap" }}>
        {row.note && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 240px", minWidth: 0 }}>
            <Icon name={warn ? "alert" : "message"} size={15} style={{ color: warn ? "var(--warn)" : "var(--text-mute)", flex: "0 0 auto" }} />
            <span style={{ fontSize: 12.5, color: "var(--text-soft)", lineHeight: 1.45 }}>{row.note}</span>
          </div>
        )}
        <div style={{ marginLeft: row.note ? "auto" : 0, display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .5, color: "var(--text-mute)" }}>Decisión</span>
          {row.needsError
            ? <Btn variant="ghost" size="sm" icon="target" onClick={() => nav("importerrors")}>Resolver</Btn>
            : <DiffDecision row={row} value={value} onChange={onChange} />}
        </div>
      </div>
    </div>
  );
}

function ImportDiffScreen() {
  const { nav } = useNav();
  const { isMobile } = useViewport();
  const ctx = window.IMPORT_CTX || { mode: "update", source: "excel", target: "Copa Apertura 2026" };
  const s = IMP_DIFF_SUMMARY;
  const [filter, setFilter] = React.useState("all");
  // per-row decision index (default 0 = safe)
  const [dec, setDec] = React.useState(() => Object.fromEntries(IMP_DIFF.map((r) => [r.id, 0])));
  const setRow = (id, v) => setDec((d) => ({ ...d, [id]: v }));

  const groups = { new: ["newclub", "newcat", "newteam"], update: ["rename", "color", "moved"], warn: ["retired", "missing", "duplicate", "ambiguous"] };
  const rows = IMP_DIFF.filter((r) => filter === "all" || (groups[filter] ? groups[filter].includes(r.type) : r.type === filter));
  const unresolved = IMP_DIFF.filter((r) => r.needsError).length;

  return (
    <div className="screen-pad" style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 120 }}>
      <PageHeader
        eyebrow={`Importación · ${ctx.source.toUpperCase()} · ${ctx.mode === "update" ? "actualización" : "creación"}`}
        title="Revisión de Cambios"
        sub={<span>{ctx.mode === "update" ? <>Comparando <span className="mono" style={{ fontWeight: 700, color: "var(--text)" }}>inscripciones_v2.xlsx</span> contra <span className="mono" style={{ fontWeight: 700, color: "var(--accent)" }}>{ctx.target}</span></> : "Datos detectados para el torneo nuevo"}</span>}
        right={<Btn variant="ghost" icon="chevleft" onClick={() => nav("mapping")}>Volver al mapeo</Btn>}
      />

      <WizardSteps current={2} onJump={(i) => nav(i === 0 ? "import" : "mapping")} />

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 11, marginBottom: 16, flexWrap: "wrap" }}>
        <ImpSummaryCard ic="building" n={s.newclubs} label="Clubes Nuevos"     tone="var(--ok)"        active={filter === "newclub"} onClick={() => setFilter(filter === "newclub" ? "all" : "newclub")} />
        <ImpSummaryCard ic="layers"   n={s.newcats}  label="Categorías Nuevas" tone="var(--ok)"        active={filter === "newcat"}  onClick={() => setFilter(filter === "newcat" ? "all" : "newcat")} />
        <ImpSummaryCard ic="plus"     n={s.newteams} label="Equipos Nuevos"    tone="var(--ok)"        active={filter === "newteam"} onClick={() => setFilter(filter === "newteam" ? "all" : "newteam")} />
        <ImpSummaryCard ic="swap"     n={s.updates}  label="Actualizaciones"   tone="var(--info)"      active={filter === "update"}  onClick={() => setFilter(filter === "update" ? "all" : "update")} />
        <ImpSummaryCard ic="alert"    n={s.warnings} label="Advertencias"      tone="var(--warn)"      active={filter === "warn"}    onClick={() => setFilter(filter === "warn" ? "all" : "warn")} />
        <ImpSummaryCard ic="zap"      n={s.impacts}  label="Impactos fixture"  tone="var(--accent)"    active={filter === "impact"}  onClick={() => setFilter("all")} />
      </div>

      {/* Safety banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: "var(--radius)", marginBottom: 16, background: "var(--info-bg)", border: "1px solid var(--info-bg2)" }}>
        <Icon name="lock" size={20} style={{ color: "var(--info)", flex: "0 0 auto" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: "var(--info)" }}>Los datos existentes nunca se eliminan automáticamente</div>
          <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginTop: 2 }}>Lo que falta en el archivo se marca como advertencia, no se borra. Las categorías nuevas quedan inactivas hasta tener fecha y modo de juego.</div>
        </div>
        {filter !== "all" && <Btn variant="subtle" size="sm" icon="x" onClick={() => setFilter("all")}>Quitar filtro</Btn>}
      </div>

      {/* Diff rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r) => <DiffRow key={r.id} row={r} value={dec[r.id]} onChange={(v) => setRow(r.id, v)} />)}
      </div>

      {/* sticky footer */}
      <div style={{ position: "fixed", left: isMobile ? 0 : "var(--sidebar-w, 234px)", right: 0, bottom: 0, background: "var(--surface)", borderTop: "1px solid var(--line)", padding: isMobile ? "12px 16px" : "14px 32px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 -6px 24px rgba(15,23,42,.06)", zIndex: 10, flexWrap: "wrap", transition: "left .18s ease" }}>
        <div className="hide-mobile" style={{ fontSize: 13, color: "var(--text-soft)" }}>
          <strong style={{ color: "var(--text)" }}>{IMP_DIFF.length} cambios</strong> · {unresolved > 0 ? <span style={{ color: "var(--warn)", fontWeight: 700 }}>{unresolved} requieren resolución</span> : <span style={{ color: "var(--ok)", fontWeight: 700 }}>sin pendientes</span>}
        </div>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" icon="x" onClick={() => nav("tournament")}>Cancelar</Btn>
        <Btn variant="ghost" icon="alert" onClick={() => nav("importerrors")}>Resolver Advertencias{unresolved > 0 ? ` · ${unresolved}` : ""}</Btn>
        <Btn variant="primary" icon="check" onClick={() => nav("setup")}>Confirmar Importación</Btn>
      </div>
    </div>
  );
}

window.ImportDiffScreen = ImportDiffScreen;

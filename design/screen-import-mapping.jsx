/* fixtureOS — Screen: Import Mapping Review (/imports/:id/mapping) · Step 2 */

function FlagTag({ flag }) {
  const map = {
    new:        { t: "var(--ok)",   bg: "var(--ok-bg)",   ln: "var(--ok-line)",   lb: "Nuevo",     ic: "plus" },
    dup:        { t: "var(--warn)", bg: "var(--warn-bg)", ln: "var(--warn-line)", lb: "Duplicado", ic: "layers" },
    missingclub:{ t: "var(--warn)", bg: "var(--warn-bg)", ln: "var(--warn-line)", lb: "Sin club",  ic: "alert" },
    ambiguous:  { t: "var(--warn)", bg: "var(--warn-bg)", ln: "var(--warn-line)", lb: "Ambiguo",   ic: "target" },
    lowconf:    { t: "var(--warn)", bg: "var(--warn-bg)", ln: "var(--warn-line)", lb: "Revisar",   ic: "eye" },
    review:     { t: "var(--warn)", bg: "var(--warn-bg)", ln: "var(--warn-line)", lb: "Revisar",   ic: "eye" },
  };
  const f = map[flag];
  if (!f) return <SevTag sev="info" size="sm">OK</SevTag>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 99, background: f.bg, color: f.t, border: `1px solid ${f.ln}`, fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>
      <Icon name={f.ic} size={11} sw={2.4} />{f.lb}
    </span>
  );
}

function ImportMappingScreen() {
  const { nav } = useNav();
  const ctx = window.IMPORT_CTX || { mode: "update", source: "excel", target: "Copa Apertura 2026" };
  const isImage = ctx.source === "image";
  const [cols, setCols] = React.useState(MAP_COLUMNS);
  const setTarget = (i, v) => setCols((cs) => cs.map((c, j) => j === i ? { ...c, target: v } : c));
  const issues = MAP_VALIDATION.filter((v) => !v.ok).length;

  return (
    <div className="screen-pad" style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 110 }}>
      <PageHeader eyebrow={`Importación · ${ctx.source.toUpperCase()} · ${ctx.mode === "update" ? ctx.target : "Torneo nuevo"}`}
        title={isImage ? "Revisar Extracción de Imagen" : "Revisar Mapeo"}
        sub={isImage ? "Confirma los datos extraídos y su nivel de confianza antes de importar." : "Confirma cómo se asignan las columnas del archivo a los campos de FixtureOS."}
        right={<Btn variant="ghost" icon="refresh">{isImage ? "Reintentar extracción" : "Recargar archivo"}</Btn>} />

      <WizardSteps current={1} onJump={() => nav("import")} />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 16 }}>
        {!isImage && (
          <Card>
            <CardHead title="Columnas detectadas" icon="list" sub="6 columnas en el archivo" />
            <TableScroll minWidth={680}>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1.1fr 1.3fr 1.4fr", padding: "10px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
                <div>Col</div><div>Detectada</div><div>Ejemplo</div><div>Campo FixtureOS</div>
              </div>
              {cols.map((c, i) => (
                <div key={c.col} style={{ display: "grid", gridTemplateColumns: "60px 1.1fr 1.3fr 1.4fr", alignItems: "center", padding: "11px 18px", borderBottom: i < cols.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <div className="mono" style={{ fontWeight: 800, fontSize: 13, color: "var(--accent)" }}>{c.col}</div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.detected}</div>
                  <div className="mono" style={{ fontSize: 12.5, color: "var(--text-mute)" }}>{c.sample}</div>
                  <div style={{ position: "relative", maxWidth: 240 }}>
                    <select value={c.target} onChange={(e) => setTarget(i, e.target.value)} style={{ width: "100%", appearance: "none", WebkitAppearance: "none", padding: "8px 30px 8px 11px", borderRadius: 8,
                      border: `1px solid ${c.target === "ignore" ? "var(--line)" : "var(--accent-soft-2)"}`, background: c.target === "ignore" ? "var(--ink-100)" : "var(--accent-soft)",
                      color: c.target === "ignore" ? "var(--text-mute)" : "var(--accent-strong)", fontWeight: 700, fontSize: 12.5, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                      {MAP_TARGETS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <Icon name="chevdown" size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
                  </div>
                </div>
              ))}
            </TableScroll>
          </Card>
        )}

        {/* Preview */}
        <Card>
          <CardHead title={isImage ? "Datos extraídos" : "Filas de previsualización"} icon="eye"
            sub={isImage ? "Confianza por fila · revisa las marcadas" : "Primeras filas tras aplicar el mapeo"}
            right={<span style={{ fontSize: 12, color: "var(--text-mute)", fontWeight: 700 }}>Separa origen de datos confirmados</span>} />
          <TableScroll minWidth={isImage ? 760 : 680}>
            <div style={{ display: "grid", gridTemplateColumns: isImage ? "150px 1.1fr 1.3fr 90px 110px 120px" : "1.2fr 1.3fr 100px 100px 110px 120px", padding: "10px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
              {isImage
                ? <><div>Confianza</div><div>Club</div><div>Equipo</div><div>Cat.</div><div>Estado</div><div style={{ textAlign: "right" }}>Marca</div></>
                : <><div>Club</div><div>Equipo</div><div>Categoría</div><div>Color</div><div>Estado</div><div style={{ textAlign: "right" }}>Marca</div></>}
            </div>
            {(isImage ? IMG_EXTRACT : MAP_PREVIEW).map((r, i, arr) => {
              const warnRow = r.flag && r.flag !== "new";
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: isImage ? "150px 1.1fr 1.3fr 90px 110px 120px" : "1.2fr 1.3fr 100px 100px 110px 120px", alignItems: "center", padding: "12px 18px",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none", background: warnRow ? "color-mix(in srgb, var(--warn-bg) 45%, transparent)" : "transparent" }}>
                  {isImage && <div><ConfidenceBar value={r.conf} /></div>}
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: r.club === "—" || r.club === "?" ? "var(--warn)" : "var(--text)" }}>{r.club}</div>
                  <div style={{ fontSize: 13, color: "var(--text-soft)" }}>{r.team}</div>
                  <div><CatChip name={r.cat} ck={r.ck} size="sm" /></div>
                  {!isImage && <div style={{ fontSize: 12.5, color: "var(--text-mute)", fontWeight: 600 }}>{r.color}</div>}
                  <div style={{ fontSize: 12.5, color: r.status.includes("?") ? "var(--warn)" : "var(--text-soft)", fontWeight: 600 }}>{r.status}</div>
                  <div style={{ textAlign: "right" }}><FlagTag flag={r.flag} /></div>
                </div>
              );
            })}
          </TableScroll>
        </Card>

        {/* Validation */}
        <Card>
          <CardHead title="Validación" icon="checkcircle" sub={`${issues} elementos requieren atención`} />
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 10 }}>
            {MAP_VALIDATION.map((v, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: "var(--radius-sm)",
                background: v.ok ? "var(--surface-2)" : "var(--warn-bg)", border: `1px solid ${v.ok ? "var(--line)" : "var(--warn-line)"}` }}>
                <Icon name={v.ok ? "checkcircle" : "alert"} size={18} style={{ color: v.ok ? "var(--ok)" : "var(--warn)", flex: "0 0 auto" }} sw={2.1} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{v.text}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* sticky footer */}
      <div style={{ position: "fixed", left: "var(--sidebar-w, 234px)", right: 0, bottom: 0, background: "var(--surface)", borderTop: "1px solid var(--line)", padding: "14px 32px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 -6px 24px rgba(15,23,42,.06)", zIndex: 10, flexWrap: "wrap", transition: "left .18s ease" }}>
        <Btn variant="ghost" icon="chevleft" onClick={() => nav("import")}>Volver</Btn>
        <div className="hide-mobile" style={{ fontSize: 13, color: "var(--text-soft)" }}>
          <strong style={{ color: "var(--text)" }}>{issues} advertencias</strong> · puedes resolverlas ahora o en la revisión de cambios
        </div>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" icon="alert" onClick={() => nav("importerrors")}>Resolver Problemas</Btn>
        <Btn variant="primary" iconR="chevright" onClick={() => nav("importdiff")}>Confirmar Mapeo</Btn>
      </div>
    </div>
  );
}

window.ImportMappingScreen = ImportMappingScreen;

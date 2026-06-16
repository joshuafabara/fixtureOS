/* fixtureOS — Screen: Import History (/imports) */

function ImportHistoryScreen() {
  const { nav } = useNav();
  const [src, setSrc] = React.useState("all");
  const [st, setSt] = React.useState("all");
  const rows = IMP_HISTORY.filter((r) => (src === "all" || r.source === src) && (st === "all" || r.status === st));

  return (
    <div className="screen-pad" style={{ maxWidth: 1180, margin: "0 auto" }}>
      <PageHeader eyebrow="Importaciones · Quito Basket Liga"
        title="Historial de Importaciones"
        sub="Todas las importaciones de la organización y su estado."
        right={<Btn variant="primary" icon="upload" onClick={() => nav("import")}>Nueva importación</Btn>} />

      {/* filters */}
      <Card style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: .5 }}>Fuente</span>
            <SegTabs size="sm" value={src} onChange={setSrc} tabs={[{ id: "all", label: "Todas" }, { id: "excel", label: "Excel" }, { id: "csv", label: "CSV" }, { id: "image", label: "Imagen" }, { id: "drupal", label: "Drupal" }]} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: .5 }}>Estado</span>
            <SegTabs size="sm" value={st} onChange={setSt} tabs={[{ id: "all", label: "Todos" }, { id: "review", label: "Revisión" }, { id: "errors", label: "Problemas" }, { id: "confirmed", label: "Confirmados" }, { id: "rejected", label: "Rechazados" }]} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHead title="Importaciones" sub={`${rows.length} de ${IMP_HISTORY.length}`} icon="history" />
        <TableScroll minWidth={880}>
          <div style={{ display: "grid", gridTemplateColumns: "130px 1.4fr 110px 110px 170px 1.4fr 120px", padding: "10px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
            <div>Fecha</div><div>Torneo</div><div>Fuente</div><div>Modo</div><div>Estado</div><div>Resumen</div><div style={{ textAlign: "right" }}>Acciones</div>
          </div>
          {rows.map((r, i) => {
            const continuable = r.status === "review" || r.status === "errors";
            return (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: "130px 1.4fr 110px 110px 170px 1.4fr 120px", alignItems: "center", padding: "13px 18px", borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none" }}>
                <div className="mono" style={{ fontSize: 12.5, color: "var(--text-mute)", fontWeight: 600 }}>{r.date}</div>
                <div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.tournament}</div>
                <div><SourceBadge source={r.source} size="sm" /></div>
                <div><span style={{ fontSize: 11.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: r.mode === "update" ? "var(--info-bg)" : "var(--ok-bg)", color: r.mode === "update" ? "var(--info)" : "var(--ok)", border: `1px solid ${r.mode === "update" ? "var(--info-bg2)" : "var(--ok-line)"}` }}>{r.mode === "update" ? "Actualizar" : "Crear"}</span></div>
                <div><ImpStatusPill status={r.status} size="sm" /></div>
                <div style={{ fontSize: 12.5, color: "var(--text-soft)" }}>{r.summary}</div>
                <div style={{ textAlign: "right" }}>
                  {continuable
                    ? <Btn variant="soft" size="sm" iconR="chevright" onClick={() => nav(r.status === "errors" ? "importerrors" : "importdiff")}>Continuar</Btn>
                    : <Btn variant="subtle" size="sm" icon="gitcompare" onClick={() => nav("importdiff")}>Ver diff</Btn>}
                </div>
              </div>
            );
          })}
        </TableScroll>
      </Card>
    </div>
  );
}

window.ImportHistoryScreen = ImportHistoryScreen;

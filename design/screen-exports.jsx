/* fixtureOS — Screen: Export Center */

const EXPORT_HISTORY = [
  { name: "Fixture completo", fmt: "PDF", ver: "V5", filt: "Todas las categorías", date: "Hoy · 13:02", by: "Andrés" },
  { name: "Jornada 3 · U12", fmt: "Excel", ver: "V4", filt: "U12 · Sáb 12", date: "Ayer · 18:40", by: "Mónica" },
  { name: "Fixture publicado", fmt: "Imagen", ver: "V4", filt: "Solo publicadas", date: "10 Jul · 09:15", by: "Andrés" },
  { name: "Posiciones U16", fmt: "Excel", ver: "V4", filt: "U16", date: "09 Jul · 16:20", by: "Diego" },
];
const FMT_TONE = { PDF: ["var(--crit)", "var(--crit-bg)"], Excel: ["var(--ok)", "var(--ok-bg)"], Imagen: ["var(--info)", "var(--info-bg)"] };

function ExportsScreen() {
  const { isMobile, narrow } = useViewport();
  const [fmt, setFmt] = React.useState("PDF");

  return (
    <div className="screen-pad" style={{ maxWidth: 1120, margin: "0 auto" }}>
      <PageHeader eyebrow="Copa Apertura 2026" title="Centro de exportes"
        sub="Genera archivos del fixture en distintos formatos y mantén el historial." />

      <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "360px minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        {/* Create export */}
        <Card style={{ padding: 18, position: narrow ? "static" : "sticky", top: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 15.5, marginBottom: 16 }}>Crear export</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", marginBottom: 7 }}>Versión</div>
              <div style={{ position: "relative" }}>
                <select style={{ width: "100%", appearance: "none", WebkitAppearance: "none", padding: "10px 32px 10px 13px", borderRadius: 10, border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13.5, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                  {VERSIONS.map((v) => <option key={v.v}>{v.v} · {STATE_MAP[v.state].label}</option>)}
                </select>
                <Icon name="chevdown" size={14} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", marginBottom: 7 }}>Formato</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[["PDF", "download"], ["Excel", "list"], ["Imagen", "eye"]].map(([f, ic]) => {
                  const on = fmt === f;
                  return <button key={f} onClick={() => setFmt(f)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 6px", borderRadius: 11, border: `1px solid ${on ? "var(--accent)" : "var(--line-strong)"}`, background: on ? "var(--accent-soft)" : "var(--surface)", color: on ? "var(--accent-strong)" : "var(--text-soft)", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "var(--font-sans)" }}><Icon name={ic} size={18} />{f}</button>;
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-soft)", marginBottom: 7 }}>Filtros</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {Object.values(CATS).map((c) => <CatBadge key={c.id} cat={c.id} size="sm" />)}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13, color: "var(--text-soft)", fontWeight: 600, cursor: "pointer" }}>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--accent)", width: 15, height: 15 }} /> Solo fechas publicadas
              </label>
            </div>
            <Btn variant="primary" icon="download" style={{ justifyContent: "center", width: "100%" }}>Generar export</Btn>
          </div>
        </Card>

        {/* History */}
        <Card>
          <CardHead title="Historial de exportes" sub={`${EXPORT_HISTORY.length} archivos generados`} icon="history" />
          <TableScroll minWidth={620}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 90px 60px 1.3fr 110px", padding: "10px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
              <div>Nombre</div><div>Formato</div><div>Ver.</div><div>Filtros / fecha</div><div style={{ textAlign: "right" }}>Acción</div>
            </div>
            {EXPORT_HISTORY.map((r, i) => {
              const [t, bg] = FMT_TONE[r.fmt] || FMT_TONE.PDF;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 90px 60px 1.3fr 110px", alignItems: "center", padding: "13px 18px", borderBottom: i < EXPORT_HISTORY.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.name}</div>
                  <div><span style={{ fontSize: 11.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: bg, color: t }}>{r.fmt}</span></div>
                  <div className="mono" style={{ fontSize: 12.5, color: "var(--text-mute)", fontWeight: 700 }}>{r.ver}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-soft)" }}>{r.filt}<div style={{ color: "var(--text-mute)", marginTop: 1 }}>{r.date} · {r.by}</div></div>
                  <div style={{ textAlign: "right" }}><Btn variant="subtle" size="sm" icon="download">Descargar</Btn></div>
                </div>
              );
            })}
          </TableScroll>
        </Card>
      </div>
    </div>
  );
}

window.ExportsScreen = ExportsScreen;

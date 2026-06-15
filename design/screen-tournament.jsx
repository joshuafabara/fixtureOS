/* fixtureOS — Screen: Tournament Detail (tabbed) */

function StatusDot({ status }) {
  const ok = status === "ready";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700,
      color: ok ? "var(--ok)" : "var(--warn)" }}>
      <Icon name={ok ? "checkcircle" : "alert"} size={14} sw={2.2} />
      {ok ? "Lista" : "Falta config."}
    </span>
  );
}

function CategoriesTable({ compact }) {
  const { nav } = useNav();
  return (
    <TableScroll minWidth={640}>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 70px 100px 1.4fr 130px 40px", padding: "10px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
        <div>Categoría</div><div>Equipos</div><div>Inicio</div><div>Modo de juego</div><div>Estado</div><div></div>
      </div>
      {CATEGORIES.map((c, i) => (
        <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 70px 100px 1.4fr 130px 40px", alignItems: "center", padding: "13px 18px", borderBottom: i < CATEGORIES.length - 1 ? "1px solid var(--line)" : "none", background: c.status === "incomplete" ? "var(--warn-bg)" : "transparent" }}>
          <div><CatBadge cat={c.id} /></div>
          <div className="mono" style={{ fontWeight: 700, fontSize: 14 }}>{c.teams}</div>
          <div style={{ fontSize: 13, fontWeight: c.start === "—" ? 700 : 600, color: c.start === "—" ? "var(--warn)" : "var(--text)" }}>{c.start === "—" ? "Falta" : c.start}</div>
          <div style={{ fontSize: 13, color: c.mode === "—" ? "var(--warn)" : "var(--text-soft)", fontWeight: c.mode === "—" ? 700 : 600 }}>{c.mode === "—" ? "Falta modo" : c.mode}</div>
          <div><StatusDot status={c.status} /></div>
          <div><button onClick={() => nav("fixture")} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid var(--line)", background: "var(--surface)", display: "grid", placeItems: "center", color: "var(--text-mute)", cursor: "pointer" }}><Icon name="chevright" size={15} /></button></div>
        </div>
      ))}
    </TableScroll>
  );
}

function VersionRow({ ver, last }) {
  const { nav } = useNav();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "64px 110px 1fr 150px 200px", alignItems: "center", padding: "13px 18px", borderBottom: last ? "none" : "1px solid var(--line)", background: ver.current ? "var(--accent-soft)" : "transparent" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span className="mono" style={{ fontWeight: 800, fontSize: 14, color: ver.current ? "var(--accent-strong)" : "var(--text)" }}>{ver.v}</span>
      </div>
      <div><StatePill state={ver.state} /></div>
      <div style={{ fontSize: 13, color: "var(--text-soft)", fontWeight: 600, paddingRight: 12 }}>{ver.reason}</div>
      <div style={{ fontSize: 12.5, color: "var(--text-mute)" }}>
        <div style={{ fontWeight: 700, color: "var(--text)" }}>{ver.by}</div>
        <div className="mono" style={{ fontSize: 11.5 }}>{ver.date}</div>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <Btn variant="subtle" size="sm" icon="eye" onClick={() => nav("fixture")}>Ver</Btn>
        <Btn variant="subtle" size="sm" icon="gitcompare" onClick={() => nav("compare")}>Comparar</Btn>
        {!ver.current && <Btn variant="subtle" size="sm" icon="refresh" title="Restaurar (crea nueva versión)" />}
      </div>
    </div>
  );
}

function TournamentScreen() {
  const { nav } = useNav();
  const { isMobile, narrow } = useViewport();
  const [tab, setTab] = React.useState("resumen");
  const tabs = [
    { id: "resumen", label: "Resumen" }, { id: "categorias", label: "Categorías" },
    { id: "fixture", label: "Fixture" }, { id: "contexto", label: "Contexto" },
    { id: "versiones", label: "Versiones" }, { id: "exportes", label: "Exportes" },
  ];

  return (
    <div className="screen-pad" style={{ maxWidth: 1380, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 16, minWidth: 0 }}>
          <div style={{ width: 56, height: 56, borderRadius: 15, background: "linear-gradient(150deg, var(--accent-hot), var(--accent-strong))", color: "#fff", display: "grid", placeItems: "center", flex: "0 0 auto", boxShadow: "0 8px 22px color-mix(in srgb, var(--accent) 30%, transparent)" }}>
            <Icon name="trophy" size={26} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: isMobile ? 22 : 27, fontWeight: 800, letterSpacing: -.8, margin: 0 }}>Copa Apertura 2026</h1>
              <StatePill state="published" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 7, fontSize: 13, color: "var(--text-soft)", fontWeight: 600, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="basket" size={15} style={{ color: "var(--text-mute)" }} /> Básquet</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="users" size={15} style={{ color: "var(--text-mute)" }} /> 48 equipos</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="layers" size={15} style={{ color: "var(--text-mute)" }} /> 6 categorías</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="calendar" size={15} style={{ color: "var(--text-mute)" }} /> 11–13 Julio</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }} className="mono"><Icon name="layers" size={15} style={{ color: "var(--text-mute)" }} /> Versión actual V5</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flex: "0 0 auto", flexWrap: "wrap" }}>
          <Btn variant="ghost" icon="download" onClick={() => nav("exports")}>Exportar</Btn>
          <Btn variant="primary" icon="zap" onClick={() => nav("dryrun")}>Generar Dry Run</Btn>
        </div>
      </div>

      <div style={{ borderBottom: "1px solid var(--line)", marginBottom: 20, paddingBottom: 0, overflowX: "auto" }} className="tbl-scroll">
        <SegTabs tabs={tabs} value={tab} onChange={setTab} />
      </div>

      {tab === "resumen" && (
        <div style={{ display: "grid", gridTemplateColumns: narrow ? "minmax(0,1fr)" : "minmax(0,1fr) 340px", gap: 16, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <CardHead title="Estado del fixture" icon="layers" right={<Btn variant="soft" size="sm" icon="eye" onClick={() => nav("fixture")}>Abrir Fixture</Btn>} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0 }}>
                {[["Versión actual", "V5", "Borrador", "draft"], ["Fechas publicadas", "18 / 30", "60% del torneo", null], ["Conflictos abiertos", "1", "crítico sin resolver", "crit"]].map(([l, v, s, st], i) => (
                  <div key={i} style={{ padding: "18px 20px", borderRight: i < 2 ? "1px solid var(--line)" : "none" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-mute)" }}>{l}</div>
                    <div className="mono tnum" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1, marginTop: 8, color: st === "crit" ? "var(--crit)" : "var(--text)" }}>{v}</div>
                    <div style={{ fontSize: 12, marginTop: 4, color: st === "crit" ? "var(--crit)" : st === "draft" ? "var(--text-soft)" : "var(--text-mute)", fontWeight: st ? 700 : 500 }}>{s}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHead title="Categorías" sub="Toda categoría necesita fecha de inicio y modo de juego" icon="layers"
                right={<Btn variant="subtle" size="sm" onClick={() => setTab("categorias")} iconR="chevright">Ver todas</Btn>} />
              <CategoriesTable />
            </Card>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card style={{ padding: 18, background: "var(--warn-bg)", border: "1px solid var(--warn-line)" }}>
              <div style={{ display: "flex", gap: 11 }}>
                <Icon name="alert" size={20} style={{ color: "var(--warn)", flex: "0 0 auto", marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "var(--warn)" }}>1 categoría incompleta</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-soft)", marginTop: 3, lineHeight: 1.5 }}>Senior no tiene fecha de inicio ni modo de juego. No se incluirá en la generación del fixture hasta completarla.</div>
                  <div style={{ marginTop: 11 }}><Btn variant="ghost" size="sm" icon="settings" onClick={() => setTab("categorias")}>Completar categoría</Btn></div>
                </div>
              </div>
            </Card>
            <Card>
              <CardHead title="Versiones recientes" icon="history" right={<span onClick={() => setTab("versiones")} style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", cursor: "pointer" }}>Historial</span>} />
              <div style={{ padding: "8px 0" }}>
                {VERSIONS.slice(0, 4).map((v, i) => (
                  <div key={v.v} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 18px" }}>
                    <span className="mono" style={{ fontWeight: 800, fontSize: 13, width: 26, color: v.current ? "var(--accent-strong)" : "var(--text)" }}>{v.v}</span>
                    <StatePill state={v.state} dot={false} />
                    <div style={{ fontSize: 12, color: "var(--text-mute)", marginLeft: "auto" }} className="mono">{v.date.split("·")[0]}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "categorias" && (
        <Card>
          <CardHead title="Categorías del torneo" sub="6 categorías · 1 requiere atención" icon="layers"
            right={<Btn variant="primary" size="sm" icon="plus">Añadir categoría</Btn>} />
          <CategoriesTable />
        </Card>
      )}

      {tab === "versiones" && (
        <Card>
          <CardHead title="Historial de versiones" sub="Cada cambio aprobado crea una versión inmutable" icon="history"
            right={<Btn variant="ghost" size="sm" icon="gitcompare" onClick={() => nav("compare")}>Comparar versiones</Btn>} />
          <TableScroll minWidth={720}>
            <div style={{ display: "grid", gridTemplateColumns: "64px 110px 1fr 150px 200px", padding: "10px 18px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
              <div>Versión</div><div>Estado</div><div>Motivo</div><div>Autor</div><div style={{ textAlign: "right" }}>Acciones</div>
            </div>
            {VERSIONS.map((v, i) => <VersionRow key={v.v} ver={v} last={i === VERSIONS.length - 1} />)}
          </TableScroll>
        </Card>
      )}

      {tab === "fixture" && (
        <Card style={{ padding: 48, display: "grid", placeItems: "center", textAlign: "center" }}>
          <div style={{ width: 54, height: 54, borderRadius: 15, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", marginBottom: 14 }}><Icon name="layers" size={26} /></div>
          <div style={{ fontWeight: 800, fontSize: 17 }}>Fixture · Versión V5</div>
          <div style={{ color: "var(--text-mute)", fontSize: 13.5, marginTop: 5, maxWidth: 360 }}>Visualiza el fixture por fecha o calendario, filtra por categoría y cancha, y publica fechas.</div>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <Btn variant="primary" icon="eye" onClick={() => nav("fixture")}>Abrir Fixture Viewer</Btn>
            <Btn variant="ghost" icon="edit" onClick={() => nav("manualedit")}>Edición manual</Btn>
          </div>
        </Card>
      )}

      {tab === "contexto" && (
        <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "repeat(2,1fr)", gap: 16 }}>
          {[["Organización", "building", "Duración 60 min · Canchas Fri-Sun 08:00–21:00 · Agrupar clubes", "ctxorg"], ["Torneo", "trophy", "Sin partidos antes de 09:00 · Prioridad a categorías menores", "ctxtournament"], ["Categoría", "layers", "U16 doble round robin · descanso mínimo 90 min entre partidos", "ctxcategory"], ["Fecha", "calendar", "Dom 13: cierre 14:00 · Cancha Sur no disponible por mantenimiento", "ctxdate"]].map(([t, ic, d, scr]) => (
            <Card key={t} style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center" }}><Icon name={ic} size={16} /></div>
                  <div style={{ fontWeight: 800, fontSize: 14.5 }}>Contexto · {t}</div>
                </div>
                <Btn variant="subtle" size="sm" icon="edit" onClick={() => nav(scr)}>Editar</Btn>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-soft)", lineHeight: 1.55, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "11px 13px" }}>{d}</div>
            </Card>
          ))}
        </div>
      )}

      {tab === "exportes" && (
        <Card>
          <CardHead title="Exportes recientes" icon="download" right={<Btn variant="primary" size="sm" icon="plus">Nuevo export</Btn>} />
          <TableScroll minWidth={620}>
          {[["Fixture completo", "PDF", "V5", "Hoy · 13:02"], ["Jornada 3 · U12", "Excel", "V4", "Ayer · 18:40"], ["Fixture publicado", "Imagen", "V4", "10 Jul"]].map((r, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px 140px 110px", alignItems: "center", padding: "13px 18px", borderBottom: i < 2 ? "1px solid var(--line)" : "none" }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r[0]}</div>
              <div><span style={{ fontSize: 11.5, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: "var(--ink-100)", color: "var(--text-soft)" }}>{r[1]}</span></div>
              <div className="mono" style={{ fontSize: 12.5, color: "var(--text-mute)" }}>{r[2]}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-mute)" }}>{r[3]}</div>
              <div style={{ textAlign: "right" }}><Btn variant="subtle" size="sm" icon="download">Descargar</Btn></div>
            </div>
          ))}
          </TableScroll>
        </Card>
      )}
    </div>
  );
}

window.TournamentScreen = TournamentScreen;

/* fixtureOS — Screen: Import Wizard (3 steps) */

const IMPORT_PREVIEW = [
  { club: "Spartans BC", team: "Spartans U12", cat: "u12", status: "ok" },
  { club: "Spartans BC", team: "Spartans U14", cat: "u14", status: "ok" },
  { club: "Titanes", team: "Titanes U16", cat: "u16", status: "ok" },
  { club: "Cóndores Andinos", team: "Cóndores Sr", cat: "senior", status: "warn" },
  { club: "Halcones", team: "Halcones U18", cat: "u18", status: "ok" },
  { club: "Toros Rojos", team: "Toros U12", cat: "u12", status: "dup" },
  { club: "Pumas Quito", team: "Pumas Sub-21", cat: "sub21", status: "ok" },
];

function ImportScreen() {
  const { nav } = useNav();
  const { isMobile } = useViewport();
  const [step, setStep] = React.useState(0);
  const [source, setSource] = React.useState("excel");
  const steps = ["Origen", "Previsualizar", "Confirmar"];

  const sources = [
    ["drupal", "external", "Drupal JSON:API", "Conexión directa con el sitio de la liga"],
    ["excel", "upload", "Archivo Excel", "Sube una planilla .xlsx con equipos y categorías"],
    ["image", "eye", "Imagen / captura", "Extrae equipos desde una foto o screenshot con IA"],
  ];

  return (
    <div className="screen-pad" style={{ maxWidth: 900, margin: "0 auto" }}>
      <PageHeader eyebrow="Torneos · Copa Apertura 2026" title="Importar datos del torneo"
        sub="Carga equipos, categorías y clubes desde tu fuente preferida." />

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 14, marginBottom: 22 }}>
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 28, height: 28, borderRadius: 99, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, flex: "0 0 auto",
                background: i < step ? "var(--ok)" : i === step ? "var(--accent)" : "var(--ink-100)", color: i <= step ? "#fff" : "var(--text-mute)" }}>
                {i < step ? <Icon name="check" size={15} sw={2.4} /> : i + 1}
              </span>
              {!isMobile && <span style={{ fontSize: 13.5, fontWeight: 700, color: i === step ? "var(--text)" : "var(--text-mute)" }}>{s}</span>}
            </div>
            {i < steps.length - 1 && <span style={{ flex: 1, height: 2, background: i < step ? "var(--ok)" : "var(--line)", borderRadius: 2 }} />}
          </React.Fragment>
        ))}
      </div>

      <Card style={{ padding: isMobile ? 16 : "24px 26px" }} className="card-pad-lg">
        {step === 0 && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>¿De dónde importamos?</div>
            <div style={{ fontSize: 13, color: "var(--text-mute)", marginBottom: 18 }}>Elige una fuente para detectar equipos automáticamente.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {sources.map(([id, ic, title, desc]) => {
                const on = source === id;
                return (
                  <button key={id} onClick={() => setSource(id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 16px", borderRadius: "var(--radius)", border: `1px solid ${on ? "var(--accent)" : "var(--line-strong)"}`, background: on ? "var(--accent-soft)" : "var(--surface)", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)", boxShadow: on ? "0 0 0 3px var(--accent-soft)" : "none" }}>
                    <span style={{ width: 42, height: 42, borderRadius: 11, background: on ? "var(--surface)" : "var(--ink-100)", color: "var(--accent)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={ic} size={20} /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 800, fontSize: 15, color: "var(--text)" }}>{title}</span>
                      <span style={{ display: "block", fontSize: 12.5, color: "var(--text-mute)", marginTop: 2 }}>{desc}</span>
                    </span>
                    <span style={{ width: 22, height: 22, borderRadius: 99, border: `2px solid ${on ? "var(--accent)" : "var(--line-strong)"}`, display: "grid", placeItems: "center", flex: "0 0 auto" }}>{on && <span style={{ width: 11, height: 11, borderRadius: 99, background: "var(--accent)" }} />}</span>
                  </button>
                );
              })}
            </div>
            {source === "excel" && (
              <div style={{ marginTop: 16, border: "2px dashed var(--line-strong)", borderRadius: "var(--radius)", padding: "30px 20px", textAlign: "center", background: "var(--surface-2)" }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}><Icon name="upload" size={22} /></div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Arrastra tu archivo .xlsx aquí</div>
                <div style={{ fontSize: 12.5, color: "var(--text-mute)", marginTop: 4 }}>o <span style={{ color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}>selecciona desde tu equipo</span></div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Previsualización · {IMPORT_PREVIEW.length} equipos detectados</div>
                <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 2 }}>Revisa antes de importar. Marcamos duplicados y datos faltantes.</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <SevTag sev="warn" size="sm">1 sin contacto</SevTag>
                <SevTag sev="crit" size="sm">1 duplicado</SevTag>
              </div>
            </div>
            <TableScroll minWidth={560}>
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.3fr 110px 120px", padding: "10px 14px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .6, color: "var(--text-mute)", borderBottom: "1px solid var(--line)" }}>
                <div>Club</div><div>Equipo</div><div>Categoría</div><div style={{ textAlign: "right" }}>Estado</div>
              </div>
              {IMPORT_PREVIEW.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.3fr 1.3fr 110px 120px", alignItems: "center", padding: "12px 14px", borderBottom: i < IMPORT_PREVIEW.length - 1 ? "1px solid var(--line)" : "none", background: r.status === "dup" ? "var(--crit-bg)" : r.status === "warn" ? "color-mix(in srgb, var(--warn-bg) 50%, transparent)" : "transparent" }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.club}</div>
                  <div style={{ fontSize: 13, color: "var(--text-soft)" }}>{r.team}</div>
                  <div><CatBadge cat={r.cat} size="sm" /></div>
                  <div style={{ textAlign: "right" }}>
                    {r.status === "ok" && <SevTag sev="info" size="sm">Listo</SevTag>}
                    {r.status === "warn" && <SevTag sev="warn" size="sm">Sin contacto</SevTag>}
                    {r.status === "dup" && <SevTag sev="crit" size="sm">Duplicado</SevTag>}
                  </div>
                </div>
              ))}
            </TableScroll>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 60, height: 60, borderRadius: 17, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}><Icon name="upload" size={28} /></div>
            <div style={{ fontWeight: 800, fontSize: 19 }}>Confirmar importación</div>
            <div style={{ fontSize: 13.5, color: "var(--text-soft)", marginTop: 8, maxWidth: 420, marginInline: "auto", lineHeight: 1.55 }}>Se importarán <strong>6 equipos nuevos</strong> en 6 categorías. El duplicado (Toros U12) se omitirá. Podrás completar contactos faltantes después.</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 22 }}>
              {[["6", "equipos"], ["6", "categorías"], ["1", "omitido"]].map(([n, l]) => (
                <div key={l}><div className="mono" style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, color: "var(--text)" }}>{n}</div><div style={{ fontSize: 12, color: "var(--text-mute)" }}>{l}</div></div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
        <Btn variant="ghost" icon="chevleft" onClick={() => step === 0 ? nav("tournaments") : setStep(step - 1)}>{step === 0 ? "Cancelar" : "Atrás"}</Btn>
        <div style={{ flex: 1 }} />
        {step < 2
          ? <Btn variant="primary" iconR="chevright" onClick={() => setStep(step + 1)}>Continuar</Btn>
          : <Btn variant="primary" icon="check" onClick={() => nav("tournament")}>Importar equipos</Btn>}
      </div>
    </div>
  );
}

window.ImportScreen = ImportScreen;

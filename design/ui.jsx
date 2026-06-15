/* ===========================================================
   fixtureOS — shared app UI atoms + DateFilter
   =========================================================== */

const NavCtx = React.createContext({ screen: "dashboard", params: {}, nav: () => {} });
const useNav = () => React.useContext(NavCtx);

/* ---------- Responsive viewport hook (mobile-first) ---------- */
function useViewport() {
  const get = () => (typeof window !== "undefined" ? window.innerWidth : 1280);
  const [w, setW] = React.useState(get);
  React.useEffect(() => {
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setW(get())); };
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return { w, isMobile: w < 760, isTablet: w >= 760 && w < 1080, narrow: w < 1080, isDesktop: w >= 1080, wide: w >= 1200 };
}

/* Horizontal-scroll wrapper for wide tables; collapses to stacked cards on mobile */
function TableScroll({ minWidth = 680, children, style }) {
  return (
    <div className="tbl-scroll" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", ...style }}>
      <div className="tbl-stack" style={{ minWidth }}>{children}</div>
    </div>
  );
}

/* ---------- Button ---------- */
function Btn({ variant = "primary", icon, iconR, children, onClick, size = "md", active, style, title }) {
  const pad = size === "sm" ? "7px 11px" : size === "lg" ? "12px 20px" : "9px 15px";
  const fs = size === "sm" ? 12.5 : size === "lg" ? 14.5 : 13.5;
  const V = {
    primary: { background: "var(--accent)", color: "#fff", border: "1px solid transparent", boxShadow: "0 5px 16px rgba(234,88,12,.28)" },
    soft:    { background: "var(--accent-soft)", color: "var(--accent-strong)", border: "1px solid var(--accent-soft-2)" },
    ghost:   { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--line-strong)" },
    subtle:  { background: "var(--ink-100)", color: "var(--text-soft)", border: "1px solid transparent" },
    danger:  { background: "var(--crit-bg)", color: "var(--crit)", border: "1px solid var(--crit-line)" },
    ok:      { background: "var(--ok)", color: "#fff", border: "1px solid transparent", boxShadow: "0 5px 16px rgba(4,120,87,.25)" },
  }[variant];
  return (
    <button onClick={onClick} title={title} style={{
      display: "inline-flex", alignItems: "center", gap: 7, padding: pad, borderRadius: 10,
      fontWeight: 700, fontSize: fs, fontFamily: "var(--font-sans)", cursor: "pointer",
      whiteSpace: "nowrap", transition: "filter .12s, transform .05s", ...V, ...style,
    }}
      onMouseDown={(e) => e.currentTarget.style.transform = "translateY(1px)"}
      onMouseUp={(e) => e.currentTarget.style.transform = ""}
      onMouseLeave={(e) => e.currentTarget.style.transform = ""}>
      {icon && <Icon name={icon} size={fs + 2} sw={2.1} />}{children}
      {iconR && <Icon name={iconR} size={fs + 2} sw={2.1} />}
    </button>
  );
}

function IconBtn({ icon, onClick, title, dot, size = 38, active }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: size, height: size, borderRadius: 9, border: "1px solid var(--line)",
      background: active ? "var(--accent-soft)" : "var(--surface)", color: active ? "var(--accent-strong)" : "var(--text-soft)",
      display: "grid", placeItems: "center", position: "relative", cursor: "pointer",
    }}>
      <Icon name={icon} size={18} />
      {dot && <span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: 9, background: "var(--accent)", border: "2px solid var(--surface)" }} />}
    </button>
  );
}

/* ---------- Card ---------- */
function Card({ children, pad = 0, style, className }) {
  return (
    <div className={className} style={{
      background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
      boxShadow: "var(--shadow-sm)", padding: pad, ...style,
    }}>{children}</div>
  );
}

function CardHead({ title, sub, right, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {icon && <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon name={icon} size={16} /></div>}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15.5, letterSpacing: -.3 }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}

/* ---------- Segmented tabs ---------- */
function SegTabs({ tabs, value, onChange, size = "md" }) {
  return (
    <div style={{ display: "inline-flex", gap: 3, padding: 3, background: "var(--ink-100)", borderRadius: 10 }}>
      {tabs.map((t) => {
        const v = typeof t === "string" ? t : t.id;
        const lb = typeof t === "string" ? t : t.label;
        const on = v === value;
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: size === "sm" ? "5px 10px" : "7px 13px",
            borderRadius: 7, fontSize: size === "sm" ? 12 : 13, fontWeight: 700, cursor: "pointer", border: "none",
            background: on ? "var(--surface)" : "transparent", color: on ? "var(--text)" : "var(--text-mute)",
            boxShadow: on ? "var(--shadow-sm)" : "none", whiteSpace: "nowrap",
          }}>
            {typeof t !== "string" && t.icon && <Icon name={t.icon} size={14} sw={2.1} />}{lb}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Page header ---------- */
function PageHeader({ eyebrow, title, sub, right }) {
  return (
    <div className="page-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 20 }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div style={{ fontSize: 12, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 1.3 }}>{eyebrow}</div>}
        <h1 className="page-title" style={{ fontSize: 27, fontWeight: 800, letterSpacing: -.8, margin: "3px 0 0" }}>{title}</h1>
        {sub && <p style={{ margin: "5px 0 0", color: "var(--text-mute)", fontSize: 14 }}>{sub}</p>}
      </div>
      {right && <div className="page-actions" style={{ display: "flex", gap: 10, flex: "0 0 auto" }}>{right}</div>}
    </div>
  );
}

/* ---------- Date filter (single + range) ---------- */
function rangeKeys(startKey, endKey) {
  const keys = FIX_DATES.map((d) => d.key);
  let i = keys.indexOf(startKey), j = keys.indexOf(endKey);
  if (i < 0) i = 0; if (j < 0) j = keys.length - 1;
  if (i > j) [i, j] = [j, i];
  return keys.slice(i, j + 1);
}
function dateByKey(k) { return FIX_DATES.find((d) => d.key === k); }

function DateFilter({ value, onChange }) {
  // value = { start, end }
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", off, true);
    return () => document.removeEventListener("pointerdown", off, true);
  }, [open]);

  const keys = rangeKeys(value.start, value.end);
  const single = keys.length === 1;
  const label = single ? dateByKey(keys[0]).label
    : `${dateByKey(keys[0]).num} – ${dateByKey(keys[keys.length - 1]).num} Julio`;

  const set = (start, end) => { onChange({ start, end: end || start }); };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} style={{
        display: "inline-flex", alignItems: "center", gap: 9, padding: "9px 13px", borderRadius: 10,
        border: "1px solid var(--line-strong)", background: "var(--surface)", cursor: "pointer", fontFamily: "var(--font-sans)",
      }}>
        <Icon name="calendar" size={16} style={{ color: "var(--accent)" }} />
        <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text)" }}>{label}</span>
        {!single && <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-mute)", padding: "2px 7px", background: "var(--ink-100)", borderRadius: 99 }}>{keys.length} días</span>}
        <Icon name="chevdown" size={15} style={{ color: "var(--text-mute)" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 8, zIndex: 40, width: 304,
          background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--shadow-lg)", padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "var(--text-mute)", marginBottom: 9 }}>Ver un día</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FIX_DATES.map((d) => {
              const on = single && keys[0] === d.key;
              return (
                <button key={d.key} onClick={() => { set(d.key); setOpen(false); }} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 11px", borderRadius: 9,
                  border: `1px solid ${on ? "var(--accent-soft-2)" : "var(--line)"}`, background: on ? "var(--accent-soft)" : "var(--surface)",
                  cursor: "pointer", fontFamily: "var(--font-sans)",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontWeight: 800, fontSize: 13.5, color: on ? "var(--accent-strong)" : "var(--text)" }}>{d.dow}</span>
                    <span className="mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>{d.num} Jul</span>
                  </span>
                  {on && <Icon name="check" size={16} style={{ color: "var(--accent)" }} sw={2.4} />}
                </button>
              );
            })}
          </div>
          <div style={{ height: 1, background: "var(--line)", margin: "13px 0" }} />
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: .8, color: "var(--text-mute)", marginBottom: 9 }}>Rango de fechas</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DSelect label="Desde" value={value.start} onChange={(v) => set(v, value.end)} />
            <Icon name="arrowright" size={15} style={{ color: "var(--text-mute)", flex: "0 0 auto", marginTop: 16 }} />
            <DSelect label="Hasta" value={value.end} onChange={(v) => set(value.start, v)} />
          </div>
          <button onClick={() => { set(FIX_DATES[0].key, FIX_DATES[FIX_DATES.length - 1].key); setOpen(false); }} style={{
            marginTop: 12, width: "100%", padding: "9px 0", borderRadius: 9, border: "1px solid var(--line-strong)",
            background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)",
          }}>Todo el torneo · 11–13 Jul</button>
        </div>
      )}
    </div>
  );
}

function DSelect({ label, value, onChange }) {
  return (
    <label style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-mute)", marginBottom: 4 }}>{label}</div>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={(e) => onChange(e.target.value)} style={{
          width: "100%", appearance: "none", WebkitAppearance: "none", padding: "8px 28px 8px 10px", borderRadius: 8,
          border: "1px solid var(--line-strong)", background: "var(--surface)", color: "var(--text)",
          fontWeight: 700, fontSize: 12.5, fontFamily: "var(--font-sans)", cursor: "pointer",
        }}>
          {FIX_DATES.map((d) => <option key={d.key} value={d.key}>{d.dow} {d.num}</option>)}
        </select>
        <Icon name="chevdown" size={14} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-mute)", pointerEvents: "none" }} />
      </div>
    </label>
  );
}

Object.assign(window, { NavCtx, useNav, useViewport, TableScroll, Btn, IconBtn, Card, CardHead, SegTabs, PageHeader, DateFilter, rangeKeys, dateByKey });

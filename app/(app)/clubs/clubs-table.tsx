"use client";
import { useState, useRef } from "react";
import { Pencil, Check, X, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; colorHex: string | null };
type ClubRow = {
  id: string;
  name: string;
  categories: Category[];
  contact: {
    id: string;
    contactName: string;
    contactRole: string | null;
    whatsappNumber: string | null;
  } | null;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function WaCell({ clubId, contact }: { clubId: string; contact: ClubRow["contact"] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(contact?.whatsappNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function save() {
    if (!contact) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/clubs/${clubId}/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsappNumber: value || null }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error?.fieldErrors?.whatsappNumber?.[0] ?? "Error al guardar");
    }
  }

  if (!contact) {
    return <span style={{ fontSize: 13, color: "#94a3b8" }}>Sin contacto</span>;
  }

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            ref={inputRef}
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
            placeholder="Ej: 0991234567"
            style={{
              fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600,
              padding: "5px 9px", borderRadius: 7, border: "1.5px solid #0d9488",
              outline: "none", color: "#131c2e", width: 150,
            }}
          />
          <button
            onClick={save}
            disabled={saving}
            style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: "#0d9488", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}
          >
            <Check style={{ width: 13, height: 13 }} />
          </button>
          <button
            onClick={() => { setEditing(false); setValue(contact.whatsappNumber ?? ""); setError(""); }}
            style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e6eaf0", background: "#fff", cursor: "pointer", display: "grid", placeItems: "center", color: "#64748b" }}
          >
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>
        {error && <span style={{ fontSize: 11, color: "#ef4444" }}>{error}</span>}
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 8, cursor: "default" }}
      onMouseEnter={(e) => {
        const btn = e.currentTarget.querySelector<HTMLElement>(".wa-edit-btn");
        if (btn) btn.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const btn = e.currentTarget.querySelector<HTMLElement>(".wa-edit-btn");
        if (btn) btn.style.opacity = "0";
      }}
    >
      {contact.whatsappNumber ? (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "#059669" }}>
          +{contact.whatsappNumber}
        </span>
      ) : (
        <span style={{
          fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
          background: "rgba(251,191,36,0.15)", color: "#b45309", border: "1px solid rgba(251,191,36,0.35)",
        }}>
          Falta
        </span>
      )}
      <button
        className="wa-edit-btn"
        onClick={() => { setEditing(true); }}
        style={{ opacity: 0, transition: "opacity 120ms", width: 24, height: 24, borderRadius: 6, border: "1px solid #e6eaf0", background: "#fff", cursor: "pointer", display: "grid", placeItems: "center", color: "#64748b", flexShrink: 0 }}
      >
        <Pencil style={{ width: 11, height: 11 }} />
      </button>
    </div>
  );
}

export function ClubsTable({ clubs, totalCount }: { clubs: ClubRow[]; totalCount: number }) {
  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.4, color: "#131c2e", fontFamily: "var(--font-sans)" }}>
            Directorio de Clubes
          </h1>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#76869b", padding: "3px 10px", background: "#f1f5f9", borderRadius: 99 }}>
            {totalCount} club{totalCount !== 1 ? "es" : ""}
          </span>
        </div>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          <Plus style={{ width: 14, height: 14 }} /> Añadir club
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14, overflow: "hidden" }}>
        {clubs.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#76869b", fontSize: 14 }}>
            No se encontraron clubes con los filtros actuales
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e6eaf0" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#76869b", textTransform: "uppercase", letterSpacing: 0.5, width: "22%" }}>Club</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#76869b", textTransform: "uppercase", letterSpacing: 0.5, width: "24%" }}>Categorías</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#76869b", textTransform: "uppercase", letterSpacing: 0.5, width: "18%" }}>Contacto principal</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#76869b", textTransform: "uppercase", letterSpacing: 0.5, width: "24%" }}>WhatsApp</th>
                <th style={{ padding: "12px 16px", width: 92 }} />
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => {
                const hasWa = !!club.contact?.whatsappNumber;
                return (
                  <tr
                    key={club.id}
                    style={{ borderBottom: "1px solid #e6eaf0", background: hasWa ? "#fff" : "rgba(251,191,36,0.04)" }}
                  >
                    {/* Club */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 9, background: "#1e293b",
                          color: "#fff", display: "grid", placeItems: "center",
                          fontSize: 13, fontWeight: 800, flexShrink: 0, letterSpacing: -0.5,
                        }}>
                          {getInitials(club.name)}
                        </div>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#131c2e" }}>{club.name}</span>
                      </div>
                    </td>

                    {/* Categorías */}
                    <td style={{ padding: "14px 16px" }}>
                      {club.categories.length === 0 ? (
                        <span style={{ fontSize: 13, color: "#94a3b8" }}>Sin categorías</span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {club.categories.slice(0, 4).map((cat) => {
                            const hex = cat.colorHex ?? "#64748b";
                            const [r, g, b] = hexToRgb(hex);
                            return (
                              <span key={cat.id} style={{
                                fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
                                background: `rgba(${r},${g},${b},0.12)`, color: hex,
                                border: `1px solid rgba(${r},${g},${b},0.25)`,
                              }}>
                                {cat.name}
                              </span>
                            );
                          })}
                          {club.categories.length > 4 && (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "#f1f5f9", color: "#76869b" }}>
                              +{club.categories.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Contacto */}
                    <td style={{ padding: "14px 16px" }}>
                      {club.contact ? (
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#131c2e" }}>{club.contact.contactName}</div>
                          {club.contact.contactRole && (
                            <div style={{ fontSize: 11.5, color: "#76869b", marginTop: 2 }}>{club.contact.contactRole}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: "#94a3b8" }}>—</span>
                      )}
                    </td>

                    {/* WhatsApp */}
                    <td style={{ padding: "14px 16px" }}>
                      <WaCell clubId={club.id} contact={club.contact} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <Link
                        href={`/clubs/${club.id}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, border: "1px solid #e6eaf0", background: "#fff", color: "#131c2e", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}
                      >
                        Ver <ChevronRight style={{ width: 13, height: 13 }} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

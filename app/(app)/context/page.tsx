import { requireOrg } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { contextVersions, categories, users } from "@/lib/db/schema";
import { eq, and, count, desc, max, sql } from "drizzle-orm";
import { Building2, Trophy, Layers, Calendar, AlertCircle, ArrowRight, History, GitCompare, Target, ExternalLink } from "lucide-react";
import Link from "next/link";

const SCOPE_META = [
  { scope: "organization", label: "Organización", abbr: "Org", icon: Building2, href: "/context/organization", color: "#3b82f6", bg: "rgba(59,130,246,0.10)" },
  { scope: "tournament", label: "Torneo", abbr: "Torneo", icon: Trophy, href: "/tournaments", color: "#0d9488", bg: "rgba(13,148,136,0.10)" },
  { scope: "category", label: "Categorías", abbr: "Cat.", icon: Layers, href: "/tournaments", color: "#8b5cf6", bg: "rgba(139,92,246,0.10)" },
  { scope: "date", label: "Fechas", abbr: "Fecha", icon: Calendar, href: "/context/date", color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
];

const SCOPE_LABELS: Record<string, string> = {
  organization: "Organización",
  tournament: "Torneo",
  category: "Categoría",
  date: "Fecha",
};

const PRIORITY_LEVELS = [
  "Partidos bloqueados",
  "Sobrescrituras manuales",
  "Contexto de Fecha",
  "Contexto de Categoría",
  "Contexto de Torneo",
  "Contexto de Organización",
  "Sistema por defecto",
];

export default async function ContextDashboardPage() {
  const orgId = await requireOrg();

  const scopeCounts = await db
    .select({ scope: contextVersions.scope, count: count(), latestAt: max(contextVersions.createdAt) })
    .from(contextVersions)
    .where(eq(contextVersions.organizationId, orgId))
    .groupBy(contextVersions.scope);

  const countMap = Object.fromEntries(
    scopeCounts.map((r) => [r.scope, { count: r.count, latestAt: r.latestAt }])
  );

  const recentVersions = await db
    .select({
      id: contextVersions.id,
      scope: contextVersions.scope,
      versionNumber: contextVersions.versionNumber,
      rawPrompt: contextVersions.rawPrompt,
      createdAt: contextVersions.createdAt,
      userName: users.name,
    })
    .from(contextVersions)
    .leftJoin(users, eq(contextVersions.createdBy, users.id))
    .where(eq(contextVersions.organizationId, orgId))
    .orderBy(desc(contextVersions.createdAt))
    .limit(8);

  const incompleteCategories = await db
    .select({ id: categories.id, name: categories.name, startDate: categories.startDate, gameModeId: categories.gameModeId })
    .from(categories)
    .where(and(eq(categories.organizationId, orgId), eq(categories.isActiveForFixture, false)))
    .limit(5);

  const totalVersions = scopeCounts.reduce((sum, r) => sum + r.count, 0);

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", padding: "24px 24px 48px", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: "0 0 4px", fontSize: 11.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#76869b" }}>
          Motor de reglas
        </p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.5, color: "#131c2e" }}>
          Centro de Contexto
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#76869b" }}>
          Gestiona las reglas que controlan la generación de fixtures · {totalVersions} versión{totalVersions !== 1 ? "es" : ""} guardada{totalVersions !== 1 ? "s" : ""}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: 20, alignItems: "start" }}>
        {/* Left: main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Scope stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {SCOPE_META.map((meta) => {
              const Icon = meta.icon;
              const data = countMap[meta.scope];
              return (
                <Link key={meta.scope} href={meta.href} style={{ textDecoration: "none" }}>
                  <div style={{ background: "#fff", border: "1px solid #e6eaf0", borderRadius: 12, padding: "16px 16px 14px", cursor: "pointer" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, display: "grid", placeItems: "center", background: meta.bg, color: meta.color, marginBottom: 10 }}>
                      <Icon style={{ width: 16, height: 16 }} />
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, letterSpacing: -1, lineHeight: 1, color: "#131c2e" }}>
                      {data?.count ?? 0}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#76869b", marginTop: 4 }}>
                      Versiones · {meta.abbr}
                    </div>
                    {data?.latestAt && (
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                        Últ. {new Date(data.latestAt).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Capas de reglas activas */}
          <div style={{ background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #e6eaf0" }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: "#131c2e" }}>Capas de reglas activas</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e6eaf0" }}>
                  {["Ámbito", "Versiones", "Última actualización", "Conflictos", "Acción"].map((h, i) => (
                    <th key={h} style={{
                      textAlign: i === 4 ? "right" : "left",
                      padding: "10px 16px", fontSize: 11.5, fontWeight: 700,
                      color: "#76869b", textTransform: "uppercase", letterSpacing: 0.4,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCOPE_META.map((meta) => {
                  const Icon = meta.icon;
                  const data = countMap[meta.scope];
                  return (
                    <tr key={meta.scope} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 7, display: "grid", placeItems: "center", background: meta.bg, color: meta.color, flexShrink: 0 }}>
                            <Icon style={{ width: 13, height: 13 }} />
                          </div>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#131c2e" }}>{meta.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "#131c2e" }}>
                          {data?.count ?? 0}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: "#64748b" }}>
                        {data?.latestAt
                          ? new Date(data.latestAt).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })
                          : <span style={{ color: "#94a3b8" }}>Nunca</span>}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "#f1f5f9", color: "#64748b" }}>
                          0
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px", textAlign: "right" }}>
                        <Link
                          href={meta.href}
                          style={{ fontSize: 12.5, fontWeight: 700, color: "#0d9488", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                        >
                          Editar <ExternalLink style={{ width: 11, height: 11 }} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cambios recientes */}
          <div style={{ background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px", borderBottom: "1px solid #e6eaf0" }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: "#131c2e" }}>Cambios recientes de contexto</span>
              <Link href="/context/history" style={{ fontSize: 12.5, fontWeight: 700, color: "#0d9488", textDecoration: "none" }}>
                Ver historial
              </Link>
            </div>
            {recentVersions.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "#76869b", fontSize: 13 }}>Sin cambios aún</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e6eaf0" }}>
                    {["Fecha", "Usuario", "Ámbito", "Resumen", "Versión"].map((h, i) => (
                      <th key={h} style={{
                        textAlign: "left", padding: "10px 16px",
                        fontSize: 11.5, fontWeight: 700, color: "#76869b",
                        textTransform: "uppercase", letterSpacing: 0.4,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentVersions.map((v) => {
                    const scopeMeta = SCOPE_META.find((s) => s.scope === v.scope);
                    return (
                      <tr key={v.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b", whiteSpace: "nowrap" }}>
                          {new Date(v.createdAt).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#131c2e" }}>
                          {v.userName ?? "Sistema"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            fontSize: 11.5, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
                            background: scopeMeta?.bg ?? "#f1f5f9", color: scopeMeta?.color ?? "#64748b",
                          }}>
                            {SCOPE_LABELS[v.scope] ?? v.scope}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b", maxWidth: 300 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {v.rawPrompt.slice(0, 80)}{v.rawPrompt.length > 80 ? "…" : ""}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "#f1f5f9", color: "#64748b" }}>
                            V{v.versionNumber}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Missing config */}
          {incompleteCategories.length > 0 && (
            <div style={{ background: "#fff", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(239,68,68,0.15)", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle style={{ width: 16, height: 16, color: "#ef4444" }} />
                <span style={{ fontWeight: 800, fontSize: 14, color: "#ef4444" }}>Config. pendiente</span>
              </div>
              <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ margin: "0 0 8px", fontSize: 11.5, color: "#76869b" }}>
                  Categorías sin fecha o modo de juego:
                </p>
                {incompleteCategories.map((cat) => (
                  <Link key={cat.id} href={`/context/category/${cat.id}`} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 10px", borderRadius: 9, background: "#fef2f2",
                    border: "1px solid rgba(239,68,68,0.15)", textDecoration: "none",
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#131c2e" }}>{cat.name}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {!cat.startDate && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>Sin fecha</span>}
                      {!cat.gameModeId && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>Sin modo</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #e6eaf0" }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: "#131c2e" }}>Acciones rápidas</span>
            </div>
            <div style={{ padding: "8px 8px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { label: "Contexto de Organización", icon: Building2, href: "/context/organization" },
                { label: "Historial de contextos", icon: History, href: "/context/history" },
                { label: "Comparar versiones", icon: GitCompare, href: "/context/compare" },
                { label: "Simulador de impacto", icon: Target, href: "/context/impact-simulator" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="hover:bg-slate-50 transition-colors" style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 10px", borderRadius: 9, textDecoration: "none", color: "#131c2e",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon style={{ width: 14, height: 14, color: "#76869b" }} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                    </div>
                    <ArrowRight style={{ width: 13, height: 13, color: "#94a3b8" }} />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Priority hierarchy — PRESERVED */}
          <div style={{ background: "#f8fafc", border: "1px solid #e6eaf0", borderRadius: 14, padding: "16px 16px 14px" }}>
            <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase", color: "#76869b" }}>
              Jerarquía de prioridad (mayor → menor)
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {PRIORITY_LEVELS.map((label, i) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 99, flexShrink: 0,
                    background: i === 0 ? "#0d9488" : i === 1 ? "#3b82f6" : `rgba(100,116,139,${0.15 + (6 - i) * 0.1})`,
                    color: i <= 1 ? "#fff" : "#64748b",
                    display: "grid", placeItems: "center", fontSize: 9.5, fontWeight: 800,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: i <= 1 ? 700 : 500, color: i <= 1 ? "#131c2e" : "#64748b" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

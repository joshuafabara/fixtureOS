import { requireOrg } from "@/lib/auth/session";
import { getDashboardStats, getRecentActivity } from "@/lib/db/queries/dashboard";
import { db } from "@/lib/db";
import { tournaments, dryRuns, categories, teams, matches, fixtureVersions, courts, clubContacts } from "@/lib/db/schema";
import { eq, and, desc, asc, count, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { AlertTriangle, Zap, Download, Trophy, CalendarDays, Phone } from "lucide-react";

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function catColors(hex: string | null) {
  const h = hex ?? "#64748b";
  const [r, g, b] = hexToRgb(h);
  return { border: h, bg: `rgba(${r},${g},${b},0.11)`, text: h };
}

const ACTION_LABELS: Record<string, string> = {
  CREATE_TOURNAMENT: "creó torneo",
  APPROVE_DRY_RUN: "aprobó dry run",
  REJECT_DRY_RUN: "rechazó dry run",
  CREATE_CONTEXT_VERSION: "guardó contexto",
  UPDATE_CLUB_CONTACT: "actualizó contacto",
  PUBLISH_FIXTURE_DATE: "publicó fecha",
  CREATE_FIXTURE_VERSION: "creó versión",
};

export default async function DashboardPage() {
  const orgId = await requireOrg();
  const activeTournamentId = cookies().get("activeTournamentId")?.value ?? null;

  const allTournaments = await db
    .select({ id: tournaments.id, name: tournaments.name, status: tournaments.status })
    .from(tournaments)
    .where(eq(tournaments.organizationId, orgId))
    .orderBy(desc(tournaments.createdAt));

  const activeTournament =
    allTournaments.find((t) => t.id === activeTournamentId) ??
    allTournaments.find((t) => t.status === "active") ??
    allTournaments[0] ??
    null;

  const [stats, recentActivity] = await Promise.all([
    getDashboardStats(orgId),
    getRecentActivity(orgId, 8),
  ]);

  const pendingDryRuns = await db
    .select({ id: dryRuns.id, reason: dryRuns.reason })
    .from(dryRuns)
    .where(and(eq(dryRuns.organizationId, orgId), eq(dryRuns.status, "ready")))
    .orderBy(desc(dryRuns.createdAt))
    .limit(3);

  const [missingWaRow] = await db
    .select({ count: count() })
    .from(clubContacts)
    .where(and(eq(clubContacts.organizationId, orgId), isNull(clubContacts.whatsappNumber)));

  const missingWa = Number(missingWaRow?.count ?? 0);

  const incompleteCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.organizationId, orgId), eq(categories.isActiveForFixture, false)))
    .limit(3);

  let todayMatches: Array<{
    id: string; startTime: string | null;
    homeTeamName: string; awayTeamName: string;
    courtName: string; categoryName: string | null; categoryColorHex: string | null;
  }> = [];
  let todayCourtNames: string[] = [];

  if (activeTournament) {
    const [latestVersion] = await db
      .select({ id: fixtureVersions.id })
      .from(fixtureVersions)
      .where(and(
        eq(fixtureVersions.tournamentId, activeTournament.id),
        eq(fixtureVersions.organizationId, orgId),
      ))
      .orderBy(desc(fixtureVersions.versionNumber))
      .limit(1);

    if (latestVersion) {
      const today = new Date().toISOString().slice(0, 10);
      const rawMatches = await db
        .select({
          id: matches.id, startTime: matches.startTime,
          homeTeamId: matches.homeTeamId, awayTeamId: matches.awayTeamId,
          categoryName: categories.name, categoryColorHex: categories.colorHex,
          courtName: courts.name,
        })
        .from(matches)
        .leftJoin(categories, eq(matches.categoryId, categories.id))
        .leftJoin(courts, eq(matches.courtId, courts.id))
        .where(and(
          eq(matches.fixtureVersionId, latestVersion.id),
          eq(matches.scheduledDate, today),
        ))
        .orderBy(asc(courts.name), asc(matches.startTime));

      const allTeams = await db
        .select({ id: teams.id, name: teams.name })
        .from(teams)
        .where(eq(teams.organizationId, orgId));
      const teamMap = new Map(allTeams.map((t) => [t.id, t.name]));

      todayMatches = rawMatches.map((m) => ({
        id: m.id, startTime: m.startTime,
        homeTeamName: m.homeTeamId ? (teamMap.get(m.homeTeamId) ?? "?") : "?",
        awayTeamName: m.awayTeamId ? (teamMap.get(m.awayTeamId) ?? "?") : "?",
        courtName: m.courtName ?? "Sin cancha",
        categoryName: m.categoryName ?? null,
        categoryColorHex: m.categoryColorHex ?? null,
      }));

      todayCourtNames = [...new Set(rawMatches.map((m) => m.courtName).filter(Boolean))] as string[];
    }
  }

  let catProgress: Array<{ id: string; name: string; colorHex: string | null }> = [];
  if (activeTournament) {
    catProgress = await db
      .select({ id: categories.id, name: categories.name, colorHex: categories.colorHex })
      .from(categories)
      .where(and(
        eq(categories.tournamentId, activeTournament.id),
        eq(categories.organizationId, orgId),
      ))
      .orderBy(categories.name);
  }

  const todayLabel = new Date().toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });
  const capitalToday = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1);

  return (
    <div style={{ maxWidth: 1380, margin: "0 auto", padding: "24px 24px 48px", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.5, color: "#131c2e" }}>
            Centro de operaciones
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#76869b", fontWeight: 500 }}>
            {activeTournament?.name ?? "Sin torneo activo"}
            {allTournaments.length > 0 && ` · ${allTournaments.length} torneo${allTournaments.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/exports" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1px solid #d4dae3", background: "#fff", color: "#131c2e", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            <Download style={{ width: 14, height: 14 }} /> Exportar
          </a>
          <a href="/dry-run" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "none", background: "#0d9488", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            <Zap style={{ width: 14, height: 14 }} /> Nuevo Dry Run
          </a>
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatTile href="/dry-run" label="Dry runs pendientes" value={stats.pendingDryRuns} sub="Tap para revisar →" filled icon={<Zap style={{ width: 16, height: 16 }} />} />
        <StatTile href="/tournaments" label="Torneos activos" value={stats.activeTournaments} sub={`${allTournaments.length} en total`} icon={<Trophy style={{ width: 16, height: 16 }} />} accent="#0d9488" />
        <StatTile href="/fixture" label="Fechas publicadas" value={stats.publishedDates} sub="en este torneo" icon={<CalendarDays style={{ width: 16, height: 16 }} />} accent="#059669" />
        <StatTile href="/clubs?whatsapp=missing" label="Sin WhatsApp" value={missingWa} sub="clubes sin contacto" icon={<Phone style={{ width: 16, height: 16 }} />} accent={missingWa > 0 ? "#f59e0b" : "#64748b"} warn={missingWa > 0} />
      </div>

      {/* Main + right rail */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" }}>
        {/* Court board */}
        <div style={{ background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: "#131c2e" }}>En cancha</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#76869b", padding: "3px 8px", background: "#f1f5f9", borderRadius: 99 }}>
                {todayMatches.length} partido{todayMatches.length !== 1 ? "s" : ""}
              </span>
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#76869b" }}>{capitalToday}</span>
          </div>

          {todayCourtNames.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#76869b" }}>
              <CalendarDays style={{ width: 36, height: 36, margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>Sin partidos hoy</p>
              <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                {activeTournament ? "Genera un fixture para ver partidos aquí." : "Selecciona un torneo activo para continuar."}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(todayCourtNames.length, 4)}, minmax(0,1fr))`, gap: 10 }}>
              {todayCourtNames.map((courtName) => {
                const courtMatches = todayMatches
                  .filter((m) => m.courtName === courtName)
                  .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
                return (
                  <div key={courtName} style={{ background: "#f8fafc", border: "1px solid #e6eaf0", borderRadius: 11, padding: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid #e6eaf0", color: "#131c2e" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="2.5" />
                      </svg>
                      {courtName}
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#76869b", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                        {courtMatches.length}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {courtMatches.map((m) => {
                        const cs = catColors(m.categoryColorHex);
                        return (
                          <div key={m.id} style={{ background: "#fff", border: "1px solid #e6eaf0", borderLeft: `3px solid ${cs.border}`, borderRadius: 8, padding: "8px 9px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>
                                {m.startTime?.slice(0, 5) ?? "—"}
                              </span>
                              {m.categoryName && (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: cs.bg, color: cs.text }}>
                                  {m.categoryName}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, color: "#131c2e" }}>{m.homeTeamName}</div>
                            <div style={{ fontSize: 11.5, color: "#76869b", lineHeight: 1.3 }}>vs {m.awayTeamName}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Por revisar */}
          <div style={{ background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", borderBottom: "1px solid #e6eaf0" }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: "#131c2e" }}>Por revisar</span>
              <a href="/dry-run" style={{ fontSize: 12, fontWeight: 700, color: "#0d9488", textDecoration: "none" }}>Ver todo</a>
            </div>
            <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              {pendingDryRuns.map((dr) => (
                <ReviewItem key={dr.id} sev="info" title={dr.reason ?? "Dry run pendiente"} sub="Revisar propuesta →" href={`/dry-run/${dr.id}`} />
              ))}
              {missingWa > 0 && (
                <ReviewItem sev="warn" title={`${missingWa} club${missingWa > 1 ? "es" : ""} sin WhatsApp`} sub="Completar contactos" href="/clubs?whatsapp=missing" />
              )}
              {incompleteCategories.map((c) => (
                <ReviewItem key={c.id} sev="crit" title={`Cat. incompleta: ${c.name}`} sub="Configurar modo de juego" href={`/context/category/${c.id}`} />
              ))}
              {pendingDryRuns.length === 0 && missingWa === 0 && incompleteCategories.length === 0 && (
                <div style={{ padding: "18px 0", textAlign: "center", color: "#76869b", fontSize: 13 }}>Todo al día ✓</div>
              )}
            </div>
          </div>

          {/* Avance por categoría */}
          {catProgress.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #e6eaf0" }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: "#131c2e" }}>Avance por categoría</span>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 11 }}>
                {catProgress.map((c) => {
                  const dot = c.colorHex ?? "#0d9488";
                  return (
                    <div key={c.id}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#131c2e" }}>
                          <span style={{ width: 8, height: 8, borderRadius: 99, background: dot, display: "inline-block" }} />
                          {c.name}
                        </span>
                        <a href={`/context/category/${c.id}`} style={{ fontSize: 11, fontWeight: 700, color: "#0d9488", textDecoration: "none" }}>
                          Config.
                        </a>
                      </div>
                      <div style={{ height: 6, borderRadius: 99, background: "#f1f5f9" }}>
                        <div style={{ width: "0%", height: "100%", borderRadius: 99, background: dot }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actividad reciente */}
          <div style={{ background: "#fff", border: "1px solid #e6eaf0", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #e6eaf0" }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: "#131c2e" }}>Actividad reciente</span>
            </div>
            <div style={{ padding: "8px 16px 14px" }}>
              {recentActivity.length === 0 ? (
                <div style={{ padding: "18px 0", textAlign: "center", color: "#76869b", fontSize: 13 }}>Sin actividad aún</div>
              ) : (
                recentActivity.slice(0, 6).map((log, i) => (
                  <div key={log.id} style={{ display: "flex", gap: 10, padding: "7px 0" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: "#0d9488", flexShrink: 0, marginTop: 4 }} />
                      {i < Math.min(recentActivity.length - 1, 5) && (
                        <span style={{ width: 2, flex: 1, background: "#e6eaf0", marginTop: 2 }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 4, minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12.5, lineHeight: 1.4, color: "#131c2e" }}>
                        <strong style={{ fontWeight: 700 }}>{log.userName ?? "Sistema"}</strong>{" "}
                        <span style={{ color: "#64748b" }}>{ACTION_LABELS[log.action] ?? log.action}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {new Date(log.createdAt).toLocaleDateString("es-EC", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ href, label, value, sub, filled, icon, accent, warn }: {
  href: string; label: string; value: number; sub: string;
  filled?: boolean; icon: React.ReactNode; accent?: string; warn?: boolean;
}) {
  return (
    <a href={href} style={{
      display: "block", textDecoration: "none", padding: "18px 20px", borderRadius: 14,
      background: filled ? "linear-gradient(150deg, #ea580c 0%, #0d9488 100%)" : "#fff",
      border: filled ? "none" : `1px solid ${warn ? "#fcd34d" : "#e6eaf0"}`,
      boxShadow: filled ? "0 10px 30px rgba(13,148,136,0.28)" : "none",
      fontFamily: "var(--font-sans)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", background: filled ? "rgba(255,255,255,0.2)" : "#f1f5f9", color: filled ? "#fff" : (accent ?? "#64748b") }}>
          {icon}
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: filled ? "rgba(255,255,255,0.85)" : "#64748b" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 34, fontWeight: 700, letterSpacing: -1, lineHeight: 1, color: filled ? "#fff" : "#131c2e" }}>{value}</div>
      <div style={{ fontSize: 12, marginTop: 5, color: filled ? "rgba(255,255,255,0.8)" : "#76869b" }}>{sub}</div>
    </a>
  );
}

function ReviewItem({ sev, title, sub, href }: { sev: "crit" | "warn" | "info"; title: string; sub: string; href: string }) {
  const color = sev === "crit" ? "#ef4444" : sev === "warn" ? "#f59e0b" : "#0d9488";
  return (
    <a href={href} style={{ display: "flex", gap: 10, padding: "10px 11px", borderRadius: 9, background: "#f8fafc", border: "1px solid #e6eaf0", borderLeft: `3px solid ${color}`, cursor: "pointer", textDecoration: "none", color: "inherit", alignItems: "center" }}>
      <AlertTriangle style={{ width: 15, height: 15, color, flexShrink: 0 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, color: "#131c2e" }}>{title}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{sub}</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
    </a>
  );
}

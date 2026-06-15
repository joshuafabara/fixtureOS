"use client";
import { signOut } from "next-auth/react";
import { Trophy, ChevronDown, LogOut, Settings, Bell, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Tournament = { id: string; name: string; status: string };

type TopbarProps = {
  orgName: string;
  userName: string;
  tournaments: Tournament[];
  activeTournamentId: string | null;
  activeTournamentName: string | null;
};

export function Topbar({ orgName, userName, tournaments, activeTournamentId, activeTournamentName }: TopbarProps) {
  const router = useRouter();
  const [userOpen, setUserOpen] = useState(false);
  const [tourneyOpen, setTourneyOpen] = useState(false);
  const tourneyRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (tourneyRef.current && !tourneyRef.current.contains(e.target as Node)) setTourneyOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  async function switchTournament(id: string) {
    setTourneyOpen(false);
    await fetch("/api/active-tournament", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId: id }),
    });
    router.refresh();
  }

  const orgInitials = orgName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const userInitials = userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header style={{
      height: 58, flexShrink: 0, borderBottom: "1px solid #e6eaf0",
      background: "#fff", display: "flex", alignItems: "center",
      gap: 10, padding: "0 20px", zIndex: 20,
    }}>
      {/* Org pill */}
      <button style={{
        display: "flex", alignItems: "center", gap: 8, padding: "7px 12px",
        borderRadius: 9, border: "1px solid #e6eaf0", background: "#fff",
        fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)",
        color: "#131c2e", whiteSpace: "nowrap",
      }}>
        <span style={{
          width: 20, height: 20, borderRadius: 5, background: "#1e293b",
          color: "#fff", display: "grid", placeItems: "center",
          fontSize: 10, fontWeight: 800, flexShrink: 0, letterSpacing: 0,
        }}>{orgInitials}</span>
        {orgName}
        <ChevronDown style={{ width: 13, height: 13, color: "#94a3b8" }} />
      </button>

      {/* Separator */}
      <span style={{ color: "#d1d5db", fontSize: 18, userSelect: "none" }}>/</span>

      {/* Tournament pill + dropdown */}
      <div ref={tourneyRef} style={{ position: "relative" }}>
        <button
          onClick={() => setTourneyOpen((o) => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 12px",
            borderRadius: 9,
            border: activeTournamentName ? "1px solid rgba(13,148,136,0.25)" : "1px solid #e6eaf0",
            background: activeTournamentName ? "rgba(13,148,136,0.08)" : "#f8fafc",
            fontSize: 13, fontWeight: 700,
            color: activeTournamentName ? "#0f766e" : "#76869b",
            cursor: "pointer", fontFamily: "var(--font-sans)", whiteSpace: "nowrap",
          }}
        >
          <Trophy style={{ width: 14, height: 14 }} />
          {activeTournamentName ?? "Sin torneo"}
          <ChevronDown style={{ width: 13, height: 13 }} />
        </button>

        {tourneyOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
            background: "#fff", border: "1px solid #e6eaf0", borderRadius: 12, padding: "6px 0",
            minWidth: 260, boxShadow: "0 8px 24px rgba(15,23,42,.12)",
          }}>
            <p style={{
              fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
              color: "#94a3b8", padding: "4px 14px 8px",
            }}>
              Torneos
            </p>
            {tournaments.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: 13, color: "#76869b" }}>Sin torneos</div>
            ) : tournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => switchTournament(t.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", border: "none", cursor: "pointer", textAlign: "left",
                  background: t.id === activeTournamentId ? "rgba(13,148,136,0.08)" : "transparent",
                  color: t.id === activeTournamentId ? "#0f766e" : "#131c2e",
                  fontFamily: "var(--font-sans)",
                  fontWeight: t.id === activeTournamentId ? 700 : 500, fontSize: 13,
                }}
                onMouseEnter={(e) => { if (t.id !== activeTournamentId) e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={(e) => { if (t.id !== activeTournamentId) e.currentTarget.style.background = "transparent"; }}
              >
                <Trophy style={{ width: 13, height: 13, color: "#94a3b8", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{t.name}</span>
                {t.id === activeTournamentId && (
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: "#0d9488", flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
        borderRadius: 9, background: "#f8fafc", border: "1px solid #e6eaf0",
        color: "#94a3b8", fontSize: 13, minWidth: 200,
      }}>
        <Search style={{ width: 14, height: 14 }} />
        <span>Buscar partido, club…</span>
      </div>

      {/* Bell */}
      <button style={{
        width: 36, height: 36, borderRadius: 9, border: "1px solid #e6eaf0",
        background: "#fff", cursor: "pointer", display: "grid", placeItems: "center", color: "#64748b",
      }}>
        <Bell style={{ width: 16, height: 16 }} />
      </button>

      {/* User */}
      <div ref={userRef} style={{ position: "relative" }}>
        <button
          onClick={() => setUserOpen((o) => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "5px 10px",
            borderRadius: 9, border: "1px solid #e6eaf0", background: "#fff",
            cursor: "pointer", fontFamily: "var(--font-sans)",
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 99,
            background: "linear-gradient(135deg, #1e293b, #475569)",
            color: "#fff", display: "grid", placeItems: "center",
            fontWeight: 800, fontSize: 12,
          }}>
            {userInitials}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#131c2e" }}>{userName}</span>
          <ChevronDown style={{ width: 13, height: 13, color: "#94a3b8" }} />
        </button>

        {userOpen && (
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
            width: 200, borderRadius: 12, border: "1px solid #e6eaf0", background: "#fff",
            boxShadow: "0 8px 24px rgba(15,23,42,.12)", padding: "6px 0",
          }}>
            <a
              href="/settings/organization"
              onClick={() => setUserOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", fontSize: 13, color: "#131c2e", textDecoration: "none", fontWeight: 500 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Settings style={{ width: 14, height: 14, color: "#64748b" }} /> Configuración
            </a>
            <div style={{ height: 1, background: "#e6eaf0", margin: "4px 0" }} />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", fontSize: 13, color: "#ef4444",
                border: "none", background: "transparent", cursor: "pointer",
                fontFamily: "var(--font-sans)", textAlign: "left", fontWeight: 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut style={{ width: 14, height: 14 }} /> Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Trophy, Layers, Users, Building2, MessageSquare,
  MapPin, Settings, FileText, Download, ChevronLeft, ChevronRight,
  Zap, GitCompare, ClipboardList, Sliders, Calendar,
} from "lucide-react";

const NAV = [
  { label: "Panel", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Torneos", icon: Trophy, href: "/tournaments" },
  { label: "Fixture", icon: Layers, href: "/fixture" },
  { label: "Dry Run", icon: Zap, href: "/dry-run" },
  {
    label: "Contexto",
    icon: Sliders,
    href: "/context",
    children: [
      { label: "Panel de Contexto", href: "/context" },
      { label: "Organización", href: "/context/organization" },
      { label: "Historial", href: "/context/history" },
      { label: "Comparar", href: "/context/compare" },
      { label: "Simulador", href: "/context/impact-simulator" },
    ],
  },
  { label: "Clubes", icon: Building2, href: "/clubs" },
  { label: "Comunicaciones", icon: MessageSquare, href: "/communications" },
  {
    label: "Configuración",
    icon: Settings,
    href: "/settings",
    children: [
      { label: "Canchas", href: "/settings/courts" },
      { label: "Usuarios", href: "/settings/users" },
      { label: "Organización", href: "/settings/organization" },
    ],
  },
];

// Lightning bolt SVG icon (matches design)
function LightningIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h7l-1 8 10-12h-7z" fill="white" stroke="none" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(["Contexto", "Configuración"]);

  function isActive(href: string) {
    if (href === "/fixture") return pathname.startsWith("/fixture");
    if (href === "/context") return pathname.startsWith("/context");
    if (href === "/settings") return pathname.startsWith("/settings");
    return pathname === href || pathname.startsWith(href + "/");
  }

  function toggleGroup(label: string) {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r transition-all duration-200 h-screen sticky top-0",
        "bg-sidebar border-sidebar-border",
        collapsed ? "w-[64px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-4 border-b border-sidebar-border min-h-[64px]",
        collapsed && "justify-center px-2"
      )}>
        {/* Logo icon */}
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: "#0d9488",
          display: "grid", placeItems: "center",
          boxShadow: "rgba(234,88,12,0.5) 0px 4px 14px",
          color: "#fff",
        }}>
          <LightningIcon size={18} />
        </div>
        {!collapsed && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 800, letterSpacing: -0.4, userSelect: "none" }}>
            <span style={{ color: "#ffffff" }}>fixture</span>
            <span style={{ color: "#ea580c" }}>OS</span>
          </span>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              marginLeft: "auto", width: 30, height: 30, borderRadius: 8, cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "rgb(159,176,201)",
              display: "grid", placeItems: "center", flexShrink: 0,
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            style={{
              position: "absolute", right: -12, top: 20, width: 24, height: 24, borderRadius: 6, border: "1px solid hsl(217 33% 17%)",
              background: "hsl(222 47% 11%)", color: "hsl(213 31% 60%)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10,
            }}
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {!collapsed && (
          <p style={{
            fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase",
            color: "hsl(215 20% 40%)", paddingLeft: 12, marginBottom: 8, marginTop: 0,
          }}>
            Menú
          </p>
        )}
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const groupOpen = openGroups.includes(item.label);

          const activeStyle = active ? {
            background: "linear-gradient(90deg, rgba(234,88,12,0.22) 0%, rgba(234,88,12,0.05) 100%)",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: 13.5,
          } as React.CSSProperties : {};

          return (
            <div key={item.href}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => !collapsed && toggleGroup(item.label)}
                    className={cn(
                      "sidebar-link w-full",
                      collapsed && "justify-center px-0"
                    )}
                    style={activeStyle}
                  >
                    {active && (
                      <span style={{
                        position: "absolute", left: 0, top: "16%", bottom: "16%",
                        width: 3, borderRadius: "0 3px 3px 0",
                        background: "#0d9488",
                        boxShadow: "0 0 10px rgba(13,148,136,0.7)",
                      }} />
                    )}
                    <Icon className="h-4 w-4 shrink-0" style={active ? { color: "#0d9488" } : undefined} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronRight
                          className={cn("h-3 w-3 transition-transform", groupOpen && "rotate-90")}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && groupOpen && (
                    <div className="ml-7 mt-0.5 space-y-0.5 mb-1">
                      {item.children!.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center rounded-md px-2 py-1.5 text-xs transition-colors",
                            pathname === child.href
                              ? "text-sidebar-primary font-semibold"
                              : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "sidebar-link",
                    collapsed && "justify-center px-0"
                  )}
                  style={activeStyle}
                >
                  {active && (
                    <span style={{
                      position: "absolute", left: 0, top: "16%", bottom: "16%",
                      width: 3, borderRadius: "0 3px 3px 0",
                      background: "#0d9488",
                      boxShadow: "0 0 10px rgba(13,148,136,0.7)",
                    }} />
                  )}
                  <Icon className="h-4 w-4 shrink-0" style={active ? { color: "#0d9488" } : undefined} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom collapse (only when expanded) */}
      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(true)}
            className="flex items-center justify-center w-full rounded-lg p-2 transition-colors text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent text-xs gap-1.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Contraer
          </button>
        </div>
      )}
    </aside>
  );
}

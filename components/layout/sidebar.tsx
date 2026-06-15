"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Trophy, Calendar, Layers, Users, Building2, MessageSquare,
  MapPin, Settings, FileText, Download, ChevronLeft, ChevronRight,
  Zap, GitCompare, ClipboardList, Sliders,
} from "lucide-react";

const NAV = [
  { label: "Panel", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Torneos", icon: Trophy, href: "/tournaments" },
  { label: "Fixture", icon: Calendar, href: "/fixture" },
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
  { label: "Importar", icon: Layers, href: "/import" },
  { label: "Posiciones", icon: ClipboardList, href: "/standings/import" },
  { label: "Exportar", icon: Download, href: "/exports" },
  { label: "Auditoría", icon: FileText, href: "/audit" },
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
      <div className={cn("flex items-center gap-2 px-4 py-4 border-b border-sidebar-border min-h-[56px]", collapsed && "justify-center px-2")}>
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-xs">FO</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-sm text-sidebar-foreground">FixtureOS</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const groupOpen = openGroups.includes(item.label);

          return (
            <div key={item.href}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => !collapsed && toggleGroup(item.label)}
                    className={cn(
                      "sidebar-link w-full",
                      active && "active",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronRight
                          className={cn(
                            "h-3 w-3 transition-transform",
                            groupOpen && "rotate-90"
                          )}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && groupOpen && (
                    <div className="ml-7 mt-0.5 space-y-0.5">
                      {item.children!.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center rounded-md px-2 py-1.5 text-xs transition-colors",
                            pathname === child.href
                              ? "text-sidebar-primary font-medium bg-sidebar-primary/10"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
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
                    active && "active",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "flex items-center justify-center w-full rounded-md p-2 transition-colors",
            "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="text-xs">Contraer</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

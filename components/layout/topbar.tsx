"use client";
import { signOut } from "next-auth/react";
import { Trophy, ChevronDown, LogOut, User, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TopbarProps = {
  orgName: string;
  userName: string;
  tournamentName?: string;
};

export function Topbar({ orgName, userName, tournamentName }: TopbarProps) {
  const [userOpen, setUserOpen] = useState(false);

  return (
    <header className="flex items-center gap-3 h-14 px-4 border-b bg-card sticky top-0 z-20">
      {/* Org + Tournament context */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-sm font-semibold text-foreground truncate">{orgName}</span>
        {tournamentName && (
          <>
            <span className="text-muted-foreground">/</span>
            <div className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              <Trophy className="h-3.5 w-3.5" />
              <span className="truncate max-w-[160px]">{tournamentName}</span>
              <ChevronDown className="h-3 w-3" />
            </div>
          </>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setUserOpen((o) => !o)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">
              {userName.slice(0, 1).toUpperCase()}
            </span>
          </div>
          <span className="hidden sm:block text-sm font-medium">{userName}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>

        {userOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
            <div className={cn(
              "absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border bg-popover shadow-lg py-1"
            )}>
              <Link
                href="/settings/organization"
                onClick={() => setUserOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Settings className="h-4 w-4" />
                Configuración
              </Link>
              <div className="border-t my-1" />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors w-full text-left text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ClubsSearchBar({
  defaultQ,
  defaultWhatsapp,
}: {
  defaultQ?: string;
  defaultWhatsapp?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQ ?? "");
  const [whatsapp, setWhatsapp] = useState(defaultWhatsapp ?? "");

  function applyFilters(newQ: string, newWhatsapp: string) {
    const params = new URLSearchParams();
    if (newQ) params.set("q", newQ);
    if (newWhatsapp) params.set("whatsapp", newWhatsapp);
    router.push(`/clubs?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clubes..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters(q, whatsapp)}
          className="pl-9"
        />
        {q && (
          <button
            onClick={() => { setQ(""); applyFilters("", whatsapp); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">WhatsApp:</span>
        {(["", "present", "missing"] as const).map((val) => (
          <Button
            key={val}
            variant="outline"
            size="sm"
            className={cn(
              "text-xs h-8",
              whatsapp === val && "bg-primary text-primary-foreground border-primary"
            )}
            onClick={() => { setWhatsapp(val); applyFilters(q, val); }}
          >
            {val === "" ? "Todos" : val === "present" ? "Con número" : "Sin número"}
          </Button>
        ))}
      </div>
    </div>
  );
}

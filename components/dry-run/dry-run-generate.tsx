"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, AlertTriangle } from "lucide-react";

type Props = {
  tournamentId: string;
  tournamentName: string;
  eligibleCount: number;
};

export function DryRunGenerate({ tournamentId, tournamentName, eligibleCount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (eligibleCount === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dry-run/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al generar");
      router.push(`/dry-run/${data.dryRunId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar dry run");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <Button
        onClick={handleGenerate}
        disabled={loading || eligibleCount === 0}
        className="w-full"
        size="lg"
      >
        <Zap className="h-4 w-4" />
        {loading
          ? "Generando fixture..."
          : eligibleCount === 0
          ? "Sin categorías elegibles"
          : `Generar Dry Run · ${tournamentName}`}
      </Button>
      {eligibleCount > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {eligibleCount} categor{eligibleCount === 1 ? "ía elegible" : "ías elegibles"} · el resultado se mostrará antes de confirmar.
        </p>
      )}
    </div>
  );
}

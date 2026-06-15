"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, AlertTriangle, CheckCircle, Lock } from "lucide-react";

type Props = {
  dryRunId: string;
  status: string;
  hasConflicts: boolean;
  totalChanges: number;
};

export function DryRunActions({ dryRunId, status, hasConflicts, totalChanges }: Props) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [done, setDone] = useState<{ versionNumber: number; matchesCreated: number } | null>(null);
  const [error, setError] = useState("");

  const isReady = status === "ready";
  const canApprove = isReady && !hasConflicts;

  async function handleApprove() {
    if (!canApprove) return;
    setApproving(true);
    setError("");
    try {
      const res = await fetch(`/api/dry-run/${dryRunId}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al aprobar");
      setDone({ versionNumber: data.versionNumber, matchesCreated: data.matchesCreated });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al aprobar");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    setRejecting(true);
    setError("");
    try {
      const res = await fetch(`/api/dry-run/${dryRunId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Error al rechazar");
      router.push("/dry-run");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al rechazar");
    } finally {
      setRejecting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 grid place-items-center">
          <CheckCircle className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Versión V{done.versionNumber} creada</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Se crearon {done.matchesCreated} partidos. Las versiones anteriores se conservan en el historial.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/fixture")}>Ver fixture</Button>
          <Button onClick={() => router.push("/context")}>Volver al contexto</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Gate banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
        hasConflicts
          ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
          : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
      }`}>
        {hasConflicts
          ? <Lock className="h-5 w-5 text-red-600 shrink-0" />
          : <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />}
        <div className="flex-1">
          <p className={`font-bold text-sm ${hasConflicts ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
            {hasConflicts
              ? "Aprobación bloqueada · hay conflictos sin resolver"
              : "Listo para aprobar · sin conflictos"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasConflicts
              ? "Resuelve los conflictos en edición manual o genera un nuevo dry run."
              : `${totalChanges} cambios propuestos. Los partidos bloqueados y overrides manuales se conservan.`}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={handleReject}
          disabled={rejecting || !isReady}
          className="flex-1"
        >
          <X className="h-4 w-4" />
          {rejecting ? "Rechazando..." : "Rechazar"}
        </Button>
        <Button
          onClick={handleApprove}
          disabled={!canApprove || approving}
          className="flex-1"
          title={hasConflicts ? "Resuelve los conflictos primero" : ""}
        >
          <Check className="h-4 w-4" />
          {approving ? "Aprobando..." : "Aprobar y crear versión"}
        </Button>
      </div>
    </div>
  );
}

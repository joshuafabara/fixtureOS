"use client";
import { useState } from "react";
import {
  ShieldCheck, ShieldAlert, ShieldX, Sparkles, ChevronDown, ChevronUp,
  AlertTriangle, Info, XCircle, CheckCircle, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AuditReport, AuditViolation } from "@/lib/ai/fixture-auditor";

type Props = {
  dryRunId: string;
  initialReport: AuditReport | null;
  onReportChange?: (report: AuditReport | null) => void;
};

const STATUS_CONFIG = {
  pass: {
    icon: ShieldCheck,
    label: "Aprobado por IA",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    badge: "success" as const,
  },
  warning: {
    icon: ShieldAlert,
    label: "Advertencias detectadas",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    badge: "warning" as const,
  },
  fail: {
    icon: ShieldX,
    label: "Bloqueado por IA",
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    badge: "error" as const,
  },
};

function ViolationItem({ v }: { v: AuditViolation }) {
  const [expanded, setExpanded] = useState(false);
  const icon =
    v.severity === "error" ? <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
    : v.severity === "warning" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
    : <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />;

  return (
    <div className="border rounded-lg overflow-hidden text-xs">
      <button
        className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        {icon}
        <span className="flex-1 font-medium leading-snug">{v.explanation_es}</span>
        {expanded ? <ChevronUp className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-3 pb-2 space-y-1 border-t bg-muted/20">
          <p className="text-muted-foreground mt-1.5"><span className="font-semibold">Corrección:</span> {v.recommended_fix_es}</p>
          {v.machine_recommendation.action !== "none" && (
            <p className="text-muted-foreground"><span className="font-semibold">Acción sugerida:</span> <code className="bg-muted px-1 rounded">{v.machine_recommendation.action}</code></p>
          )}
          {v.affected_match_ids.length > 0 && (
            <p className="text-muted-foreground font-mono opacity-60">
              Partidos: {v.affected_match_ids.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function AuditPanel({ dryRunId, initialReport, onReportChange }: Props) {
  const [report, setReport] = useState<AuditReport | null>(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  async function runAudit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/fixtures/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRunId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al ejecutar auditoría");
      const r = data.report as AuditReport;
      setReport(r);
      onReportChange?.(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (!report) {
    return (
      <div className="rounded-xl border border-dashed p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <span className="text-sm font-semibold">Auditoría IA</span>
        </div>
        <p className="text-xs text-muted-foreground">
          El auditor IA verifica que el fixture propuesto cumple con todas las reglas de contexto
          antes de aprobar.
        </p>
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
        <Button size="sm" className="w-full" onClick={runAudit} disabled={loading}>
          {loading ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analizando…</>
          ) : (
            <><Sparkles className="h-3.5 w-3.5" /> Ejecutar Auditoría IA</>
          )}
        </Button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[report.status];
  const Icon = cfg.icon;
  const errors = report.violations.filter((v) => v.severity === "error");
  const warnings = report.violations.filter((v) => v.severity === "warning");
  const displayed = showAll ? report.violations : report.violations.slice(0, 3);

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${cfg.bg}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${cfg.color}`} />
          <span className="text-sm font-semibold">Auditoría IA</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={cfg.badge} className="text-xs">{cfg.label}</Badge>
          <span className="text-xs text-muted-foreground">
            {Math.round(report.confidence * 100)}% confianza
          </span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-muted-foreground">{report.summary_es}</p>

      {/* Violation counts */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="flex items-center gap-3 text-xs">
          {errors.length > 0 && (
            <span className="flex items-center gap-1 text-red-600 font-semibold">
              <XCircle className="h-3 w-3" /> {errors.length} error{errors.length > 1 ? "es" : ""}
            </span>
          )}
          {warnings.length > 0 && (
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <AlertTriangle className="h-3 w-3" /> {warnings.length} advertencia{warnings.length > 1 ? "s" : ""}
            </span>
          )}
          {report.approved_constraints.length > 0 && (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle className="h-3 w-3" /> {report.approved_constraints.length} OK
            </span>
          )}
        </div>
      )}

      {/* Violations */}
      {report.violations.length > 0 && (
        <div className="space-y-1.5">
          {displayed.map((v, i) => <ViolationItem key={i} v={v} />)}
          {report.violations.length > 3 && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground underline w-full text-center py-1"
              onClick={() => setShowAll((s) => !s)}
            >
              {showAll ? "Ver menos" : `Ver ${report.violations.length - 3} más…`}
            </button>
          )}
        </div>
      )}

      {/* Missing interpretations */}
      {report.missing_interpretations.length > 0 && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2.5 space-y-1">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Requiere verificación</p>
          {report.missing_interpretations.map((m, i) => (
            <p key={i} className="text-xs text-blue-700 dark:text-blue-300">{m.issue_es}</p>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Re-run button */}
      <button
        className="text-xs text-muted-foreground hover:text-foreground underline"
        onClick={runAudit}
        disabled={loading}
      >
        {loading ? "Analizando…" : "Volver a auditar"}
      </button>
    </div>
  );
}

"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, ShieldAlert, ShieldX, Sparkles, ChevronDown, ChevronUp,
  AlertTriangle, Info, XCircle, CheckCircle, Loader2, ArrowRight, Clock, MapPin, Target,
  Wand2, Send, Check, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AuditReport, AuditViolation, MachineAction } from "@/lib/ai/fixture-auditor";
import type { MatchPatch } from "@/lib/ai/fixture-editor";

type Props = {
  dryRunId: string;
  initialReport: AuditReport | null;
  onReportChange?: (report: AuditReport | null) => void;
  onPatchesApplied?: () => void;
};

const ACTION_LABELS: Partial<Record<MachineAction, { label: string; icon: React.ReactNode }>> = {
  change_time: { label: "Editar horario", icon: <Clock className="h-3 w-3" /> },
  change_court: { label: "Cambiar cancha", icon: <MapPin className="h-3 w-3" /> },
  move_match: { label: "Mover partido", icon: <ArrowRight className="h-3 w-3" /> },
  swap_match: { label: "Intercambiar", icon: <ArrowRight className="h-3 w-3" /> },
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

function ViolationItem({ v, dryRunId }: { v: AuditViolation; dryRunId: string }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const icon =
    v.severity === "error" ? <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
    : v.severity === "warning" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
    : <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />;

  const action = v.machine_recommendation?.action;
  const actionCfg = action && action !== "none" && action !== "ask_user" && action !== "regenerate"
    ? ACTION_LABELS[action]
    : null;

  const explanationText = v.explanation_es?.trim();
  const fixText = v.recommended_fix_es?.trim();

  return (
    <div className="border rounded-lg overflow-hidden text-xs">
      <button
        className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        {icon}
        <span className="flex-1 font-medium leading-snug">
          {explanationText || <span className="text-muted-foreground italic">Sin descripción</span>}
        </span>
        {expanded ? <ChevronUp className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t bg-muted/20">
          {fixText && (
            <p className="text-muted-foreground mt-1.5">
              <span className="font-semibold">Corrección:</span> {fixText}
            </p>
          )}
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            {v.affected_match_ids?.slice(0, 5).map((id, i) => (
              <button
                key={id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors text-muted-foreground text-[10px] font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent("audit-focus-match", { detail: id }));
                }}
              >
                <Target className="h-3 w-3" />
                {(v.affected_match_ids?.length ?? 0) > 1 ? `Partido ${i + 1}` : "Ver partido"}
              </button>
            ))}
            {(v.affected_match_ids?.length ?? 0) > 5 && (
              <span className="text-[10px] text-muted-foreground">+{v.affected_match_ids.length - 5} más</span>
            )}
            {actionCfg && (
              <button
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 transition-colors font-medium text-[10px]"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/fixture?editMatch=${v.affected_match_ids[0] ?? ""}`);
                }}
              >
                {actionCfg.icon}
                {actionCfg.label}
              </button>
            )}
            <button
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors text-muted-foreground text-[10px]"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dry-run/${dryRunId}/edit`);
              }}
            >
              <ArrowRight className="h-3 w-3" />
              Ir a edición manual
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AuditPanel({ dryRunId, initialReport, onReportChange, onPatchesApplied }: Props) {
  const [report, setReport] = useState<AuditReport | null>(initialReport);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  // AI editor state
  const [aiRequest, setAiRequest] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    patches: MatchPatch[];
    summary_es: string;
  } | null>(null);
  const [selectedPatches, setSelectedPatches] = useState<Set<number>>(new Set());
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function requestAiEdit() {
    if (!aiRequest.trim()) return;
    setAiLoading(true);
    setAiSuggestions(null);
    setApplyResult(null);
    try {
      const res = await fetch(`/api/dry-run/${dryRunId}/ai-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: aiRequest }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setAiSuggestions(data);
      setSelectedPatches(new Set(data.patches.map((_: MatchPatch, i: number) => i)));
    } catch (e) {
      setApplyResult(e instanceof Error ? e.message : "Error al procesar solicitud");
    } finally {
      setAiLoading(false);
    }
  }

  async function applySelectedPatches() {
    if (!aiSuggestions) return;
    const toApply = aiSuggestions.patches.filter((_, i) => selectedPatches.has(i));
    if (toApply.length === 0) return;
    setApplyLoading(true);
    try {
      const res = await fetch(`/api/dry-run/${dryRunId}/apply-patch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patches: toApply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al aplicar cambios");
      setApplyResult(`${data.applied.length} cambio(s) aplicado(s). Recarga la página para ver el resultado.`);
      setAiSuggestions(null);
      setAiRequest("");
      onPatchesApplied?.();
    } catch (e) {
      setApplyResult(e instanceof Error ? e.message : "Error al aplicar cambios");
    } finally {
      setApplyLoading(false);
    }
  }

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
      window.dispatchEvent(new CustomEvent("audit-report-updated", { detail: r }));
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
          {displayed.map((v, i) => <ViolationItem key={i} v={v} dryRunId={dryRunId} />)}
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

      {/* Suggested fixes — actionable recommendations from violations */}
      {report.violations.some((v) => v.recommended_fix_es?.trim()) && (
        <div className="rounded-lg border bg-background p-2.5 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Wand2 className="h-3 w-3 text-brand-500" /> Correcciones sugeridas
          </p>
          {report.violations
            .filter((v) => v.recommended_fix_es?.trim())
            .slice(0, 5)
            .map((v, i) => {
              const canApply = Boolean(
                v.machine_recommendation?.action === "change_time" &&
                v.machine_recommendation?.patch &&
                (v.machine_recommendation.patch as Record<string, unknown>).newStartTime
              );
              return (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-0.5 shrink-0">
                    {v.severity === "error"
                      ? <XCircle className="h-3 w-3 text-red-500" />
                      : <AlertTriangle className="h-3 w-3 text-amber-500" />}
                  </span>
                  <span className="flex-1 leading-snug">{v.recommended_fix_es}</span>
                  {canApply && (
                    <button
                      className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 transition-colors"
                      onClick={async () => {
                        const patch = v.machine_recommendation.patch as Record<string, unknown>;
                        for (const id of v.affected_match_ids ?? []) {
                          await fetch(`/api/dry-run/${dryRunId}/apply-patch`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              patches: [{ matchId: id, changes: { startTime: patch.newStartTime }, explanation_es: v.recommended_fix_es }],
                            }),
                          });
                        }
                        onPatchesApplied?.();
                      }}
                    >
                      Aplicar
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Scope notices from missing_interpretations */}
      {report.missing_interpretations.length > 0 && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2.5 space-y-1">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Requiere verificación</p>
          {report.missing_interpretations.map((m, i) => (
            <p key={i} className="text-xs text-blue-700 dark:text-blue-300">{m.issue_es}</p>
          ))}
        </div>
      )}

      {/* AI edit textarea */}
      <div className="rounded-lg border bg-background p-2.5 space-y-2">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-brand-500" /> Pedir cambio a la IA
        </p>
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={aiRequest}
            onChange={(e) => setAiRequest(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); requestAiEdit(); } }}
            placeholder="Ej: Mover todos los partidos de Crossover a después de la 1pm"
            className="flex-1 text-xs rounded-md border border-border bg-muted/40 px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-muted-foreground/60"
            rows={2}
            disabled={aiLoading}
          />
          <button
            onClick={requestAiEdit}
            disabled={aiLoading || !aiRequest.trim()}
            className="self-end p-2 rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        {/* AI suggestions preview */}
        {aiSuggestions && (
          <div className="space-y-1.5 mt-1">
            <p className="text-[10px] text-muted-foreground">{aiSuggestions.summary_es}</p>
            {aiSuggestions.patches.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No se encontraron cambios para aplicar.</p>
            )}
            {aiSuggestions.patches.map((patch, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <button
                  onClick={() => {
                    setSelectedPatches((prev) => {
                      const next = new Set(prev);
                      if (next.has(i)) next.delete(i); else next.add(i);
                      return next;
                    });
                  }}
                  className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    selectedPatches.has(i)
                      ? "bg-brand-500 border-brand-500 text-white"
                      : "border-border bg-background"
                  }`}
                >
                  {selectedPatches.has(i) && <Check className="h-2.5 w-2.5" />}
                </button>
                <span className="flex-1 leading-snug text-muted-foreground">{patch.explanation_es}</span>
              </div>
            ))}
            {aiSuggestions.patches.length > 0 && (
              <button
                onClick={applySelectedPatches}
                disabled={applyLoading || selectedPatches.size === 0}
                className="w-full mt-1 text-xs font-semibold py-1.5 rounded-md bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                {applyLoading
                  ? <><Loader2 className="h-3 w-3 animate-spin" /> Aplicando…</>
                  : <><Check className="h-3 w-3" /> Aplicar {selectedPatches.size} cambio{selectedPatches.size !== 1 ? "s" : ""}</>
                }
              </button>
            )}
            <button
              onClick={() => { setAiSuggestions(null); setAiRequest(""); }}
              className="text-[10px] text-muted-foreground hover:text-foreground underline"
            >
              Cancelar
            </button>
          </div>
        )}

        {applyResult && (
          <p className="text-[10px] text-muted-foreground mt-1">{applyResult}</p>
        )}
      </div>

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

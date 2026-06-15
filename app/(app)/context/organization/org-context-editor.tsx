"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save, Trash2, AlertTriangle, Check, Target } from "lucide-react";

type ParsedPreview = {
  courts?: string[];
  playDays?: string[];
  timeWindow?: { start: string; end: string };
  defaultMatchDurationMinutes?: number;
  clubGrouping?: { enabled: boolean; type: string };
  warnings?: string[];
  [key: string]: unknown;
};

const EXAMPLE_PROMPTS = [
  "Todos los torneos usan Cancha A y Cancha B. Los juegos se juegan viernes a domingo de 8:00 a 21:00.",
  "Duración predeterminada de cada partido: 1 hora. Intentar agrupar equipos del mismo club.",
  "Solo Cancha A los sábados y domingos de 9am a 6pm.",
];

const DAY_LABELS: Record<string, string> = {
  monday: "Lun", tuesday: "Mar", wednesday: "Mié",
  thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom",
};

export function OrgContextEditor({
  orgId, userId, currentVersionNumber, initialPrompt,
}: {
  orgId: string;
  userId: string;
  currentVersionNumber: number;
  initialPrompt: string;
}) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleParse() {
    if (!prompt.trim()) return;
    setParsing(true);
    setError("");
    try {
      const res = await fetch("/api/context/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, scope: "organization" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreview(data.parsed);
    } catch (e) {
      setError("Error al interpretar el contexto. Intenta de nuevo.");
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!preview || !prompt.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/context/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          parsedConstraints: preview,
          scope: "organization",
          versionNumber: currentVersionNumber + 1,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError("Error al guardar el contexto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Prompt editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Editor de reglas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe las reglas globales de tu organización en español o inglés..."
            className="min-h-[140px] resize-none font-sans"
          />

          <div>
            <p className="text-xs text-muted-foreground mb-2">Ejemplos:</p>
            <div className="flex flex-col gap-1.5">
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="text-left text-xs px-3 py-2 rounded-md bg-muted hover:bg-muted/70 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={handleParse} disabled={!prompt.trim() || parsing} className="flex-1">
              <Sparkles className="h-4 w-4" />
              {parsing ? "Interpretando..." : "Interpretar contexto"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setPrompt(""); setPreview(null); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parsed preview */}
      {preview && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Vista previa interpretada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {preview.courts && (
              <PreviewRow label="Canchas" value={preview.courts.join(", ")} />
            )}
            {preview.playDays && (
              <PreviewRow
                label="Días de juego"
                value={preview.playDays.map((d) => DAY_LABELS[d] ?? d).join(", ")}
              />
            )}
            {preview.timeWindow && (
              <PreviewRow
                label="Horario"
                value={`${preview.timeWindow.start} – ${preview.timeWindow.end}`}
              />
            )}
            {preview.defaultMatchDurationMinutes && (
              <PreviewRow
                label="Duración predeterminada"
                value={`${preview.defaultMatchDurationMinutes} min`}
              />
            )}
            {preview.clubGrouping && (
              <PreviewRow
                label="Agrupación por club"
                value={preview.clubGrouping.enabled
                  ? `Activada (${preview.clubGrouping.type === "soft" ? "preferencial" : "estricta"})`
                  : "Desactivada"}
              />
            )}

            {preview.warnings && preview.warnings.length > 0 && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 space-y-1">
                {preview.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving || saved} className="flex-1">
                {saved ? (
                  <><Check className="h-4 w-4" /> Guardado</>
                ) : saving ? (
                  "Guardando..."
                ) : (
                  <><Save className="h-4 w-4" /> Guardar versión de contexto</>
                )}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/context/impact-simulator">
                  <Target className="h-4 w-4" /> Simular impacto
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-b last:border-0">
      <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

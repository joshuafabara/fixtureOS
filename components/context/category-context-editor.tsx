"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, Save, Trash2, AlertTriangle, Check, X, CheckCircle,
  Target, History, Zap, ArrowDown, Clock, Pin, Users, Layers, Flag, Trophy,
} from "lucide-react";

type BracketRounds = {
  quarterfinal?: string[];
  semifinal?: string[];
  final?: string[];
  third_place?: string[];
};

type ParsedConstraints = Record<string, unknown> & {
  startDate?: string;
  gameMode?: {
    type?: string;
    groups?: number;
    groupRounds?: number;
    teamsPerGroup?: number;
    totalQualifiers?: number;
    byeSeeds?: number[];
    classification?: string;
    playoffs?: string[];
    bracketRounds?: BracketRounds;
  };
  matchDurationMinutes?: number;
  defaultMatchDurationMinutes?: number;
  warnings?: string[];
};

type TeamRow = { id: string; name: string; clubName?: string };

type CategoryRow = {
  id: string;
  name: string;
  colorHex: string | null;
  startDate: string | null;
  gameModeId: string | null;
  isActiveForFixture: boolean;
  teamCount: number;
};

type InheritedRule = {
  type: "duration" | "courts" | "days" | "time" | "grouping" | "restriction";
  label: string;
  text: string;
  from: "org" | "tournament";
};

const EXAMPLE_PROMPTS = [
  "U16 empieza el 11 de julio. Doble round robin, partidos de 75 minutos.",
  "2 grupos, top 2 de cada grupo avanzan a semifinales y final.",
  "Solo round robin simple, todos contra todos una vez.",
];

const CLASSIFICATION_LABELS: Record<string, string> = {
  top_1_per_group: "Top 1 por grupo",
  top_2_per_group: "Top 2 por grupo",
  top_3_per_group: "Top 3 por grupo",
  top_4_per_group: "Top 4 por grupo",
  top_1: "1er lugar",
  top_2: "Top 2",
  top_3: "Top 3",
  top_4: "Top 4",
  top_6: "Top 6",
  top_6_per_group: "Top 6",
  top_8: "Top 8",
  all: "Todos",
};

const PLAYOFF_LABELS: Record<string, string> = {
  quarterfinal: "Cuartos",
  semifinal: "Semifinal",
  final: "Final",
  third_place: "3er lugar",
};

function formatClassification(cls: string | undefined): string {
  if (!cls) return "—";
  return CLASSIFICATION_LABELS[cls] ?? cls.replace(/_/g, " ");
}

function formatPlayoffs(playoffs: string[] | undefined): string {
  if (!playoffs || playoffs.length === 0) return "—";
  return playoffs.map((p) => PLAYOFF_LABELS[p] ?? p).join(" · ");
}

function splitIntoGroups<T>(items: T[], n: number): T[][] {
  const groups: T[][] = Array.from({ length: n }, () => []);
  items.forEach((item, i) => groups[i % n].push(item));
  return groups;
}

function EligibilityPanel({ category }: { category: CategoryRow }) {
  const eligible = category.isActiveForFixture;
  return (
    <div className="space-y-0 divide-y">
      <EligRow ok={!!category.startDate} label="Fecha de inicio" value={category.startDate ?? "Falta fecha"} />
      <EligRow ok={!!category.gameModeId} label="Modo de juego" value={category.gameModeId ? "Configurado" : "Falta modo"} />
      <EligRow ok label="Equipos inscritos" value={`${category.teamCount} equipos`} />
      <div className={`flex items-center gap-3 pt-3 mt-1 px-3 py-3 rounded-xl border ${eligible ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
        {eligible
          ? <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          : <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />}
        <div>
          <p className={`font-bold text-sm ${eligible ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
            {eligible ? "Categoría elegible" : "No elegible para fixture"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {eligible ? "Se incluirá en la generación del fixture." : "Completa fecha de inicio y modo de juego."}
          </p>
        </div>
      </div>
    </div>
  );
}

function EligRow({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      {ok
        ? <Check className="h-4 w-4 text-emerald-500 shrink-0" />
        : <X className="h-4 w-4 text-red-500 shrink-0" />}
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <span className={`text-sm font-semibold ${ok ? "text-foreground" : "text-red-600"}`}>{value}</span>
    </div>
  );
}

function InheritedRuleCard({ rule }: { rule: InheritedRule }) {
  const iconMap = {
    duration: <Clock className="h-3.5 w-3.5" />,
    courts: <Pin className="h-3.5 w-3.5" />,
    days: <Flag className="h-3.5 w-3.5" />,
    time: <Clock className="h-3.5 w-3.5" />,
    grouping: <Users className="h-3.5 w-3.5" />,
    restriction: <Layers className="h-3.5 w-3.5" />,
  };
  const colorMap = {
    duration: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    courts: "text-brand-600 bg-brand-50 dark:bg-brand-900/20",
    days: "text-brand-600 bg-brand-50 dark:bg-brand-900/20",
    time: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    grouping: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
    restriction: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
  };
  return (
    <div className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-muted/40 border border-l-[3px] border-muted-foreground/10 border-l-blue-400">
      <span className={`p-1 rounded-md shrink-0 ${colorMap[rule.type]}`}>
        {iconMap[rule.type]}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{rule.label}</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium flex items-center gap-1">
            <ArrowDown className="h-2.5 w-2.5" />
            {rule.from === "org" ? "Organización" : "Torneo"}
          </span>
        </div>
        <p className="text-xs text-foreground/80">{rule.text}</p>
      </div>
    </div>
  );
}

function TeamsWidget({ teams, colorHex }: { teams: TeamRow[]; colorHex: string | null }) {
  const color = colorHex ?? "#0d9488";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Equipos inscritos
          <span className="ml-auto font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {teams.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {teams.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">Sin equipos inscritos en esta categoría</p>
        ) : (
          teams.map((team, i) => (
            <div
              key={team.id}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 9px", borderRadius: 8,
                background: "#f8fafc", border: "1px solid #e6eaf0",
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: 99,
                background: color, color: "#fff",
                display: "grid", placeItems: "center",
                fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#131c2e", lineHeight: 1.3 }}>{team.name}</div>
                {team.clubName && (
                  <div style={{ fontSize: 11, color: "#76869b" }}>{team.clubName}</div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 9, background: "#f8fafc", border: "1px solid #e6eaf0" }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "#76869b", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#131c2e", lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}

function BracketRound({ title, matches, id_prefix, teal }: {
  title: string; matches: string[]; id_prefix: string; teal?: boolean;
}) {
  return (
    <div style={teal ? {
      background: "linear-gradient(135deg, rgba(13,148,136,0.08), rgba(13,148,136,0.02))",
      border: "1px solid rgba(13,148,136,0.2)", borderRadius: 12, padding: 12,
    } : {
      background: "rgba(248,250,252,0.8)", border: "1px solid #e6eaf0", borderRadius: 12, padding: 12,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: teal ? "#0d9488" : "#76869b", marginBottom: 8 }}>
        {title}
      </div>
      <div className="space-y-1.5">
        {matches.map((match, i) => (
          <div key={i} className="flex items-center gap-2 bg-background border rounded-lg px-2.5 py-1.5">
            <span className="text-xs font-bold text-brand-600 shrink-0" style={{ minWidth: 28 }}>
              {id_prefix}{i + 1}
            </span>
            <span className="text-xs text-muted-foreground">{match}</span>
          </div>
        ))}
      </div>
      {teal && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px 0", fontSize: 11.5, fontWeight: 700, color: "#0d9488" }}>
          <Trophy style={{ width: 12, height: 12 }} /> Campeón
        </div>
      )}
    </div>
  );
}

function GameModePreview({ constraints, teams }: { constraints: ParsedConstraints; teams: TeamRow[] }) {
  const gm = constraints.gameMode;
  if (!gm) return null;

  const duration = constraints.matchDurationMinutes ?? constraints.defaultMatchDurationMinutes;
  const numGroups = (gm.groups && gm.groups > 0) ? gm.groups : 1;
  const numRounds = gm.groupRounds ?? (gm.type === "double_round_robin" ? 2 : 1);
  const hasPlayoffs = Array.isArray(gm.playoffs) && gm.playoffs.length > 0;
  const hasGroups = numGroups > 1;
  const groupLetters = "ABCDEFGH".split("");
  const br = gm.bracketRounds;

  // Distribute teams across groups for the bracket preview
  const groupedTeams = hasGroups && teams.length > 0
    ? splitIntoGroups(teams.map((t) => t.name), numGroups)
    : [];

  const numSlotsPerGroup = hasGroups
    ? Math.max(teams.length > 0 ? Math.ceil(teams.length / numGroups) : 4, 2)
    : Math.max(gm.teamsPerGroup ?? (teams.length > 0 ? teams.length : 4), 2);

  const showGroupCards = hasGroups || teams.length > 0;

  // Playoff rounds to render (order matters)
  const playoffOrder: Array<{ key: keyof BracketRounds; label: string; idPrefix: string; teal?: boolean }> = [
    { key: "quarterfinal", label: "Cuartos de final", idPrefix: "QF" },
    { key: "semifinal", label: "Semifinales", idPrefix: "SF" },
    { key: "final", label: "Final", idPrefix: "F", teal: true },
  ];
  const has3P = br?.third_place && br.third_place.length > 0;

  // Build fallback bracket if no bracketRounds from AI
  function fallbackMatches(round: string): string[] {
    if (round === "quarterfinal") {
      if (hasGroups && numGroups === 2)
        return ["A1 vs B3", "B1 vs A3", "A2 vs B4", "B2 vs A4"];
      return ["3 vs 6", "4 vs 5"];
    }
    if (round === "semifinal") {
      if (hasGroups && !br?.quarterfinal)
        return ["A1 vs B2", "B1 vs A2"];
      if (br?.quarterfinal)
        return ["2 vs Gan. QF1", "1 vs Gan. QF2"];
      return ["Gan. QF1 vs Gan. QF2", "Gan. QF3 vs Gan. QF4"];
    }
    if (round === "final") return ["Gan. SF1 vs Gan. SF2"];
    if (round === "third_place") return ["Per. SF1 vs Per. SF2"];
    return [];
  }

  const activeRounds = playoffOrder.filter(({ key }) => {
    const keyStr = key as string;
    const inPlayoffs = gm.playoffs?.includes(keyStr) ?? false;
    const hasBr = br && Array.isArray(br[key]) && (br[key] as string[]).length > 0;
    return inPlayoffs || hasBr;
  });

  return (
    <div className="space-y-5">
      {/* Stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <StatBox label="Grupos" value={String(numGroups)} />
        <StatBox label="Vueltas" value={String(numRounds)} />
        <StatBox label="Clasifican" value={formatClassification(gm.classification)} />
        <StatBox label="Playoffs" value={formatPlayoffs(gm.playoffs)} />
        <StatBox label="Duración" value={duration ? `${duration} min` : "Heredada"} />
        <StatBox label="Prioridad" value="Heredada" />
      </div>

      {/* Bye seeds indicator */}
      {gm.byeSeeds && gm.byeSeeds.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 9, background: "rgba(13,148,136,0.07)", border: "1px solid rgba(13,148,136,0.2)", fontSize: 12.5 }}>
          <Check className="h-3.5 w-3.5 text-brand-600 shrink-0" />
          <span className="text-muted-foreground">
            Siembras <strong className="text-foreground">{gm.byeSeeds.map((s) => `#${s}`).join(" y ")}</strong> clasifican directo a la siguiente ronda (bye)
          </span>
        </div>
      )}

      {/* Bracket preview */}
      {(showGroupCards || hasPlayoffs) && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "#76869b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Vista previa del cuadro
          </p>

          {/* Group cards */}
          {showGroupCards && (
            <div
              style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(Math.max(numGroups, 1), 4)}, 1fr)`, gap: 10, marginBottom: hasPlayoffs ? 16 : 0 }}
            >
              {groupLetters.slice(0, Math.max(numGroups, 1)).map((letter, gi) => {
                const groupTeamNames = hasGroups ? (groupedTeams[gi] ?? []) : teams.map((t) => t.name);
                const slots = Array.from({ length: numSlotsPerGroup });
                return (
                  <div key={letter} className="bg-muted/40 border rounded-xl p-3">
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", color: "#76869b", marginBottom: 8 }}>
                      {hasGroups ? `Grupo ${letter}` : "Grupo único"}
                    </div>
                    <div className="space-y-1.5">
                      {slots.map((_, i) => (
                        <div key={i} className="flex items-center gap-2 bg-background border rounded-lg px-2.5 py-1.5">
                          <span className="text-xs font-bold text-brand-600 shrink-0" style={{ minWidth: 22 }}>
                            {hasGroups ? `${letter}${i + 1}` : `${i + 1}`}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {groupTeamNames[i] ?? `Equipo ${hasGroups ? letter : ""}${i + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Playoff bracket — use bracketRounds from AI if available, else fallback */}
          {hasPlayoffs && activeRounds.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "nowrap", overflowX: "auto" }}>
                {activeRounds.map(({ key, label, idPrefix, teal }, idx) => {
                  const keyStr = key as string;
                  const matches = (br && Array.isArray(br[key]) && (br[key] as string[]).length > 0)
                    ? (br[key] as string[])
                    : fallbackMatches(keyStr);
                  return (
                    <div key={keyStr} style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto", minWidth: 0 }}>
                      <div style={{ minWidth: 160, maxWidth: 220 }}>
                        <BracketRound title={label} matches={matches} id_prefix={idPrefix} teal={teal} />
                      </div>
                      {idx < activeRounds.length - 1 && (
                        <div style={{ color: "#94a3b8", fontSize: 20, fontWeight: 200, flexShrink: 0 }}>→</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Third place */}
              {has3P && (
                <div style={{ marginTop: 10 }}>
                  <BracketRound
                    title="3er lugar"
                    matches={br!.third_place!}
                    id_prefix="3P"
                  />
                </div>
              )}
              {!has3P && gm.playoffs?.includes("third_place") && (
                <div style={{ marginTop: 10 }}>
                  <BracketRound
                    title="3er lugar"
                    matches={fallbackMatches("third_place")}
                    id_prefix="3P"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CategoryContextEditor({
  category,
  allCategories,
  inheritedRules,
  initialPrompt,
  initialConstraints,
  versionNumber,
  teams,
}: {
  category: CategoryRow;
  allCategories: CategoryRow[];
  inheritedRules: InheritedRule[];
  initialPrompt: string;
  initialConstraints: ParsedConstraints | null;
  versionNumber: number;
  teams: TeamRow[];
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  // preview = the currently displayed interpretation (may be saved or fresh)
  const [preview, setPreview] = useState<ParsedConstraints | null>(initialConstraints);
  // true only when preview came from a new parse in this session (not just the saved version)
  const [isNewParse, setIsNewParse] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const promptChanged = prompt.trim() !== (initialPrompt ?? "").trim();
  // Can confirm only when: there's a preview AND the prompt changed AND it was freshly parsed
  const canConfirm = !!preview && promptChanged && isNewParse;

  const confirmHint = saved
    ? null
    : saving
    ? null
    : !preview
    ? "Interpreta el contexto primero"
    : !promptChanged
    ? "Sin cambios respecto a la versión guardada"
    : !isNewParse
    ? "Interpreta el contexto antes de confirmar los cambios"
    : null;

  async function handleParse() {
    if (!prompt.trim()) return;
    setParsing(true);
    setError("");
    try {
      const res = await fetch("/api/context/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, scope: "category" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreview(data.parsed);
      setIsNewParse(true);
    } catch {
      setError("Error al interpretar el contexto. Intenta de nuevo.");
    } finally {
      setParsing(false);
    }
  }

  async function handleConfirm() {
    if (!preview || !prompt.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/categories/${category.id}/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          parsedConstraints: preview,
          versionNumber: versionNumber + 1,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => { router.refresh(); setSaved(false); }, 1500);
    } catch {
      setError("Error al guardar el contexto de categoría.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {allCategories.map((cat) => {
          const isCurrent = cat.id === category.id;
          return (
            <a
              key={cat.id}
              href={`/context/category/${cat.id}`}
              className={`flex-none flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all ${
                isCurrent
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.colorHex ?? "#6b7280" }} />
              {cat.name}
              {!cat.isActiveForFixture && <AlertTriangle className="h-3 w-3 text-amber-500" />}
            </a>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
        {/* Left — Eligibility + Inherited + Teams */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full" style={{ background: category.colorHex ?? "#6b7280" }} />
                <span className="font-bold text-sm">{category.name}</span>
                <span className="ml-auto text-xs text-muted-foreground font-mono font-bold">{category.teamCount} eq.</span>
              </div>
              <EligibilityPanel category={category} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
                Reglas heredadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inheritedRules.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Sin reglas heredadas</p>
              ) : (
                inheritedRules.map((r, i) => <InheritedRuleCard key={i} rule={r} />)
              )}
            </CardContent>
          </Card>

          <TeamsWidget teams={teams} colorHex={category.colorHex} />
        </div>

        {/* Right — Editor + Preview */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 grid place-items-center shrink-0">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="font-bold text-sm">Editor de contexto de categoría</span>
              </div>

              <Textarea
                value={prompt}
                onChange={(e) => { setPrompt(e.target.value); setIsNewParse(false); }}
                placeholder="Ej: U17 empieza el 15 de junio. 2 grupos, round robin simple, top 2 a semifinales…"
                className="min-h-[120px] resize-none"
              />

              <div>
                <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-wider">Ejemplos</p>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_PROMPTS.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => { setPrompt((t) => t ? `${t} ${ex}` : ex); setIsNewParse(false); }}
                      className="text-left text-xs px-2.5 py-1.5 rounded-full border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-1"
                    >
                      <span className="text-brand-500 font-bold">+</span> {ex}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-center gap-2">
                <Button onClick={handleParse} disabled={!prompt.trim() || parsing} className="flex-1">
                  <Zap className="h-4 w-4" />
                  {parsing ? "Interpretando..." : "Interpretar contexto de categoría"}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { setPrompt(""); setPreview(null); setIsNewParse(false); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {preview && (
            <Card className="border-brand-200 dark:border-brand-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4 text-brand-600" />
                    Modo de juego interpretado
                  </CardTitle>
                  {isNewParse ? (
                    <Badge variant="info">Interpretado</Badge>
                  ) : promptChanged ? (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">Modificado</Badge>
                  ) : (
                    <Badge variant="secondary">Guardado</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <GameModePreview constraints={preview} teams={teams} />

                {preview.startDate && (
                  <div className="flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-800 dark:text-emerald-300">
                      Fecha detectada: <strong>{preview.startDate}</strong>
                      {!category.startDate && " · se aplicará a la categoría"}
                    </span>
                  </div>
                )}

                {preview.warnings && preview.warnings.length > 0 && (
                  <div className="space-y-1">
                    {preview.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 pt-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => { setPrompt(initialPrompt); setPreview(initialConstraints ?? null); setIsNewParse(false); }}>
          <X className="h-4 w-4" /> Descartar cambios
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" asChild>
          <a href="/context/history"><History className="h-4 w-4" /> Historial</a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="/context/impact-simulator"><Target className="h-4 w-4" /> Simular impacto</a>
        </Button>
        <div className="flex flex-col items-end gap-1">
          <Button onClick={handleConfirm} disabled={!canConfirm || saving || saved} title={confirmHint ?? undefined}>
            {saved ? (
              <><Check className="h-4 w-4" /> Guardado</>
            ) : saving ? (
              "Guardando..."
            ) : (
              <><Save className="h-4 w-4" /> Confirmar modo de juego</>
            )}
          </Button>
          {confirmHint && !saving && !saved && (
            <p className="text-xs text-muted-foreground">{confirmHint}</p>
          )}
        </div>
      </div>
    </div>
  );
}

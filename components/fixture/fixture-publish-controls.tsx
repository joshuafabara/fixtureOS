"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe, Archive, FileEdit, RotateCcw, Loader2 } from "lucide-react";

type Props = {
  versionId: string;
  state: "draft" | "published" | "archived";
  versionNumber: number;
};

const TRANSITIONS: Record<string, { label: string; targetState: "draft" | "published" | "archived"; icon: React.ReactNode; variant: "default" | "outline" | "destructive" }[]> = {
  draft: [
    { label: "Publicar", targetState: "published", icon: <Globe className="h-4 w-4" />, variant: "default" },
    { label: "Archivar", targetState: "archived", icon: <Archive className="h-4 w-4" />, variant: "outline" },
  ],
  published: [
    { label: "A borrador", targetState: "draft", icon: <FileEdit className="h-4 w-4" />, variant: "outline" },
    { label: "Archivar", targetState: "archived", icon: <Archive className="h-4 w-4" />, variant: "outline" },
  ],
  archived: [
    { label: "Restaurar a borrador", targetState: "draft", icon: <RotateCcw className="h-4 w-4" />, variant: "outline" },
  ],
};

export function FixturePublishControls({ versionId, state, versionNumber }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function changeState(targetState: string) {
    setLoading(targetState);
    setError("");
    try {
      const res = await fetch(`/api/fixture-versions/${versionId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: targetState }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Error al cambiar estado");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(null);
    }
  }

  const transitions = TRANSITIONS[state] ?? [];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {error && <span className="text-xs text-red-600">{error}</span>}
      {transitions.map((t) => (
        <Button
          key={t.targetState}
          variant={t.variant}
          size="sm"
          disabled={loading !== null}
          onClick={() => changeState(t.targetState)}
        >
          {loading === t.targetState ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t.icon
          )}
          {t.label}
        </Button>
      ))}
    </div>
  );
}

type RestoreProps = {
  versionId: string;
  versionNumber: number;
  tournamentId: string;
};

export function FixtureRestoreButton({ versionId, versionNumber, tournamentId }: RestoreProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRestore() {
    if (!confirm(`¿Restaurar V${versionNumber}? Se creará una nueva versión basada en esta.`)) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/fixture-versions/${versionId}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al restaurar");
      router.push(`/fixture/${tournamentId}?v=${data.versionNumber}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="text-xs text-red-600 mb-1">{error}</p>}
      <Button variant="outline" size="sm" disabled={loading} onClick={handleRestore}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
        Restaurar
      </Button>
    </div>
  );
}

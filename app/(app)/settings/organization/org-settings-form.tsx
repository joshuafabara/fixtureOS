"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Loader2, Check } from "lucide-react";

type Props = { initialName: string; initialDuration: number };

export function OrgSettingsForm({ initialName, initialDuration }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [duration, setDuration] = useState(initialDuration);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!name.trim()) { setError("El nombre es requerido."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/settings/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), defaultMatchDurationMinutes: duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? data.error ?? "Error al guardar");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nombre de la organización</label>
          <input
            className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Duración predeterminada de partido (minutos)</label>
          <input
            type="number"
            min={10}
            max={300}
            className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">Se usa como sugerencia en la generación de fixture.</p>
        </div>
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />{error}
          </p>
        )}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved ? "Guardado" : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

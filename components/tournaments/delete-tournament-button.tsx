"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function DeleteTournamentButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "Error al eliminar");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="Eliminar torneo"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Eliminar torneo
            </DialogTitle>
          </DialogHeader>

          <div className="text-sm text-muted-foreground space-y-3 py-1">
            <p>
              Estás por eliminar <strong className="text-foreground">{name}</strong>.
            </p>
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-red-700 text-xs leading-relaxed">
              <strong>Esta acción es permanente e irreversible.</strong> Se eliminarán
              todos los datos asociados al torneo:
              <ul className="mt-1.5 ml-3 list-disc space-y-0.5">
                <li>Categorías y equipos</li>
                <li>Fixtures y versiones de fixture</li>
                <li>Dry runs y auditorías</li>
                <li>Importaciones</li>
                <li>Clubes sin equipos en otros torneos</li>
              </ul>
            </div>
            {error && <p className="text-red-500 font-semibold">{error}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Eliminar torneo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

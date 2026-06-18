"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

type Props = { batchId: string };

export function ConfirmImportButton({ batchId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/imports/${batchId}/confirm`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Error al confirmar");
      }
      router.push(`/imports/${batchId}/confirm`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={confirm} disabled={loading} className="gap-1.5 min-w-[180px]">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {loading ? "Confirmando…" : "Confirmar importación"}
      </Button>
      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
    </div>
  );
}

"use client";
import { Check } from "lucide-react";
import Link from "next/link";

const STEPS = ["Origen", "Mapeo", "Cambios", "Confirmar"];

type Props = {
  current: number;
  backHref?: (step: number) => string;
};

export function WizardSteps({ current, backHref }: Props) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 mb-6">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const canJump = done && backHref;
        const inner = (
          <button
            type="button"
            disabled={!canJump}
            className="flex items-center gap-2 disabled:cursor-default group"
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[13px] flex-shrink-0 ${done ? "bg-green-500 text-white" : active ? "bg-blue-500 text-white" : "bg-zinc-100 text-zinc-400"}`}>
              {done ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : i + 1}
            </span>
            <span className={`hidden sm:block text-[13.5px] font-bold ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
          </button>
        );

        return (
          <div key={label} className="contents">
            {canJump ? <Link href={backHref!(i)}>{inner}</Link> : inner}
            {i < STEPS.length - 1 && (
              <span className={`flex-1 h-0.5 rounded ${done ? "bg-green-500" : "bg-zinc-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

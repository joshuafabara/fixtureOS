import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

export function PageStub({
  title,
  description,
  Icon = Construction,
}: {
  title: string;
  description?: string;
  Icon?: LucideIcon;
}) {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold">{title}</h1>
      {description && (
        <p className="text-muted-foreground text-sm mt-2 max-w-sm">{description}</p>
      )}
      <p className="text-xs text-muted-foreground/60 mt-6">
        Esta pantalla está en desarrollo — MVP en progreso
      </p>
    </div>
  );
}

"use client";

type Version = { id: string; versionNumber: number; state: string };

const STATE_LABEL: Record<string, string> = {
  draft: "Borrador", published: "Publicado", archived: "Archivado",
};

type Props = {
  versions: Version[];
  selectedVersionNumber: number;
  tournamentId: string;
  catFilter: string | null;
};

export function VersionSwitcher({ versions, selectedVersionNumber, tournamentId, catFilter }: Props) {
  return (
    <select
      defaultValue={selectedVersionNumber}
      onChange={(e) => {
        const cat = catFilter ? `&cat=${catFilter}` : "";
        window.location.href = `/fixture/${tournamentId}?v=${e.target.value}${cat}`;
      }}
      className="text-sm border border-border rounded-md px-2 py-1.5 bg-background"
    >
      {versions.map((v) => (
        <option key={v.id} value={v.versionNumber}>
          V{v.versionNumber} · {STATE_LABEL[v.state] ?? v.state}
        </option>
      ))}
    </select>
  );
}

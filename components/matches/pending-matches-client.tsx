"use client";
import { useState, useMemo } from "react";
import { Calendar, Clock, MapPin, Search, SlidersHorizontal, X } from "lucide-react";

export type PendingMatch = {
  id: string;
  tournamentId: string;
  tournamentName: string;
  categoryId: string;
  categoryName: string;
  categoryColorHex: string | null;
  homeTeamId: string | null;
  homeTeamName: string | null;
  homeClubId: string | null;
  homeClubName: string | null;
  awayTeamId: string | null;
  awayTeamName: string | null;
  awayClubId: string | null;
  awayClubName: string | null;
  scheduledDate: string | null;
  startTime: string | null;
  endTime: string | null;
  courtId: string | null;
  courtName: string | null;
  phase: string;
  status: string;
};

export type FilterOptions = {
  tournaments: { id: string; name: string }[];
  categories: { id: string; name: string; colorHex: string | null; tournamentId: string }[];
  clubs: { id: string; name: string }[];
  courts: { id: string; name: string }[];
};

type Props = {
  matches: PendingMatch[];
  filterOptions: FilterOptions;
};

const PHASE_LABELS: Record<string, string> = {
  regular: "Fase regular",
  group: "Fase de grupos",
  quarterfinal: "Cuartos de final",
  semifinal: "Semifinal",
  final: "Final",
  "3rd_place": "Tercer puesto",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programado",
  pending: "Pendiente",
};

function catDot(hex: string | null) {
  const h = hex ?? "#64748b";
  const r = parseInt(h.replace("#", "").slice(0, 2), 16);
  const g = parseInt(h.replace("#", "").slice(2, 4), 16);
  const b = parseInt(h.replace("#", "").slice(4, 6), 16);
  return { bg: `rgba(${r},${g},${b},0.11)`, border: `rgba(${r},${g},${b},0.28)`, text: h, dot: h };
}

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-EC", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export function PendingMatchesClient({ matches, filterOptions }: Props) {
  const [tournamentFilter, setTournamentFilter]   = useState("all");
  const [categoryFilter, setCategoryFilter]       = useState("all");
  const [clubFilter, setClubFilter]               = useState("all");
  const [courtFilter, setCourtFilter]             = useState("all");
  const [phaseFilter, setPhaseFilter]             = useState("all");
  const [statusFilter, setStatusFilter]           = useState("all");
  const [dateFrom, setDateFrom]                   = useState("");
  const [dateTo, setDateTo]                       = useState("");
  const [search, setSearch]                       = useState("");
  const [showFilters, setShowFilters]             = useState(false);
  const [viewMode, setViewMode]                   = useState<"cards" | "table">("cards");

  const filteredCategories = useMemo(() =>
    tournamentFilter === "all"
      ? filterOptions.categories
      : filterOptions.categories.filter((c) => c.tournamentId === tournamentFilter),
    [tournamentFilter, filterOptions.categories]
  );

  const filtered = useMemo(() => {
    let result = matches;

    if (tournamentFilter !== "all") result = result.filter((m) => m.tournamentId === tournamentFilter);
    if (categoryFilter !== "all")   result = result.filter((m) => m.categoryId === categoryFilter);
    if (clubFilter !== "all")       result = result.filter((m) => m.homeClubId === clubFilter || m.awayClubId === clubFilter);
    if (courtFilter !== "all")      result = result.filter((m) => m.courtId === courtFilter);
    if (phaseFilter !== "all")      result = result.filter((m) => m.phase === phaseFilter);
    if (statusFilter !== "all")     result = result.filter((m) => m.status === statusFilter);
    if (dateFrom)                   result = result.filter((m) => !m.scheduledDate || m.scheduledDate >= dateFrom);
    if (dateTo)                     result = result.filter((m) => !m.scheduledDate || m.scheduledDate <= dateTo);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) =>
        m.homeTeamName?.toLowerCase().includes(q) ||
        m.awayTeamName?.toLowerCase().includes(q) ||
        m.homeClubName?.toLowerCase().includes(q) ||
        m.awayClubName?.toLowerCase().includes(q) ||
        m.categoryName.toLowerCase().includes(q) ||
        m.tournamentName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [matches, tournamentFilter, categoryFilter, clubFilter, courtFilter, phaseFilter, statusFilter, dateFrom, dateTo, search]);

  const activeFilterCount = [
    tournamentFilter !== "all", categoryFilter !== "all", clubFilter !== "all",
    courtFilter !== "all", phaseFilter !== "all", statusFilter !== "all",
    !!dateFrom, !!dateTo, !!search.trim(),
  ].filter(Boolean).length;

  function clearFilters() {
    setTournamentFilter("all"); setCategoryFilter("all"); setClubFilter("all");
    setCourtFilter("all"); setPhaseFilter("all"); setStatusFilter("all");
    setDateFrom(""); setDateTo(""); setSearch("");
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Partidos pendientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} partido{filtered.length !== 1 ? "s" : ""} sin jugar
            {matches.length !== filtered.length ? ` de ${matches.length} total` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="inline-flex bg-muted rounded-xl p-1 gap-1">
            {(["cards", "table"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === v
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "cards" ? "Tarjetas" : "Tabla"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-[#e6eaf0] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por equipo, club, categoría…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#d4dae3] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Tournament */}
          <select
            value={tournamentFilter}
            onChange={(e) => { setTournamentFilter(e.target.value); setCategoryFilter("all"); }}
            className="px-3 py-2 text-sm border border-[#d4dae3] rounded-xl bg-white font-semibold focus:outline-none"
          >
            <option value="all">Todos los torneos</option>
            {filterOptions.tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold border rounded-xl transition-all ${
              showFilters || activeFilterCount > 0
                ? "bg-brand-500/10 border-brand-500/30 text-brand-600"
                : "border-[#d4dae3] text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground underline">
              Limpiar todo
            </button>
          )}
        </div>

        {/* Extended filters */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-[#f1f5f9]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-[#d4dae3] rounded-xl bg-white font-semibold focus:outline-none col-span-1"
            >
              <option value="all">Todas las categorías</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-[#d4dae3] rounded-xl bg-white font-semibold focus:outline-none"
            >
              <option value="all">Todos los clubes</option>
              {filterOptions.clubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={courtFilter}
              onChange={(e) => setCourtFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-[#d4dae3] rounded-xl bg-white font-semibold focus:outline-none"
            >
              <option value="all">Todas las canchas</option>
              {filterOptions.courts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-[#d4dae3] rounded-xl bg-white font-semibold focus:outline-none"
            >
              <option value="all">Todas las fases</option>
              {Object.entries(PHASE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-[#d4dae3] rounded-xl bg-white font-semibold focus:outline-none"
            >
              <option value="all">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <div className="flex gap-2 items-center col-span-1 sm:col-span-1">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 min-w-0 px-2 py-2 text-xs border border-[#d4dae3] rounded-xl bg-white focus:outline-none"
                placeholder="Desde"
              />
              <span className="text-muted-foreground text-xs">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 min-w-0 px-2 py-2 text-xs border border-[#d4dae3] rounded-xl bg-white focus:outline-none"
                placeholder="Hasta"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#e6eaf0] rounded-2xl py-16 text-center">
          <div className="text-4xl mb-3">🎾</div>
          <p className="text-muted-foreground text-sm">No hay partidos que coincidan con los filtros.</p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="mt-3 text-xs text-brand-600 underline">Limpiar filtros</button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        <CardsView matches={filtered} />
      ) : (
        <TableView matches={filtered} />
      )}
    </div>
  );
}

function CardsView({ matches }: { matches: PendingMatch[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {matches.map((m) => {
        const s = catDot(m.categoryColorHex);
        const isPlaceholder = !m.homeTeamId && !m.awayTeamId;
        return (
          <div
            key={m.id}
            className="bg-white border border-[#e6eaf0] rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Category bar */}
            <div
              className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e6eaf0]"
              style={{ background: s.bg }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
              <span className="text-xs font-bold truncate" style={{ color: s.text }}>{m.categoryName}</span>
              <span className="ml-auto text-[10px] font-semibold text-muted-foreground">{PHASE_LABELS[m.phase] ?? m.phase}</span>
            </div>

            {/* Match teams */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm flex-1 truncate">
                  {isPlaceholder ? <span className="text-muted-foreground italic">TBD</span> : m.homeTeamName ?? "—"}
                </span>
                <span className="text-[10px] font-black text-muted-foreground bg-[#f1f5f9] px-2 py-0.5 rounded-md shrink-0">vs</span>
                <span className="font-bold text-sm flex-1 truncate text-right">
                  {isPlaceholder ? <span className="text-muted-foreground italic">TBD</span> : m.awayTeamName ?? "—"}
                </span>
              </div>
              {(m.homeClubName || m.awayClubName) && (
                <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground">
                  <span className="flex-1 truncate">{m.homeClubName ?? ""}</span>
                  <span className="shrink-0">·</span>
                  <span className="flex-1 truncate text-right">{m.awayClubName ?? ""}</span>
                </div>
              )}
            </div>

            {/* Match meta */}
            <div className="px-4 pb-3 flex items-center gap-3 flex-wrap border-t border-[#f1f5f9] pt-2.5">
              {m.scheduledDate ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {fmtDate(m.scheduledDate)}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground italic">Fecha TBD</span>
              )}
              {m.startTime && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {m.startTime.slice(0, 5)}{m.endTime ? ` – ${m.endTime.slice(0, 5)}` : ""}
                </span>
              )}
              {m.courtName ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {m.courtName}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground italic">Cancha TBD</span>
              )}
              <span className="ml-auto">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  m.status === "scheduled"
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "bg-amber-50 text-amber-600 border border-amber-200"
                }`}>
                  {STATUS_LABELS[m.status] ?? m.status}
                </span>
              </span>
            </div>

            {/* Tournament footer */}
            <div className="px-4 pb-2.5 text-[10.5px] text-muted-foreground truncate">
              {m.tournamentName}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TableView({ matches }: { matches: PendingMatch[] }) {
  return (
    <div className="bg-white border border-[#e6eaf0] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#e6eaf0] bg-[#f8fafc]">
              {["Categoría", "Local", "Visitante", "Fecha", "Hora", "Cancha", "Fase", "Estado"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matches.map((m, i) => {
              const s = catDot(m.categoryColorHex);
              const isPlaceholder = !m.homeTeamId && !m.awayTeamId;
              return (
                <tr key={m.id} className={`border-b border-[#f1f5f9] hover:bg-[#fafbfc] transition-colors ${i % 2 === 0 ? "" : "bg-[#fafbfc]/40"}`}>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: s.text }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                      {m.categoryName}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold max-w-[140px] truncate">
                    {isPlaceholder ? <span className="text-muted-foreground italic text-xs">TBD</span> : (m.homeTeamName ?? "—")}
                  </td>
                  <td className="px-4 py-2.5 font-semibold max-w-[140px] truncate">
                    {isPlaceholder ? <span className="text-muted-foreground italic text-xs">TBD</span> : (m.awayTeamName ?? "—")}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {m.scheduledDate ? fmtDate(m.scheduledDate) : <span className="italic">TBD</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {m.startTime ? m.startTime.slice(0, 5) : <span className="italic text-[10px]">TBD</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[100px] truncate">
                    {m.courtName ?? <span className="italic">TBD</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {PHASE_LABELS[m.phase] ?? m.phase}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      m.status === "scheduled"
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "bg-amber-50 text-amber-600 border border-amber-200"
                    }`}>
                      {STATUS_LABELS[m.status] ?? m.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

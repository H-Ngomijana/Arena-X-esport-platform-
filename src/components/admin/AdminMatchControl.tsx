import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { getMatches, getTournaments, updateMatch } from "@/lib/storage";
import AdminMatchSetup from "@/components/admin/AdminMatchSetup";
import AdminDeclareResult from "@/components/admin/AdminDeclareResult";
import AdminStandingsEditor from "@/components/admin/AdminStandingsEditor";
import AdminAnnouncementPanel from "@/components/admin/AdminAnnouncementPanel";
import AdminTournamentPortalSettings from "@/components/admin/AdminTournamentPortalSettings";
import { useRealtimeRefresh } from "@/components/hooks/useRealtimeRefresh";

const statusOptions = ["scheduled", "check_in", "live", "awaiting_results", "disputed", "completed", "forfeit"];

const AdminMatchControl = ({ logAction }: { logAction: (a: string) => void }) => {
  useRealtimeRefresh({ keys: ["matches", "tournaments", "join_requests"], intervalMs: 4000 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTournament, setSelectedTournament] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  const tournaments = getTournaments();
  const matches = getMatches();

  const filtered = useMemo(() => {
    return matches.filter((match) => {
      if (selectedTournament && match.tournament_id !== selectedTournament) return false;
      if (statusFilter !== "all" && match.status !== statusFilter) return false;
      const names = (match.participants || []).map((p) => p.name).join(" ");
      if (search && !`${match.round_label || ""} ${names}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [matches, selectedTournament, statusFilter, search, refreshTick]);

  const changeStatus = (id: string, status: string) => {
    updateMatch(id, { status });
    logAction(`Match ${id} status -> ${status}`);
    toast.success(`Status -> ${status}`);
    setRefreshTick((n) => n + 1);
  };

  return (
    <div className="space-y-6">
      <h2 className="font-mono text-lg text-white/80">Match Control</h2>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-cyan-500/20 bg-[#0a0a12] p-4 space-y-3">
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono [&_option]:bg-[#0a0a12] [&_option]:text-white"
          >
            <option value="">Select tournament</option>
            {tournaments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {selectedTournament && (
            <>
              <AdminTournamentPortalSettings tournamentId={selectedTournament} onDone={() => setRefreshTick((n) => n + 1)} />
              <AdminMatchSetup tournamentId={selectedTournament} onDone={() => setRefreshTick((n) => n + 1)} />
              <AdminDeclareResult tournamentId={selectedTournament} onDone={() => setRefreshTick((n) => n + 1)} />
              <AdminStandingsEditor tournamentId={selectedTournament} onDone={() => setRefreshTick((n) => n + 1)} />
              <AdminAnnouncementPanel tournamentId={selectedTournament} onDone={() => setRefreshTick((n) => n + 1)} />
            </>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search matches..."
              className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-9 text-sm font-mono"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono [&_option]:bg-[#0a0a12] [&_option]:text-white"
          >
            <option value="all">All status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <div className="space-y-2 max-h-[70vh] overflow-auto">
            {filtered.map((match) => (
              <div key={match.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm text-white">{match.round_label || `Round ${match.round || 1}`}</p>
                  <span className="text-[10px] uppercase tracking-widest text-white/40">{match.status}</span>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  {(match.participants?.[0]?.name || "TBD")} vs {(match.participants?.[1]?.name || "TBD")}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {match.scheduled_time ? new Date(match.scheduled_time).toLocaleString() : "No schedule"}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["scheduled", "live", "awaiting_results"].map((status) => (
                    <button
                      key={status}
                      onClick={() => changeStatus(match.id, status)}
                      className="h-8 rounded bg-white/10 hover:bg-white/20 text-xs font-mono text-white"
                    >
                      {status.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm text-white/50">No matches found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMatchControl;

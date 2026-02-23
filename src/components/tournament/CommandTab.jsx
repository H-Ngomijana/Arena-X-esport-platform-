import AnnouncementFeed from "@/components/tournament/AnnouncementFeed";
import LiveStandings from "@/components/tournament/LiveStandings";
import ReportChat from "@/components/tournament/ReportChat";
import UpcomingMatchesList from "@/components/tournament/UpcomingMatchesList";
import ReadyMatchCard from "@/components/tournament/ReadyMatchCard";
import EvidenceSubmitForm from "@/components/tournament/EvidenceSubmitForm";

const CommandTab = ({
  tournament,
  matches,
  teamsById,
  currentUser,
  myMatch,
  isMyMatchLive,
  topPlayers,
  topTeams,
  onRefresh,
}) => {
  const scheduled = matches
    .filter((item) => item.status === "scheduled")
    .sort((a, b) => new Date(a.scheduled_time || a.scheduled_at).getTime() - new Date(b.scheduled_time || b.scheduled_at).getTime());
  const upcoming = (tournament.next_matches_override?.length ? tournament.next_matches_override : scheduled) || [];

  return (
    <div className="space-y-4">
      {myMatch && !isMyMatchLive && <ReadyMatchCard match={myMatch} currentUser={currentUser} onRefresh={onRefresh} />}
      {myMatch && isMyMatchLive && <EvidenceSubmitForm match={myMatch} currentUser={currentUser} onRefresh={onRefresh} />}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-[#0a0a12] border border-white/10 p-4">
          <AnnouncementFeed items={tournament.announcements || []} />
        </div>
        <div className="rounded-2xl bg-[#0a0a12] border border-white/10 p-4">
          <h3 className="font-mono text-xs uppercase tracking-widest text-white/40 mb-3">Live Bracket</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {matches.map((match) => (
              <div
                key={match.id}
                className={`rounded-lg border p-3 ${
                  match.is_current_match
                    ? "border-cyan-500/80 animate-pulse"
                    : match.status === "completed"
                    ? "border-white/10 opacity-60"
                    : "border-white/10"
                }`}
              >
                <p className="font-mono text-sm text-white">
                  {match.participants?.[0]?.name || teamsById[match.team_a_id]?.name || "A"} vs{" "}
                  {match.participants?.[1]?.name || teamsById[match.team_b_id]?.name || "B"}
                </p>
                <p className="text-xs text-white/50">{match.status}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-[#0a0a12] border border-white/10 p-4">
          <LiveStandings topPlayers={topPlayers} topTeams={topTeams} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-[#0a0a12] border border-white/10 p-4">
          <ReportChat tournamentId={tournament.id} matchId={myMatch?.id} />
        </div>
        <div className="rounded-2xl bg-[#0a0a12] border border-white/10 p-4">
          <UpcomingMatchesList matches={upcoming} teamsById={teamsById} />
        </div>
      </div>
    </div>
  );
};

export default CommandTab;

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CountdownTimer from "@/components/tournament/CountdownTimer";
import PrizeStrip from "@/components/tournament/PrizeStrip";
import CommandTab from "@/components/tournament/CommandTab";
import BracketTab from "@/components/tournament/BracketTab";
import ResultsTab from "@/components/tournament/ResultsTab";
import EvidenceTab from "@/components/tournament/EvidenceTab";
import StandingsTab from "@/components/tournament/StandingsTab";
import EvidenceLightbox from "@/components/tournament/EvidenceLightbox";
import { useGames } from "@/context/GamesContext";
import { getCurrentUser, getMatches, getMyTournamentJoinRequest, getSoloProfiles, getTeams, getTournaments, updateMatch } from "@/lib/storage";
import { useRealtimeRefresh } from "@/components/hooks/useRealtimeRefresh";

const TournamentLive = () => {
  useRealtimeRefresh({
    keys: ["tournaments", "matches", "dispute_reports", "join_requests"],
    intervalMs: 4000,
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("id") || "";
  const { games } = useGames();
  const currentUser = useMemo(() => getCurrentUser(), []);

  const [tournament, setTournament] = useState(() => getTournaments().find((item) => item.id === tournamentId));
  const [matches, setMatches] = useState(() => getMatches().filter((item) => item.tournament_id === tournamentId));
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const approved = useMemo(() => {
    const req = getMyTournamentJoinRequest(tournamentId, currentUser.email);
    return req?.approval_status === "approved";
  }, [currentUser.email, tournamentId, tournament?.id, matches.length]);

  useEffect(() => {
    if (!approved) {
      toast.error("You need to be approved to enter.");
      navigate(`/Tournament?id=${tournamentId}&message=not_approved`);
    }
  }, [approved, navigate, tournamentId]);

  const refreshData = () => {
    setTournament(getTournaments().find((item) => item.id === tournamentId));
    setMatches(
      getMatches()
        .filter((item) => item.tournament_id === tournamentId)
        .sort((a, b) => new Date(a.scheduled_time || a.scheduled_at || 0).getTime() - new Date(b.scheduled_time || b.scheduled_at || 0).getTime())
    );
  };

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 2000);
    const onChange = () => refreshData();
    window.addEventListener("arenax:data-changed", onChange);
    return () => {
      clearInterval(timer);
      window.removeEventListener("arenax:data-changed", onChange);
    };
  }, [tournamentId]);

  if (!tournament) {
    return <div className="min-h-screen bg-[#050508] flex items-center justify-center text-white/70 font-mono">Tournament not found.</div>;
  }

  const game = games.find((item) => item.id === tournament.game_id);
  const teams = getTeams();
  const soloProfiles = getSoloProfiles();
  const teamsById = Object.fromEntries(teams.map((item) => [item.id, item]));
  const topPlayers = tournament.top_players_override?.length
    ? tournament.top_players_override
    : [...soloProfiles]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5)
        .map((profile, index) => ({
          rank: index + 1,
          name: profile.user_name || profile.in_game_name || profile.user_email,
          email: profile.user_email,
          mmr: profile.rating,
          badge: "ADVANCING",
        }));
  const topTeams = tournament.top_teams_override?.length
    ? tournament.top_teams_override
    : teams
        .filter((team) => tournament.registered_teams?.includes(team.id))
        .sort((a, b) => (b.wins || 0) - (a.wins || 0))
        .slice(0, 5)
        .map((team, index) => ({ rank: index + 1, name: team.name, wins: team.wins || 0, losses: team.losses || 0 }));

  const myMatch = matches.find((match) => (match.participants || []).some((p) => p.email === currentUser.email));
  const isMyMatchLive = Boolean(myMatch && myMatch.status === "live");
  const currentMatch =
    matches.find((match) => match.id === tournament.current_match_id) ||
    matches.find((match) => match.is_current_match) ||
    myMatch;
  const currentMatchLive = currentMatch?.status === "live";
  const watchers = 100 + (tournament.registered_teams?.length || 0) * 3 + (tournament.registered_solos?.length || 0) * 2;

  const onCountdownComplete = () => {
    if (currentMatch && currentMatch.status === "scheduled") {
      updateMatch(currentMatch.id, { status: "live" });
      refreshData();
    }
  };

  const openLightbox = (images, index = 0) => {
    if (!images?.length) return;
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white font-mono">
      <div className={`sticky top-0 z-40 border-b ${currentMatchLive ? "border-rose-500/40 bg-rose-950/10" : "border-cyan-500/20 bg-gradient-to-r from-cyan-950 via-slate-950 to-purple-950"}`}>
        <div className="container py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => navigate(-1)} className="text-xs uppercase tracking-widest text-white/60 hover:text-white">
              Back
            </button>
            <div className="flex items-center gap-3">
              {game?.logo_url && <img src={game.logo_url} alt={game.name} className="w-8 h-8 rounded object-cover" />}
              <span className="text-sm font-bold tracking-wide">{tournament.name}</span>
              <span className="inline-flex items-center gap-2 text-xs">
                {currentMatchLive ? (
                  <span className="text-rose-300 font-bold">LIVE NOW</span>
                ) : (
                  <>
                    <span className="animate-pulse bg-rose-500 rounded-full w-2 h-2 inline-block" />
                    <span className="text-white/70">LIVE</span>
                  </>
                )}
              </span>
            </div>
            <span className="text-xs text-white/50">{watchers} watching</span>
          </div>
          <div className="mt-4">
            {currentMatch ? (
              <CountdownTimer
                targetTime={currentMatch.scheduled_time || tournament.match_start_time}
                onComplete={onCountdownComplete}
                className="text-center"
              />
            ) : (
              <CountdownTimer targetTime={tournament.match_start_time} className="text-center" />
            )}
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-4">
        <PrizeStrip prizes={tournament.prizes} />
        <Tabs defaultValue="command">
          <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-cyan-500/20 p-0 h-auto">
            {[
              { key: "command", label: "COMMAND" },
              { key: "bracket", label: "BRACKET" },
              { key: "results", label: "RESULTS" },
              { key: "evidence", label: "EVIDENCE" },
              { key: "standings", label: "STANDINGS" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="rounded-none px-6 py-3 text-xs tracking-widest uppercase text-white/40 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="command" className="mt-4">
            <CommandTab
              tournament={tournament}
              matches={matches}
              teamsById={teamsById}
              currentUser={currentUser}
              myMatch={myMatch}
              isMyMatchLive={isMyMatchLive}
              topPlayers={topPlayers.map((p) => ({ ...p, rating: p.mmr || p.rating }))}
              topTeams={topTeams}
              onRefresh={refreshData}
            />
          </TabsContent>
          <TabsContent value="bracket" className="mt-4">
            <BracketTab matches={matches} publicBracket={tournament.public_bracket || []} />
          </TabsContent>
          <TabsContent value="results" className="mt-4">
            <ResultsTab results={tournament.results_log || []} onOpenImage={openLightbox} />
          </TabsContent>
          <TabsContent value="evidence" className="mt-4">
            <EvidenceTab matches={matches} onOpenImage={openLightbox} />
          </TabsContent>
          <TabsContent value="standings" className="mt-4">
            <StandingsTab players={topPlayers} teams={topTeams} />
          </TabsContent>
        </Tabs>
      </div>

      <EvidenceLightbox
        open={lightboxOpen}
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onPrev={() => setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length)}
        onNext={() => setLightboxIndex((i) => (i + 1) % lightboxImages.length)}
      />
    </div>
  );
};

export default TournamentLive;

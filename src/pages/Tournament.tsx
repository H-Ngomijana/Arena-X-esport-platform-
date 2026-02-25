import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Share2, Calendar, Users, Trophy, Shield, CheckCheck } from "lucide-react";
import GlowButton from "@/components/GlowButton";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTournaments, getTeams, getSoloProfiles, getCurrentUser, createJoinRequest, getPageBackgrounds, getMatches } from "@/lib/storage";
import TeamCard from "@/components/TeamCard";
import CreateSoloProfileDialog from "@/components/tournament/CreateSoloProfileDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "sonner";
import { useGames } from "@/context/GamesContext";

const Tournament = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showSoloDialog, setShowSoloDialog] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [profileType, setProfileType] = useState<"solo" | "team">("team");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [now, setNow] = useState(Date.now());
  const { getGameById } = useGames();

  const id = searchParams.get("id");
  const [tournamentData, setTournamentData] = useState<any | undefined>(() => getTournaments().find((t: any) => t.id === id));
  const game = getGameById(tournamentData?.game_id || "");
  const tournamentTeams = getTeams().filter((t) => tournamentData?.registered_teams?.includes(t.id));
  const tournamentMatches = getMatches().filter((m) => m.tournament_id === id);
  const currentUser = getCurrentUser();
  const allTeams = getTeams();
  const allSoloProfiles = getSoloProfiles();
  const tournamentPageBg = getPageBackgrounds().tournament_page_default;
  const standingsPlayers = tournamentData?.top_players_override || [];
  const standingsTeams = tournamentData?.top_teams_override || [];
  const announcements = tournamentData?.announcements || [];
  const portalResults = tournamentData?.results_log || [];
  const nextMatchesFromAdmin = tournamentData?.next_matches_override || [];
  const nextMatchesFromSystem = tournamentMatches
    .filter((item) => item.status === "scheduled")
    .map((item) => ({
      id: item.id,
      label: item.round_label || `Round ${item.round || 1}`,
      participant_a: item.participants?.[0]?.name || "TBD",
      participant_b: item.participants?.[1]?.name || "TBD",
      scheduled_time: item.scheduled_time || "",
      court: item.court || "Court 1",
    }));
  const nextMatches = (nextMatchesFromAdmin.length ? nextMatchesFromAdmin : nextMatchesFromSystem).sort(
    (a: any, b: any) => new Date(a.scheduled_time || 0).getTime() - new Date(b.scheduled_time || 0).getTime()
  );

  const myTeams = useMemo(() => {
    return allTeams.filter((team) => {
      const members = Array.isArray(team.members) ? team.members : [];
      return (
        team.game_id === tournamentData?.game_id &&
        (team.captain_id === currentUser.id || members.includes(currentUser.email) || members.includes(currentUser.id))
      );
    });
  }, [allTeams, currentUser.email, currentUser.id, tournamentData?.game_id, reloadKey]);

  const mySoloProfiles = useMemo(
    () =>
      allSoloProfiles.filter(
        (profile) => profile.game_id === tournamentData?.game_id && profile.user_email === currentUser.email
      ),
    [allSoloProfiles, currentUser.email, tournamentData?.game_id, reloadKey]
  );

  const { setTheme, resetTheme } = useTheme();

  useEffect(() => {
    if (game) {
      setTheme({
        primary: game.theme.primary as unknown as string,
        secondary: game.theme.secondary as unknown as string,
        accent: game.theme.accent as unknown as string,
        gradient_from: game.theme_config?.gradient_from || (game.theme.primary as unknown as string),
        gradient_to: game.theme_config?.gradient_to || (game.theme.secondary as unknown as string),
      });
    }
    return () => resetTheme();
  }, [game, setTheme, resetTheme]);

  useEffect(() => {
    const refresh = () => {
      setTournamentData(getTournaments().find((t: any) => t.id === id));
      setRefreshTick((n) => n + 1);
    };
    refresh();
    const onChange = () => refresh();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    window.addEventListener("arenax:data-changed", onChange);
    return () => {
      clearInterval(timer);
      window.removeEventListener("arenax:data-changed", onChange);
    };
  }, [id]);

  if (!tournamentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Tournament not found</p>
      </div>
    );
  }

  const registeredTeamsCount = tournamentData.registered_teams?.length || 0;
  const hasAnyProfile = myTeams.length > 0 || mySoloProfiles.length > 0;
  const entryAmount = Number(tournamentData.entry_fee_amount ?? tournamentData.entry_fee ?? 0);
  const entryCurrency = tournamentData.entry_fee_currency || "RWF";
  const countdownTarget = tournamentData.match_start_time ? new Date(tournamentData.match_start_time).getTime() : 0;
  const countdownDiff = countdownTarget ? Math.max(0, countdownTarget - now) : 0;
  const countdownDays = Math.floor(countdownDiff / (1000 * 60 * 60 * 24));
  const countdownHours = Math.floor((countdownDiff / (1000 * 60 * 60)) % 24);
  const countdownMinutes = Math.floor((countdownDiff / (1000 * 60)) % 60);
  const countdownSeconds = Math.floor((countdownDiff / 1000) % 60);

  const handleShare = () => {
    const url = `${window.location.origin}/Tournament?id=${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinTournament = () => {
    if (!selectedProfileId) {
      toast.error("Select a profile before joining");
      return;
    }
    if (entryAmount === 0) {
      const freeRef = `ARX-FREE-${Date.now()}`;
      createJoinRequest({
        tournament_id: tournamentData.id,
        tournament_name: tournamentData.name,
        user_email: currentUser.email,
        user_name: currentUser.name,
        profile_type: profileType === "solo" ? "solo" : "team",
        team_id: profileType === "team" ? selectedProfileId : undefined,
        team_name: profileType === "team" ? myTeams.find((t) => t.id === selectedProfileId)?.name : undefined,
        solo_profile_id: profileType === "solo" ? selectedProfileId : undefined,
        payment_status: "free",
        payment_reference: freeRef,
        sender_name: currentUser.name,
        sender_number: "N/A",
        amount_paid: 0,
        approval_status: "awaiting_approval",
      });
      toast.success("Request submitted (Free tournament). Awaiting admin approval.");
      return;
    }
    navigate(`/payment-flow?tournament=${tournamentData.id}&profile_type=${profileType}&profile_id=${selectedProfileId}`);
  };

  useEffect(() => {
    if (profileType === "team" && myTeams.length > 0 && !selectedProfileId) {
      setSelectedProfileId(myTeams[0].id);
      return;
    }
    if (profileType === "solo" && mySoloProfiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(mySoloProfiles[0].id);
    }
  }, [profileType, myTeams, mySoloProfiles, selectedProfileId, refreshTick]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <section className="relative h-80 overflow-hidden">
        {(tournamentData.banner_url || tournamentPageBg) && (
          <img
            src={tournamentData.banner_url || tournamentPageBg}
            alt={tournamentData.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        {game && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `linear-gradient(135deg, ${game.theme_config?.gradient_from || "#6366f1"}, ${game.theme_config?.gradient_to || "#1e293b"})`,
            }}
          />
        )}

        <div className="relative h-full flex flex-col justify-between p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  tournamentData.status === "registration_open"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : tournamentData.status === "in_progress"
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-slate-500/20 text-slate-300"
                }`}
              >
                {tournamentData.status?.replace(/_/g, " ").toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">{game?.name}</span>
            </div>
            <button onClick={handleShare} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              {copied ? <CheckCheck size={20} /> : <Share2 size={20} />}
            </button>
          </div>

          <div>
            <h1 className="text-5xl font-black leading-tight mb-4">{tournamentData.name}</h1>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{tournamentData.start_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>{registeredTeamsCount} teams</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy size={16} />
                <span>{tournamentData.prize_pool}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={16} />
                <span>{tournamentData.format}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mt-8 mb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6 border-white/10">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/10">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="bracket">Bracket</TabsTrigger>
                  <TabsTrigger value="teams">Teams</TabsTrigger>
                  <TabsTrigger value="rules">Rules</TabsTrigger>
                  <TabsTrigger value="portal">Portal</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-6 mt-6">
                  <div>
                    <h3 className="font-display font-bold mb-3">About</h3>
                    <p className="text-muted-foreground">{tournamentData.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 border-white/10">
                      <p className="text-xs text-muted-foreground mb-1">Format</p>
                      <p className="font-semibold">{tournamentData.format}</p>
                    </Card>
                    <Card className="p-4 border-white/10">
                      <p className="text-xs text-muted-foreground mb-1">Max Teams</p>
                      <p className="font-semibold">{tournamentData.max_teams}</p>
                    </Card>
                    <Card className="p-4 border-white/10">
                      <p className="text-xs text-muted-foreground mb-1">Entry Fee</p>
                      <p className="font-semibold">
                        {entryAmount > 0 ? `${entryAmount.toLocaleString()} ${entryCurrency}` : "FREE"}
                      </p>
                    </Card>
                    <Card className="p-4 border-white/10">
                      <p className="text-xs text-muted-foreground mb-1">Prize Pool</p>
                      <p className="font-semibold">{tournamentData.prize_pool}</p>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="bracket" className="mt-6">
                  <div className="space-y-2">
                    {(tournamentData.public_bracket || []).length > 0 ? (
                      (tournamentData.public_bracket || [])
                        .slice()
                        .sort((a: any, b: any) => Number(a.round_number || 1) - Number(b.round_number || 1))
                        .map((entry: any) => (
                          <div key={entry.id} className="w-full rounded-lg bg-white/5 p-3 border border-white/10">
                            <p className="text-xs text-white/50">Round {entry.round_number} - {entry.round_label}</p>
                            <p className="text-sm font-semibold">{entry.match_label}</p>
                            <p className="text-sm text-white/70">{entry.participant_a} vs {entry.participant_b}</p>
                            <p className="text-xs text-white/50 mt-1">
                              {entry.status} {entry.winner_name ? `| Winner: ${entry.winner_name}` : ""}
                            </p>
                          </div>
                        ))
                    ) : tournamentMatches.length > 0 ? (
                      tournamentMatches.map((match) => (
                        <button
                          key={match.id}
                          className="w-full text-left rounded-lg bg-white/5 p-3 hover:bg-white/10"
                          onClick={() => navigate(`/match-room?id=${match.id}`)}
                        >
                          <p className="text-sm">
                            Match #{match.id}: {match.status}
                          </p>
                        </button>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Bracket will be generated when tournament starts</p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="teams" className="mt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    {tournamentTeams.length > 0 ? (
                      tournamentTeams.map((team) => <TeamCard key={team.id} {...team} />)
                    ) : (
                      <p className="text-muted-foreground">Be the first to join!</p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="rules" className="mt-6">
                  <Card className="p-6 border-white/10">
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {tournamentData.tournament_rules || tournamentData.rules || "No specific rules have been set"}
                    </p>
                  </Card>
                </TabsContent>
                <TabsContent value="portal" className="mt-6 space-y-4">
                  <Card className="p-4 border-white/10 bg-white/[0.02]">
                    <p className="text-xs text-white/60 mb-2 uppercase tracking-wider">Admin Countdown</p>
                    {countdownTarget ? (
                      countdownDiff > 0 ? (
                        <p className="font-mono text-2xl text-white">
                          {String(countdownDays).padStart(2, "0")}d {String(countdownHours).padStart(2, "0")}h {String(countdownMinutes).padStart(2, "0")}m {String(countdownSeconds).padStart(2, "0")}s
                        </p>
                      ) : (
                        <p className="font-mono text-xl text-rose-300">MATCH IS LIVE NOW</p>
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">Countdown not set by admin yet.</p>
                    )}
                  </Card>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4 border-white/10 bg-white/[0.02]">
                      <p className="text-xs text-white/60 mb-2 uppercase tracking-wider">Announcements</p>
                      <div className="space-y-2 max-h-64 overflow-auto">
                        {announcements.length > 0 ? (
                          announcements.slice().reverse().map((item: any, idx: number) => (
                            <div key={`${item.created_at}-${idx}`} className="rounded border border-white/10 bg-black/20 p-2">
                              <p className="text-sm text-white">{item.title || item.message}</p>
                              <p className="text-xs text-white/50">{item.message}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No announcements yet.</p>
                        )}
                      </div>
                    </Card>

                    <Card className="p-4 border-white/10 bg-white/[0.02]">
                      <p className="text-xs text-white/60 mb-2 uppercase tracking-wider">Next Matches</p>
                      <div className="space-y-2 max-h-64 overflow-auto">
                        {nextMatches.length > 0 ? (
                          nextMatches.map((item: any) => (
                            <div key={item.id} className="rounded border border-white/10 bg-black/20 p-2">
                              <p className="text-sm text-white">{item.label}: {item.participant_a} vs {item.participant_b}</p>
                              <p className="text-xs text-white/50">
                                {item.scheduled_time ? new Date(item.scheduled_time).toLocaleString() : "TBD"} - {item.court || "Court 1"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No upcoming matches set.</p>
                        )}
                      </div>
                    </Card>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4 border-white/10 bg-white/[0.02]">
                      <p className="text-xs text-white/60 mb-2 uppercase tracking-wider">Suggested Results</p>
                      <div className="space-y-2 max-h-64 overflow-auto">
                        {portalResults.length > 0 ? (
                          portalResults.map((item: any, idx: number) => (
                            <div key={`${item.declared_at}-${idx}`} className="rounded border border-white/10 bg-black/20 p-2">
                              <p className="text-sm text-white">Round {item.round} - {item.match_label}</p>
                              <p className="text-xs text-white/50">Winner: {item.winner_name} | Loser: {item.loser_name} | Score: {item.score}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No results yet.</p>
                        )}
                      </div>
                    </Card>

                    <Card className="p-4 border-white/10 bg-white/[0.02]">
                      <p className="text-xs text-white/60 mb-2 uppercase tracking-wider">Standings</p>
                      <div className="space-y-2">
                        {standingsPlayers.length > 0 ? (
                          standingsPlayers.slice(0, 3).map((item: any) => (
                            <p key={`${item.rank}-${item.name}`} className="text-sm text-white">
                              #{item.rank} {item.name} - {item.mmr} MMR
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No player standings yet.</p>
                        )}
                        {standingsTeams.length > 0 ? (
                          standingsTeams.slice(0, 3).map((item: any) => (
                            <p key={`${item.rank}-${item.name}`} className="text-sm text-white">
                              #{item.rank} {item.name} - W:{item.wins} L:{item.losses}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No team standings yet.</p>
                        )}
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-white/10 space-y-4">
              <h3 className="font-display font-bold">Registration</h3>

              {!hasAnyProfile ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Create a team or solo profile before joining.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <GlowButton className="w-full" onClick={() => navigate(`/create-team?game=${game?.slug || ""}`)}>
                      Create Team
                    </GlowButton>
                    <GlowButton variant="secondary" className="w-full" onClick={() => setShowSoloDialog(true)}>
                      Create Solo Profile
                    </GlowButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-white/60">How will you compete?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setProfileType("solo");
                        setSelectedProfileId("");
                      }}
                      className={`h-10 rounded-lg border text-sm ${profileType === "solo" ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-white/70"}`}
                    >
                      SOLO
                    </button>
                    <button
                      onClick={() => {
                        setProfileType("team");
                        setSelectedProfileId("");
                      }}
                      className={`h-10 rounded-lg border text-sm ${profileType === "team" ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-white/70"}`}
                    >
                      TEAM
                    </button>
                  </div>
                  {profileType === "solo" ? (
                    <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                      <SelectTrigger className="bg-slate-900 border-white/10">
                        <SelectValue placeholder="Select solo profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {mySoloProfiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.in_game_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                      <SelectTrigger className="bg-slate-900 border-white/10">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {myTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <GlowButton className="w-full" disabled={!selectedProfileId} onClick={joinTournament}>
                    {entryAmount > 0
                      ? `JOIN - Pay ${entryAmount.toLocaleString()} ${entryCurrency}`
                      : "JOIN TOURNAMENT"}
                  </GlowButton>
                </div>
              )}
            </Card>

            <Card className="p-6 border-white/10">
              <h3 className="font-display font-bold mb-4">Organizer</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
                  {tournamentData.organizer_email?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-muted-foreground">{tournamentData.organizer_email}</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <CreateSoloProfileDialog
        open={showSoloDialog}
        onOpenChange={setShowSoloDialog}
        gameId={tournamentData.game_id}
        onCreated={() => setReloadKey((v) => v + 1)}
      />
    </div>
  );
};

export default Tournament;

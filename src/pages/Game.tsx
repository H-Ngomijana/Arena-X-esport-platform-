import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Users, Zap, BarChart3 } from "lucide-react";
import GlowButton from "@/components/GlowButton";
import StatCard from "@/components/StatCard";
import TeamCard from "@/components/TeamCard";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGames } from "@/context/GamesContext";
import { useTheme } from "@/context/ThemeContext";
import { getTournaments, getTeams, getSoloProfiles, getPageBackgrounds } from "@/lib/storage";
import CreateSoloProfileDialog from "@/components/tournament/CreateSoloProfileDialog";

const Game = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getGameBySlug } = useGames();
  const { setTheme, resetTheme } = useTheme();
  const [activeFilter, setActiveFilter] = useState("All");
  const [showSoloDialog, setShowSoloDialog] = useState(false);
  const [soloRefreshKey, setSoloRefreshKey] = useState(0);

  const slug = searchParams.get("slug");
  const game = getGameBySlug(slug || "");
  const gameTeams = getTeams().filter((item) => item.game_id === game?.id);
  const gameTournaments = getTournaments().filter((item) => item.game_id === game?.id);
  const pageBackgrounds = getPageBackgrounds();
  const gamePageBackground = game?.background_url || game?.banner_url || pageBackgrounds.game_page_default;
  const soloProfiles = useMemo(
    () => getSoloProfiles().filter((profile) => profile.game_id === game?.id),
    [game?.id, soloRefreshKey]
  );

  useEffect(() => {
    if (game?.theme_config) {
      setTheme({
        primary: game.theme_config.gradient_from,
        secondary: game.theme_config.gradient_to,
        accent: game.theme_config.gradient_from,
        gradient_from: game.theme_config.gradient_from,
        gradient_to: game.theme_config.gradient_to,
      });
    }
    return () => resetTheme();
  }, [game, setTheme, resetTheme]);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Game not found</p>
      </div>
    );
  }

  const topTeams = gameTeams.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
  const topPlayers = soloProfiles
    .slice()
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 10);
  const tournamentsFiltered = gameTournaments.filter((item) => {
    if (activeFilter === "Open Registration") return item.status === "registration_open";
    if (activeFilter === "Live Now") return item.status === "in_progress";
    if (activeFilter === "Completed") return item.status === "completed";
    return true;
  });

  const getCountdown = (target: string) => {
    const deltaMs = new Date(target).getTime() - Date.now();
    if (deltaMs <= 0) return "LIVE NOW";
    const hours = Math.floor(deltaMs / 3600000);
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <section className="relative h-80 overflow-hidden">
        {gamePageBackground && (
          <img src={gamePageBackground} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        {game.theme_config && (
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: `linear-gradient(135deg, ${game.theme_config.gradient_from}, ${game.theme_config.gradient_to})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="relative h-full flex flex-col items-center justify-end p-6 pb-12">
          {game.logo_url && <img src={game.logo_url} alt={game.name} className="w-24 h-24 rounded-2xl mb-6 object-cover" />}
          <h1 className="text-5xl font-display font-black text-center mb-3">{game.name}</h1>
          <p className="text-muted-foreground text-center max-w-md">{game.description}</p>
        </div>
      </section>

      <section className="container -mt-6 relative z-10 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Tournaments" value={gameTournaments.length.toString()} icon={<Trophy size={18} />} />
          <StatCard label="Total Teams" value={gameTeams.length.toString()} icon={<Users size={18} />} />
          <StatCard label="Ranked Players" value={soloProfiles.length.toString()} icon={<BarChart3 size={18} />} />
          <StatCard label="Total Tournaments" value={gameTournaments.length.toString()} icon={<Zap size={18} />} />
        </div>
      </section>

      <section className="container mb-10">
        <Card className="p-6 border-white/10 space-y-5">
          <div>
            <h2 className="text-2xl font-display font-black">Join the Action</h2>
            <p className="text-sm text-muted-foreground mt-1">Create your team or solo profile to join live tournaments.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <GlowButton onClick={() => navigate(`/create-team?game=${game.slug}`)} className="w-full">
              Create Team
            </GlowButton>
            <GlowButton variant="secondary" onClick={() => setShowSoloDialog(true)} className="w-full">
              Create Solo Profile
            </GlowButton>
            <GlowButton
              variant="ghost"
              onClick={() => document.getElementById("game-tournaments")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full border border-white/20"
            >
              Browse Tournaments
            </GlowButton>
          </div>
          <p className="text-xs text-white/50">Solo profiles for this game: {soloProfiles.length}</p>
        </Card>
      </section>

      <section className="container mb-12" id="game-tournaments">
        <Card className="p-6 border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h3 className="text-xl font-display font-bold">Live Tournaments</h3>
            <div className="flex gap-2 flex-wrap">
              {["All", "Open Registration", "Live Now", "Completed"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    activeFilter === filter ? "border-primary/50 bg-primary/20 text-primary" : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {tournamentsFiltered.map((tournament) => {
              const entryAmount = Number(tournament.entry_fee_amount ?? tournament.entry_fee ?? 0);
              const entryCurrency = tournament.entry_fee_currency || "RWF";
              return (
                <Card key={tournament.id} className="overflow-hidden border-white/10 bg-white/[0.02]">
                  {tournament.banner_url ? (
                    <img src={tournament.banner_url} alt={tournament.name} className="h-28 w-full object-cover opacity-80" />
                  ) : (
                    <div className="h-28 w-full bg-gradient-to-r from-slate-800 to-slate-900" />
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-lg font-bold">{tournament.name}</h4>
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                          tournament.status === "in_progress" ? "bg-emerald-500/20 text-emerald-300 animate-pulse" : "bg-white/10 text-white/70"
                        }`}
                      >
                        {tournament.status === "in_progress" ? "LIVE" : tournament.status.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">
                      Starts in: {getCountdown(tournament.match_start_time || `${tournament.start_date}T18:00:00.000Z`)}
                    </p>
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span>{tournament.registered_teams?.length || 0}/{tournament.max_teams} teams</span>
                      <span className={`px-2 py-1 rounded-full ${entryAmount > 0 ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                        {entryAmount > 0 ? `${entryAmount.toLocaleString()} ${entryCurrency}` : "FREE"}
                      </span>
                    </div>
                    <div className="text-sm text-white/70">
                      1st {tournament.prizes?.first || "500,000 RWF"} | 2nd {tournament.prizes?.second || "200,000 RWF"} | 3rd {tournament.prizes?.third || "100,000 RWF"}
                    </div>
                    <Button className="w-full" variant="outline" onClick={() => navigate(`/Tournament?id=${tournament.id}`)}>
                      VIEW DETAILS
                    </Button>
                  </div>
                </Card>
              );
            })}
            {tournamentsFiltered.length === 0 && <p className="text-muted-foreground">No tournaments in this filter.</p>}
          </div>
        </Card>
      </section>

      <section className="container mb-12">
        <Card className="p-6 border-white/10">
          <Tabs defaultValue="tournaments" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
              <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
              <TabsTrigger value="teams">Top Teams</TabsTrigger>
              <TabsTrigger value="rankings">Rankings</TabsTrigger>
            </TabsList>

            <TabsContent value="tournaments" className="mt-6">
              <div className="grid md:grid-cols-3 gap-4">
                {gameTournaments.length > 0 ? (
                  gameTournaments.map((tournament) => (
                    <Card key={tournament.id} className="p-4 border-white/10 bg-white/[0.02]">
                      <p className="text-sm font-semibold">{tournament.name}</p>
                      <p className="text-xs text-white/60 mt-1">{tournament.status.replace(/_/g, " ")}</p>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground">No tournaments available</p>
                )}
              </div>
              {gameTournaments.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <Link to="/tournaments">
                    <Button variant="outline">View All</Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="teams" className="mt-6">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {topTeams.length > 0 ? topTeams.map((team) => <TeamCard key={team.id} {...team} />) : <p className="text-muted-foreground">No teams available</p>}
              </div>
              <div className="flex gap-3">
                <GlowButton>Create Team</GlowButton>
              </div>
            </TabsContent>

            <TabsContent value="rankings" className="mt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="w-20">#</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPlayers.map((player, index) => (
                      <motion.tr key={player.id} whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }} className="border-white/10">
                        <TableCell className="font-bold">#{index + 1}</TableCell>
                        <TableCell className="font-medium">{player.in_game_name || player.user_name || player.user_email}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">{player.rank_tier || "Bronze"}</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{player.rating || 0}</TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 flex justify-center">
                <Link to={`/rankings?game=${game.id}`}>
                  <Button variant="outline">Full Leaderboard</Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </section>

      <CreateSoloProfileDialog
        open={showSoloDialog}
        onOpenChange={setShowSoloDialog}
        gameId={game.id}
        onCreated={() => setSoloRefreshKey((value) => value + 1)}
      />
    </div>
  );
};

export default Game;

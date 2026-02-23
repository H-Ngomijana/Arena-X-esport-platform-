import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Zap, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import StatCard from "@/components/StatCard";
import RankBadge from "@/components/RankBadge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { matches, users } from "@/lib/mock-data";
import { useTheme } from "@/context/ThemeContext";
import { getPageBackgrounds, getTeams, getTournaments } from "@/lib/storage";
import { useGames } from "@/context/GamesContext";

const Team = () => {
  const [searchParams] = useSearchParams();
  const { getGameById } = useGames();

  const id = searchParams.get("id");
  const allTeams = getTeams();
  const team = allTeams.find((t) => t.id === id);
  const game = getGameById(team?.game_id || "");
  const teamMatches = matches.filter((m) => m.team_a_id === id || m.team_b_id === id);
  const tournaments = getTournaments();
  const teamTournaments = tournaments.filter((t) => t.registered_teams?.includes(id));
  const teamMembers = users.filter((u) => team?.members?.includes(u.id));
  const pageBackgrounds = getPageBackgrounds();
  const teamPageBackground = team?.banner_url || pageBackgrounds.team_page_default;

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
    return () => {
      resetTheme();
    };
  }, [game, setTheme, resetTheme]);

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Team not found</p>
      </div>
    );
  }

  const wins = teamMatches.filter(
    (m) =>
      (m.team_a_id === id && m.team_a_score > m.team_b_score) ||
      (m.team_b_id === id && m.team_b_score > m.team_a_score)
  ).length;
  const losses = teamMatches.filter(
    (m) =>
      (m.team_a_id === id && m.team_a_score < m.team_b_score) ||
      (m.team_b_id === id && m.team_b_score < m.team_a_score)
  ).length;
  const winRate = teamMatches.length > 0 ? ((wins / teamMatches.length) * 100).toFixed(1) : "0";

  // Mock rating history data
  const ratingHistory = [
    { date: "Day 1", rating: 900 },
    { date: "Day 2", rating: 950 },
    { date: "Day 3", rating: 920 },
    { date: "Day 4", rating: 1000 },
    { date: "Day 5", rating: 1050 },
    { date: "Day 6", rating: 1100 },
    { date: "Today", rating: team.rating },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative h-80 overflow-hidden">
        {teamPageBackground && (
          <img
            src={teamPageBackground}
            alt={team.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        {game && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `linear-gradient(135deg, ${game.theme_config?.gradient_from || "#6366f1"}, ${
                game.theme_config?.gradient_to || "#1e293b"
              })`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

        <div className="relative h-full flex flex-col items-center justify-end p-6 pb-12">
          {team.logo_url && (
            <img src={team.logo_url} alt={team.name} className="w-24 h-24 rounded-2xl mb-4 object-cover" />
          )}
          <h1 className="text-4xl font-black mb-2">{team.name}</h1>
          <div className="flex items-center gap-3 text-muted-foreground mb-3">
            <span className="text-2xl font-bold text-primary">{team.tag}</span>
            <span>•</span>
            <span>{game?.name}</span>
            <span>•</span>
            <span>{teamMembers.length} members</span>
          </div>
          <RankBadge tier={team.rank_tier} />
        </div>
      </section>

      {/* Stats Row */}
      <section className="container -mt-6 relative z-10 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Wins" value={wins.toString()} icon={<Trophy size={18} />} trend="up" />
          <StatCard label="Losses" value={losses.toString()} icon={<Target size={18} />} />
          <StatCard label="Win Rate" value={`${winRate}%`} icon={<TrendingUp size={18} />} />
          <StatCard label="Tournaments Won" value={team.tournaments_won?.toString() || "0"} icon={<Zap size={18} />} />
        </div>
      </section>

      {/* Main Content */}
      <section className="container mb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2">
            <Card className="p-6 border-white/10">
              <Tabs defaultValue="matches" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
                  <TabsTrigger value="matches">Match History</TabsTrigger>
                  <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                {/* Match History */}
                <TabsContent value="matches" className="mt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead>Opponent</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamMatches.length > 0 ? (
                          teamMatches.map((match) => {
                            const isWin =
                              (match.team_a_id === id && match.team_a_score > match.team_b_score) ||
                              (match.team_b_id === id && match.team_b_score > match.team_a_score);
                            const opponent = match.team_a_id === id ? match.team_b_id : match.team_a_id;
                            const opponentTeam = allTeams.find((t) => t.id === opponent);
                            const score =
                              match.team_a_id === id
                                ? `${match.team_a_score}-${match.team_b_score}`
                                : `${match.team_b_score}-${match.team_a_score}`;

                            return (
                              <motion.tr
                                key={match.id}
                                whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                                className="border-white/10"
                              >
                                <TableCell className="font-medium">{opponentTeam?.name}</TableCell>
                                <TableCell className="font-semibold">{score}</TableCell>
                                <TableCell>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      isWin ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                                    }`}
                                  >
                                    {isWin ? "Win" : "Loss"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{match.scheduled_at}</TableCell>
                              </motion.tr>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No matches yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Tournaments */}
                <TabsContent value="tournaments" className="mt-6">
                  <div className="space-y-3">
                    {teamTournaments.length > 0 ? (
                      teamTournaments.map((tournament) => (
                        <motion.div
                          key={tournament.id}
                          whileHover={{ x: 4 }}
                          className="p-4 rounded-lg border border-white/10 hover:border-primary/50 transition-colors cursor-pointer"
                        >
                          <p className="font-medium">{tournament.name}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{tournament.game_name}</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded-full ${
                              tournament.status === "registration_open"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-blue-500/20 text-blue-300"
                            }`}>
                              {tournament.status?.replace(/_/g, " ")}
                            </span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No tournaments registered</p>
                    )}
                  </div>
                </TabsContent>

                {/* Performance */}
                <TabsContent value="performance" className="mt-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ratingHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                        <YAxis stroke="rgba(255,255,255,0.5)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15,23,42,0.95)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="rating"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={{ fill: "#6366f1", r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Rank Badge Card */}
            <Card className="p-6 border-white/10 text-center">
              <h3 className="font-display font-bold mb-4">Current Rank</h3>
              <div className="flex justify-center mb-4">
                <RankBadge tier={team.rank_tier} size="lg" />
              </div>
              <p className="text-2xl font-bold mb-1">{team.rating} MMR</p>
              <p className="text-xs text-muted-foreground">{team.rank_tier} Tier</p>
            </Card>

            {/* Roster Card */}
            <Card className="p-6 border-white/10">
              <h3 className="font-display font-bold mb-4">Roster</h3>
              <div className="space-y-3">
                {teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      whileHover={{ x: 4 }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                        {member.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      {team.captain_id === member.id && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 whitespace-nowrap">
                          Captain
                        </span>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No members yet</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Team;

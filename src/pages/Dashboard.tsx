import { Bell, Shield, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import GlowButton from "@/components/GlowButton";
import StatCard from "@/components/StatCard";
import TeamCard from "@/components/TeamCard";
import RankBadge from "@/components/RankBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getMatches, getTeams, getTournaments, getUserNotifications } from "@/lib/storage";
import { useRealtimeRefresh } from "@/components/hooks/useRealtimeRefresh";

const Dashboard = () => {
  useRealtimeRefresh({
    keys: ["teams", "matches", "tournaments", "user_notifications", "arenax_current_user"],
    intervalMs: 10000,
  });

  const user = getCurrentUser();
  if (user.is_guest) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a12] p-6 text-center">
          <h2 className="text-2xl font-black mb-2">Sign in Required</h2>
          <p className="text-sm text-white/70 mb-4">Login to access your dashboard, teams, and tournament history.</p>
          <Link to={`/auth?redirect=${encodeURIComponent("/dashboard")}`}>
            <GlowButton className="w-full">LOGIN / SIGN UP</GlowButton>
          </Link>
        </div>
      </div>
    );
  }
  const tournaments = getTournaments();
  const teams = getTeams();
  const matches = getMatches();
  const notifications = getUserNotifications(user.email);

  const userTeams = teams.filter((t) => {
    const members = Array.isArray(t.members) ? t.members : [];
    return t.captain_id === user.id || members.includes(user.id) || members.includes(user.email);
  });

  const userMatches = matches
    .filter((m) => {
      const participants = Array.isArray(m.participants) ? m.participants : [];
      const byParticipant = participants.some((p) => p.email === user.email);
      const byTeam = userTeams.some((t) => t.id === m.team_a_id || t.id === m.team_b_id);
      return byParticipant || byTeam;
    })
    .slice(0, 5);

  const userTournaments = tournaments
    .filter((t) => userTeams.some((team) => t.registered_teams?.includes(team.id)))
    .slice(0, 3);

  const totalWins = userTeams.reduce((sum, t) => sum + Number(t.wins || 0), 0);
  const totalLosses = userTeams.reduce((sum, t) => sum + Number(t.losses || 0), 0);
  const winRate = totalWins + totalLosses > 0 ? `${Math.round((totalWins / (totalWins + totalLosses)) * 100)}%` : "0%";
  const bestRating = userTeams.length ? Math.max(...userTeams.map((t) => Number(t.rating || 0))) : 0;
  const tier = userTeams[0]?.rank_tier || "Bronze";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <section className="relative overflow-hidden pt-20">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                Welcome back, <span className="gradient-text">{user.name}</span>!
              </h1>
              <p className="text-muted-foreground">Continue your championship journey</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground">
                <Bell size={20} />
                {notifications.some((n) => !n.read) && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />}
              </button>
              <Link to="/create-team">
                <GlowButton size="sm">Create Team</GlowButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mt-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Matches" value={String(userMatches.length)} icon={<Calendar size={18} />} trend="up" />
          <StatCard label="Win Rate" value={winRate} icon={<TrendingUp size={18} />} trend="up" />
          <StatCard label="Best Rating" value={bestRating.toLocaleString()} icon={<TrendingUp size={18} />} />
          <StatCard label="Teams" value={userTeams.length.toString()} icon={<Shield size={18} />} trend="up" />
        </div>
      </section>

      <section className="container mb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-display font-bold mb-6">Upcoming Matches</h2>
              <div className="space-y-4">
                {userMatches.length > 0 ? (
                  userMatches.map((match) => (
                    <Link key={match.id} to={`/match-room?id=${match.id}`}>
                      <motion.div whileHover={{ scale: 1.02 }} className="card p-4 rounded-xl border border-white/10 hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">{match.round_label || `Match #${match.id}`}</p>
                            <p className="text-xs text-muted-foreground mt-1">{match.scheduled_time || match.scheduled_at || "TBD"}</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">{match.status}</span>
                        </div>
                      </motion.div>
                    </Link>
                  ))
                ) : (
                  <div className="card p-12 rounded-xl border border-white/10 text-center">
                    <Calendar className="mx-auto text-muted-foreground mb-3" size={24} />
                    <p className="text-muted-foreground mb-4">No upcoming matches</p>
                    <Link to="/tournaments">
                      <Button variant="outline" size="sm">Browse Tournaments</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold">My Teams</h2>
                <Link to="/create-team">
                  <Button variant="outline" size="sm">Create Team</Button>
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {userTeams.length > 0 ? (
                  userTeams.map((team) => <TeamCard key={team.id} {...team} />)
                ) : (
                  <div className="card p-12 rounded-xl border border-white/10 text-center md:col-span-2">
                    <Shield className="mx-auto text-muted-foreground mb-3" size={24} />
                    <p className="text-muted-foreground mb-4">Create your first team</p>
                    <Link to="/create-team">
                      <GlowButton size="sm">Create Team</GlowButton>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-white/10">
              <h3 className="font-display font-bold mb-4">Active Tournaments</h3>
              <div className="space-y-3">
                {userTournaments.length > 0 ? (
                  userTournaments.map((tournament) => (
                    <Link key={tournament.id} to={`/tournament?id=${tournament.id}`}>
                      <motion.div whileHover={{ x: 4 }} className="p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                        <p className="font-medium text-sm">{tournament.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{tournament.game_name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">{tournament.status}</span>
                        </div>
                      </motion.div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No active tournaments</p>
                )}
              </div>
            </Card>

            <Card className="p-6 border-white/10">
              <h3 className="font-display font-bold mb-4">Your Rankings</h3>
              <div className="space-y-3">
                <RankBadge tier={tier as any} />
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/rankings">View Leaderboards</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

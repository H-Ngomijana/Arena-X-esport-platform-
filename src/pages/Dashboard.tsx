import { Bell, Shield, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import GlowButton from "@/components/GlowButton";
import StatCard from "@/components/StatCard";
import TeamCard from "@/components/TeamCard";
import RankBadge from "@/components/RankBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { users, teams, matches } from "@/lib/mock-data";
import { getTournaments } from "@/lib/storage";

const Dashboard = () => {
  const user = users[0]; // Mock current user
  const tournaments = getTournaments();
  const userTeams = teams.filter((t) => t.captain_id === user.id || t.members.includes(user.id));
  const userMatches = matches.filter((m) => 
    m.team_a_id === user.id || m.team_b_id === user.id || 
    userTeams.some(t => t.id === m.team_a_id || t.id === m.team_b_id)
  ).slice(0, 5);
  const userTournaments = tournaments.filter((t) => 
    userTeams.some((team) => t.registered_teams?.includes(team.id))
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Header */}
      <section className="relative overflow-hidden pt-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-1/4 w-96 h-96 bg-slate-600/20 rounded-full blur-3xl" />
        </div>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between mb-8"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                Welcome back, <span className="gradient-text">{user.name}</span>!
              </h1>
              <p className="text-muted-foreground">Continue your championship journey</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
              </button>
              <Link to="/create-team">
                <GlowButton size="sm">Create Team</GlowButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="container mt-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Matches" value="24" icon={<Calendar size={18} />} trend="up" />
          <StatCard label="Win Rate" value="62%" icon={<TrendingUp size={18} />} trend="up" />
          <StatCard label="Best Rating" value="1,847" icon={<TrendingUp size={18} />} />
          <StatCard label="Teams" value={userTeams.length.toString()} icon={<Shield size={18} />} trend="up" />
        </div>
      </section>

      {/* Main Grid */}
      <section className="container mb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Matches */}
            <div>
              <h2 className="text-2xl font-display font-bold mb-6">Upcoming Matches</h2>
              <div className="space-y-4">
                {userMatches.length > 0 ? (
                  userMatches.map((match) => (
                    <Link key={match.id} to={`/match-room?id=${match.id}`}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="card p-4 rounded-xl border border-white/10 hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">
                              {teams.find(t => t.id === match.team_a_id)?.name} vs{" "}
                              {teams.find(t => t.id === match.team_b_id)?.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {match.scheduled_at}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            match.status === 'live' ? 'bg-rose-500/20 text-rose-300' :
                            match.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {match.status}
                          </span>
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

            {/* My Teams */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold">My Teams</h2>
                <Link to="/create-team">
                  <Button variant="outline" size="sm">Create Team</Button>
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {userTeams.length > 0 ? (
                  userTeams.map((team) => (
                    <TeamCard key={team.id} {...team} />
                  ))
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

          {/* Right Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Active Tournaments */}
            <Card className="p-6 border-white/10">
              <h3 className="font-display font-bold mb-4">Active Tournaments</h3>
              <div className="space-y-3">
                {userTournaments.length > 0 ? (
                  userTournaments.map((tournament) => (
                    <Link key={tournament.id} to={`/tournament?id=${tournament.id}`}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <p className="font-medium text-sm">{tournament.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{tournament.game_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tournament.status === 'registration_open' 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {tournament.status === 'registration_open' ? 'Open' : 'Live'}
                          </span>
                        </div>
                      </motion.div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No active tournaments</p>
                )}
              </div>
            </Card>

            {/* Your Rankings */}
            <Card className="p-6 border-white/10">
              <h3 className="font-display font-bold mb-4">Your Rankings</h3>
              <div className="space-y-3">
                <RankBadge tier={user.rank_tier} />
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/rankings">View Leaderboards</Link>
                </Button>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
              <h3 className="font-display font-bold mb-4 relative">Quick Actions</h3>
              <div className="space-y-2 relative">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/tournaments">→ Browse Tournaments</Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/rankings">→ View Leaderboards</Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/games">→ Explore Games</Link>
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

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Trophy, Swords, Users, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import GlowButton from "@/components/GlowButton";
import StatCard from "@/components/StatCard";
import TournamentCard from "@/components/TournamentCard";
import GameCard from "@/components/GameCard";
import { useGames } from "@/context/GamesContext";
import heroBanner from "@/assets/hero-banner.jpg";
import HowItWorks from "@/components/HowItWorks";
import { getMediaFeed, getMatches, getSoloProfiles, getTeams, getTournaments, getJoinRequests } from "@/lib/storage";
import { getHomeHeroVideoBlob, getHomeHeroVideoMeta } from "@/lib/hero-video";
import { useRealtimeRefresh } from "@/components/hooks/useRealtimeRefresh";

const DEFAULT_HERO_VIDEO = "/home-hero-default.mp4";

const Index = () => {
  useRealtimeRefresh({
    keys: ["tournaments", "announcements", "media_feed", "arenax_games"],
    intervalMs: 10000,
  });
  const { games } = useGames();
  const tournaments = getTournaments();
  const featuredTournaments = tournaments
    .filter((t) => t.featured || t.status === "in_progress")
    .slice(0, 3);
  const featuredGames = games.slice(0, 4);
  const allMediaFeed = getMediaFeed();
  const mediaFeed = allMediaFeed.slice(0, 6);
  const matches = getMatches();
  const teams = getTeams();
  const soloProfiles = getSoloProfiles();
  const joinRequests = getJoinRequests();
  const latestStageImage = allMediaFeed.find((item) => item.kind === "image")?.url || heroBanner;
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>("");
  const [defaultVideoFailed, setDefaultVideoFailed] = useState(false);
  const hasHeroVideoRef = useRef(false);
  const resolvedHeroVideo = heroVideoUrl || (!defaultVideoFailed ? DEFAULT_HERO_VIDEO : "");

  const parseAmount = (value: unknown): number => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const cleaned = String(value ?? "").replace(/[^0-9.]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const uniquePlayers = new Set<string>();
  soloProfiles.forEach((profile) => {
    if (profile.user_email) uniquePlayers.add(profile.user_email);
  });
  joinRequests.forEach((req) => {
    if (req.user_email) uniquePlayers.add(req.user_email);
  });
  teams.forEach((team) => {
    (team.members || []).forEach((member: string) => {
      if (typeof member === "string" && member.includes("@")) uniquePlayers.add(member);
    });
    if (typeof team.captain_id === "string" && team.captain_id.includes("@")) uniquePlayers.add(team.captain_id);
  });
  const activePlayersCount = uniquePlayers.size;
  const tournamentsCount = tournaments.length;
  const prizeDistributedAmount = tournaments
    .filter((t) => t.status === "completed")
    .reduce((acc, t) => acc + parseAmount(t.prize_pool), 0);
  const liveMatchesCount = matches.filter((m) => m.status === "live").length;

  const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
  const activePlayersValue = activePlayersCount > 0 ? `${compact.format(activePlayersCount)}+` : "0";
  const prizeDistributedValue = prizeDistributedAmount > 0 ? `${compact.format(prizeDistributedAmount)} RWF` : "0 RWF";
  const liveMatchesValue =
    liveMatchesCount > 0
      ? liveMatchesCount
      : tournaments.filter((t) => t.status === "in_progress").length;

  useEffect(() => {
    let active = true;
    let currentUrl = "";

    const loadHeroVideo = async () => {
      try {
        const blob = await getHomeHeroVideoBlob();
        if (!active) return;
        if (blob) {
          const nextUrl = URL.createObjectURL(blob);
          if (currentUrl && currentUrl !== nextUrl) {
            URL.revokeObjectURL(currentUrl);
          }
          currentUrl = nextUrl;
          hasHeroVideoRef.current = true;
          setHeroVideoUrl(nextUrl);
        } else {
          const meta = await getHomeHeroVideoMeta();
          if (!meta) {
            hasHeroVideoRef.current = false;
            if (currentUrl) {
              URL.revokeObjectURL(currentUrl);
              currentUrl = "";
            }
            setHeroVideoUrl("");
            return;
          }
          if (!hasHeroVideoRef.current) {
            // Keep image fallback on first load if no blob is available yet.
            // Do not clear an already-playing video on temporary fetch errors.
            setHeroVideoUrl("");
          }
        }
      } catch {
        if (!hasHeroVideoRef.current) {
          setHeroVideoUrl("");
        }
      }
    };

    loadHeroVideo();
    const onHeroUpdate = () => {
      loadHeroVideo();
    };
    const onDataChanged = () => {
      loadHeroVideo();
    };
    const poll = window.setInterval(loadHeroVideo, 15000);
    window.addEventListener("arenax:hero-video-updated", onHeroUpdate as EventListener);
    window.addEventListener("arenax:data-changed", onDataChanged as EventListener);
    return () => {
      active = false;
      window.clearInterval(poll);
      window.removeEventListener("arenax:hero-video-updated", onHeroUpdate as EventListener);
      window.removeEventListener("arenax:data-changed", onDataChanged as EventListener);
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, []);

  return (
  <div>
    {/* Hero */}
    <section className="relative min-h-[88vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        {resolvedHeroVideo ? (
          <video
            key={resolvedHeroVideo}
            src={resolvedHeroVideo}
            className="w-full h-full object-cover opacity-42"
            autoPlay
            muted
            loop
            preload="auto"
            playsInline
            onError={() => {
              if (heroVideoUrl) {
                setHeroVideoUrl("");
                hasHeroVideoRef.current = false;
                return;
              }
              setDefaultVideoFailed(true);
            }}
          />
        ) : (
          <img src={heroBanner} alt="Arena" className="w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/55 to-background/80" />
      </div>

      <div className="container relative z-10 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center"
        >
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-6">
              <Zap size={12} /> 5 GAMES FOR THE COMPETITION
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black leading-[0.92] mb-5">
              HOST TOURNAMENTS
              <br />
              & COMPETE FOR
              <br />
              PRIZES & <span className="gradient-text">WIN</span>
              <br />
              ON ONE PLATFORM.
            </h1>
            <p className="text-sm sm:text-base text-white/72 mb-8 max-w-xl">
              Create your own prize-pool tournaments or join existing ones. Everything from brackets to payouts happens
              automatically for organizers and players.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/tournaments">
                <GlowButton size="lg">
                  <Swords size={18} /> Start Now
                </GlowButton>
              </Link>
              <Link to="/dashboard">
                <GlowButton variant="secondary" size="lg">
                  Sign In <ArrowRight size={16} />
                </GlowButton>
              </Link>
              <Link to="/create-team">
                <GlowButton variant="secondary" size="lg">
                  <Users size={18} /> Create Team
                </GlowButton>
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              className="relative h-[480px] rounded-[28px] border border-cyan-400/25 bg-slate-950/30 overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.28)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-blue-500/20" />
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                <span className="text-[10px] font-mono tracking-widest text-cyan-200/90">ARENA-X LIVE STAGE</span>
                <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-cyan-400/15 border border-cyan-300/35 text-cyan-200">
                  PLAY NOW
                </span>
              </div>
              {resolvedHeroVideo ? (
                <video
                  key={`${resolvedHeroVideo}-panel`}
                  src={resolvedHeroVideo}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  preload="auto"
                  playsInline
                />
              ) : (
                <img src={latestStageImage} alt="Arena visual" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060a1d]/45 via-transparent to-[#040816]/20" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Stats */}
    <section className="container -mt-12 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Players" value={activePlayersValue} icon={<Users size={18} />} trend="up" />
        <StatCard label="Tournaments" value={tournamentsCount} icon={<Trophy size={18} />} trend="up" />
        <StatCard label="Prize Distributed" value={prizeDistributedValue} icon={<Zap size={18} />} />
        <StatCard label="Live Matches" value={liveMatchesValue} icon={<Swords size={18} />} trend="up" />
      </div>
    </section>

    {/* Featured Tournaments */}
    <section className="container mt-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Featured Tournaments</h2>
          <p className="text-sm text-muted-foreground mt-1">Don't miss these upcoming battles</p>
        </div>
        <Link to="/tournaments">
          <GlowButton variant="ghost" size="sm">
            View All <ArrowRight size={14} />
          </GlowButton>
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {featuredTournaments.map((t) => (
          <TournamentCard key={t.id} {...t} />
        ))}
      </div>
    </section>

    {/* Games */}
    <section className="container mt-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold">Popular Games</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose your battlefield</p>
        </div>
        <Link to="/games">
          <GlowButton variant="ghost" size="sm">
            All Games <ArrowRight size={14} />
          </GlowButton>
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {featuredGames.map((g) => (
          <GameCard key={g.id} {...g} />
        ))}
      </div>
    </section>

    {/* CTA */}
    {mediaFeed.length > 0 && (
      <section className="container mt-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold">Latest Media</h2>
            <p className="text-sm text-muted-foreground mt-1">Published from Admin Media section</p>
          </div>
          <Link to="/notifications">
            <GlowButton variant="ghost" size="sm">
              View Updates <ArrowRight size={14} />
            </GlowButton>
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {mediaFeed.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
              {item.kind === "image" ? (
                <img src={item.url} alt={item.name} className="w-full h-44 object-cover" />
              ) : (
                <video src={item.url} className="w-full h-44 object-cover" controls />
              )}
              <div className="p-3">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    )}

    <section className="container mt-20">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold">How It Works</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Quick, transparent 3-step flow to join tournaments</p>
          <HowItWorks />
        </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card p-12 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5" />
        <div className="relative z-10">
          <h2 className="text-4xl font-display font-bold mb-4">Ready to <span className="gradient-text">Compete</span>?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create your team, join tournaments, and climb the global rankings.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/dashboard">
              <GlowButton size="lg">
                Get Started Now
              </GlowButton>
            </Link>
            <Link to="/create-team">
              <GlowButton variant="secondary" size="lg">
                <Trophy size={18} /> Create Team
              </GlowButton>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  </div>
  );
};

export default Index;

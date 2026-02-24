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
import { getAnnouncements, getMediaFeed, getTournaments } from "@/lib/storage";
import { getHomeHeroVideoBlob, getHomeHeroVideoMeta } from "@/lib/hero-video";

const Index = () => {
  const { games } = useGames();
  const tournaments = getTournaments();
  const featuredTournaments = tournaments
    .filter((t) => t.featured || t.status === "in_progress")
    .slice(0, 3);
  const featuredGames = games.slice(0, 4);
  const mediaFeed = getMediaFeed().slice(0, 6);
  const latestAnnouncements = getAnnouncements().slice(0, 5);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>("");
  const hasHeroVideoRef = useRef(false);

  useEffect(() => {
    let active = true;
    let previousUrl = "";

    const loadHeroVideo = async () => {
      try {
        const blob = await getHomeHeroVideoBlob();
        if (!active) return;
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        if (blob) {
          const nextUrl = URL.createObjectURL(blob);
          previousUrl = nextUrl;
          hasHeroVideoRef.current = true;
          setHeroVideoUrl(nextUrl);
        } else {
          const meta = await getHomeHeroVideoMeta();
          if (!meta) {
            hasHeroVideoRef.current = false;
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
      if (previousUrl) URL.revokeObjectURL(previousUrl);
    };
  }, []);

  return (
  <div>
    {/* Hero */}
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        {heroVideoUrl ? (
          <video
            src={heroVideoUrl}
            className="w-full h-full object-cover opacity-45"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img src={heroBanner} alt="Arena" className="w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-6">
            <Zap size={12} /> SEASON 4 NOW LIVE
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-[0.95] mb-6">
            COMPETE.<br />
            <span className="gradient-text">CONQUER.</span><br />
            DOMINATE.
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            Join thousands of players competing in tournaments across the most popular esports titles.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/tournaments">
              <GlowButton size="lg">
                <Swords size={18} /> Browse Tournaments
              </GlowButton>
            </Link>
            <Link to="/create-team">
              <GlowButton variant="secondary" size="lg">
                <Users size={18} /> Create Team
              </GlowButton>
            </Link>
            <Link to="/dashboard">
              <GlowButton variant="secondary" size="lg">
                Get Started Now <ArrowRight size={16} />
              </GlowButton>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>

    {latestAnnouncements.length > 0 && (
      <section className="container mt-6">
        <Link to="/announcements" className="block rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 hover:bg-amber-500/15 transition-colors">
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2 py-1 rounded bg-amber-500 text-black text-[10px] font-mono font-bold tracking-widest">
              ANNOUNCEMENTS
            </span>
            <span className="text-white/85 truncate">
              {latestAnnouncements.map((item) => item.title).join(" | ")}
            </span>
          </div>
        </Link>
      </section>
    )}

    {/* Stats */}
    <section className="container -mt-12 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Players" value="93K+" icon={<Users size={18} />} trend="up" />
        <StatCard label="Tournaments" value="157" icon={<Trophy size={18} />} trend="up" />
        <StatCard label="Prize Distributed" value="$2.1M" icon={<Zap size={18} />} />
        <StatCard label="Live Matches" value="24" icon={<Swords size={18} />} trend="up" />
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

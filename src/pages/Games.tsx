import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Trophy, Users, ArrowRight } from "lucide-react";
import { useGames } from "@/context/GamesContext";
import { getPageBackgrounds } from "@/lib/storage";

const Games = () => {
  const { games } = useGames();
  const backgrounds = getPageBackgrounds();
  const pageBg = backgrounds.games_page;
  
  return (
    <div className="relative min-h-screen">
      {pageBg && (
        <img
          src={pageBg}
          alt="Games background"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/75 to-slate-950/95" />
      <div className="container py-12 relative">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-display font-bold mb-2">Games</h1>
        <p className="text-muted-foreground mb-8">Choose your game and start competing</p>
        <div className="space-y-4">
          {games.map((g, index) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, delay: index * 0.05 }}
            >
              <Link to={`/game?slug=${g.slug}`} className="block group">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a12]/95 backdrop-blur-sm"
                >
                  <div className="grid md:grid-cols-[1.1fr_1fr]">
                    <div className="p-5 md:p-6 flex flex-col justify-between relative">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-cyan-300/80 font-mono mb-2">Game</div>
                        <h3 className="text-2xl font-display font-black text-white group-hover:text-cyan-300 transition-colors">
                          {g.name}
                        </h3>
                        <p className="text-sm text-white/65 mt-2 max-w-xl">{g.description}</p>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-4 text-xs font-mono text-white/70">
                        <span className="inline-flex items-center gap-1.5">
                          <Users size={12} />
                          {Number(g.player_count || 0).toLocaleString()} players
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Trophy size={12} />
                          {Number(g.tournament_count || 0)} tournaments
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-cyan-300">
                          Explore
                          <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                    <div className="relative min-h-[180px] md:min-h-full">
                      {g.background_url || g.banner_url ? (
                        <motion.img
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.4 }}
                          src={g.background_url || g.banner_url}
                          alt={g.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          transition={{ duration: 0.4 }}
                          className="absolute inset-0"
                          style={{
                            background: g.theme_config
                              ? `linear-gradient(135deg, ${g.theme_config.gradient_from}, ${g.theme_config.gradient_to})`
                              : `linear-gradient(135deg, hsl(${g.theme.primary}), hsl(${g.theme.secondary}))`,
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-l from-black/20 via-black/35 to-black/80 md:to-transparent" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default Games;

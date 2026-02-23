import { motion } from "framer-motion";
import GameCard from "@/components/GameCard";
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {games.map((g) => (
            <GameCard key={g.id} {...g} />
          ))}
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default Games;

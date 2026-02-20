import { motion } from "framer-motion";
import GameCard from "@/components/GameCard";
import { games } from "@/lib/mock-data";

const Games = () => (
  <div className="container py-12">
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
);

export default Games;

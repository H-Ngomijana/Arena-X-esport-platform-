import { motion } from "framer-motion";
import { Users, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

interface GameCardProps {
  id: string;
  name: string;
  description: string;
  player_count: number;
  tournament_count: number;
  theme: { primary: string; secondary: string };
}

const GameCard = ({ id, name, description, player_count, tournament_count, theme }: GameCardProps) => (
  <Link to={`/games/${id}`}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.03, y: -4 }}
      className="glass-card-hover group relative overflow-hidden h-52 flex flex-col justify-end p-5 cursor-pointer"
    >
      <div
        className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, hsl(${theme.primary}), hsl(${theme.secondary}))`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="relative z-10">
        <h3 className="text-xl font-display font-bold mb-1">{name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users size={12} /> {player_count.toLocaleString()} players
          </span>
          <span className="flex items-center gap-1">
            <Trophy size={12} /> {tournament_count} tournaments
          </span>
        </div>
      </div>
    </motion.div>
  </Link>
);

export default GameCard;

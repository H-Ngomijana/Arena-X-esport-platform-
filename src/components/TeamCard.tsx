import { motion } from "framer-motion";
import { Users } from "lucide-react";
import RankBadge from "./RankBadge";
import type { RankTier } from "@/lib/mock-data";
import { Link } from "react-router-dom";

interface TeamCardProps {
  id: string;
  name: string;
  tag: string;
  members?: string[] | number;
  rating: number;
  rank_tier?: RankTier;
  tier?: RankTier;
  wins: number;
  losses: number;
  game?: string;
  logo_url?: string;
}

const TeamCard = ({ id, name, tag, members, rating, rank_tier, tier, wins, losses, game, logo_url }: TeamCardProps) => {
  const tierToUse = rank_tier || tier;
  const memberCount = typeof members === "number" ? members : (members?.length || 0);

  return (
    <Link to={`/team?id=${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -4 }}
        className="glass-card-hover p-5 cursor-pointer"
      >
        <div className="flex items-center gap-3 mb-3">
          {logo_url ? (
            <img src={logo_url} alt={name} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center font-display font-bold text-primary text-lg">
              {tag}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-base truncate">{name}</h3>
            <span className="text-xs font-mono text-muted-foreground">{game}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {tierToUse && <RankBadge tier={tierToUse} size="sm" />}
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
            <Users size={11} /> {memberCount}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground">MMR: <span className="text-foreground font-semibold">{rating}</span></span>
          <span>
            <span className="text-success">{wins}W</span>
            <span className="text-muted-foreground mx-1">-</span>
            <span className="text-destructive">{losses}L</span>
          </span>
        </div>
      </motion.div>
    </Link>
  );
};

export default TeamCard;

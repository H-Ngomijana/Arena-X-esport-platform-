import { motion } from "framer-motion";
import { Calendar, Users, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusColors } from "@/lib/mock-data";
import { Link } from "react-router-dom";

interface TournamentCardProps {
  id: string;
  name: string;
  game_name: string;
  format: string;
  status: string;
  max_teams: number;
  registered_count: number;
  prize_pool: string;
  start_date: string;
  featured?: boolean;
  region: string;
}

const statusLabels: Record<string, string> = {
  registration_open: "Registration Open",
  in_progress: "Live",
  completed: "Completed",
  draft: "Coming Soon",
  registration_closed: "Closed",
};

const TournamentCard = ({
  id, name, game_name, format, status, max_teams, registered_count, prize_pool, start_date, featured, region,
}: TournamentCardProps) => {
  const sc = statusColors[status] || statusColors.draft;
  const progress = (registered_count / max_teams) * 100;

  return (
    <Link to={`/tournaments/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -4 }}
        className={cn(
          "glass-card-hover group relative overflow-hidden p-5 cursor-pointer",
          featured && "ring-1 ring-primary/30"
        )}
      >
        {featured && (
          <div className="absolute top-3 right-3">
            <Zap size={16} className="text-primary animate-pulse" />
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono text-muted-foreground uppercase">{game_name}</span>
          <span className="text-muted-foreground/30">•</span>
          <span className="text-xs font-mono text-muted-foreground uppercase">{region}</span>
        </div>

        <h3 className="text-lg font-display font-bold mb-3 group-hover:text-primary transition-colors">{name}</h3>

        <div className="flex items-center gap-2 mb-4">
          <span className={cn("status-badge", sc.bg, sc.text)}>
            {status === "in_progress" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-live mr-1 animate-pulse" />}
            {statusLabels[status]}
          </span>
          <span className="status-badge bg-muted text-muted-foreground">{format.replace(/_/g, " ")}</span>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
            <span className="flex items-center gap-1"><Users size={11} /> {registered_count}/{max_teams} teams</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1"><Trophy size={11} /> {prize_pool}</span>
          <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(start_date).toLocaleDateString()}</span>
        </div>
      </motion.div>
    </Link>
  );
};

export default TournamentCard;

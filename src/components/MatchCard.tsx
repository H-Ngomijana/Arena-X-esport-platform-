import { motion } from "framer-motion";
import { Clock, Zap } from "lucide-react";

interface MatchCardProps {
  id: string;
  team_a_id: string;
  team_b_id: string;
  status: "scheduled" | "live" | "awaiting_results" | "completed" | "disputed";
  scheduled_at: string;
  team_a_score?: number | null;
  team_b_score?: number | null;
}

const MatchCard = (props: MatchCardProps) => {
  const statusColors = {
    scheduled: "bg-blue-500/20 text-blue-300",
    live: "bg-rose-500/20 text-rose-300 animate-pulse",
    awaiting_results: "bg-amber-500/20 text-amber-300",
    completed: "bg-emerald-500/20 text-emerald-300",
    disputed: "bg-rose-600/20 text-rose-300",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-lg border border-white/10 hover:border-primary/50 transition-colors bg-white/[0.02]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {props.status === "live" && <Zap size={14} className="text-rose-400 animate-pulse" />}
          {props.status !== "live" && <Clock size={14} className="text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">{props.scheduled_at}</span>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[props.status]}`}>
          {props.status.replace(/_/g, " ")}
        </span>
      </div>
      {props.team_a_score !== null && props.team_b_score !== null && (
        <p className="text-lg font-bold">
          {props.team_a_score} - {props.team_b_score}
        </p>
      )}
    </motion.div>
  );
};

export default MatchCard;

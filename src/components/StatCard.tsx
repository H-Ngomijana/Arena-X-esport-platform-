import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down";
  className?: string;
}

const StatCard = ({ label, value, icon, trend, className }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={cn("glass-card p-6 flex flex-col gap-2", className)}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      {icon && <span className="text-primary">{icon}</span>}
    </div>
    <div className="flex items-end gap-2">
      <span className="text-3xl font-display font-bold">{value}</span>
      {trend && (
        <span className={cn("flex items-center text-xs font-mono", trend === "up" ? "text-success" : "text-destructive")}>
          {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        </span>
      )}
    </div>
  </motion.div>
);

export default StatCard;

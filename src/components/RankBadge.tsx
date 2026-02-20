import { cn } from "@/lib/utils";
import { rankTiers, type RankTier } from "@/lib/mock-data";
import { Trophy, Diamond, Star, Medal, Shield, Sword } from "lucide-react";

const tierIcons: Record<RankTier, React.ElementType> = {
  Champion: Trophy,
  Diamond: Diamond,
  Platinum: Star,
  Gold: Medal,
  Silver: Shield,
  Bronze: Sword,
};

interface RankBadgeProps {
  tier: RankTier;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { badge: "px-2 py-0.5 text-xs gap-1", icon: 10 },
  md: { badge: "px-3 py-1 text-sm gap-1.5", icon: 14 },
  lg: { badge: "px-4 py-1.5 text-base gap-2", icon: 18 },
};

const RankBadge = ({ tier, size = "md", className }: RankBadgeProps) => {
  const styles = rankTiers[tier];
  const Icon = tierIcons[tier];
  const s = sizeMap[size];

  return (
    <span
      className={cn(
        "inline-flex items-center font-mono font-semibold rounded-full border shadow-lg",
        styles.bg, styles.color, styles.border, styles.glow,
        s.badge,
        className
      )}
    >
      <Icon size={s.icon} />
      {tier}
    </span>
  );
};

export default RankBadge;

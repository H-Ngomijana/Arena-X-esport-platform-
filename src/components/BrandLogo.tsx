import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: number;
  className?: string;
}

const glowStyle = {
  boxShadow: "0 0 8px rgba(216, 70, 239, 0.95), 0 0 18px rgba(216, 70, 239, 0.65)",
};

const BrandLogo = ({ size = 24, className }: BrandLogoProps) => (
  <span
    className={cn("relative inline-flex items-center justify-center shrink-0", className)}
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    <span
      className="absolute inset-[6%] rounded-[6px] border-[3px] border-white rotate-[15deg]"
      style={glowStyle}
    />
    <span
      className="absolute inset-[34%] rounded-[4px] border-[3px] border-white rotate-[15deg]"
      style={glowStyle}
    />
  </span>
);

export default BrandLogo;

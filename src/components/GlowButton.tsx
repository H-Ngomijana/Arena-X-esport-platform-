import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost";
type Size = "sm" | "md" | "lg" | "xl";

interface GlowButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40",
  secondary: "bg-white/10 backdrop-blur-sm border border-white/20 text-foreground hover:bg-white/20",
  success: "bg-success text-success-foreground shadow-lg shadow-success/25 hover:shadow-success/40",
  danger: "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25 hover:shadow-destructive/40",
  ghost: "bg-transparent text-foreground hover:bg-white/10",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-7 py-3 text-base rounded-lg gap-2.5",
  xl: "px-10 py-4 text-lg rounded-xl gap-3",
};

const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center font-display font-semibold tracking-wide uppercase transition-all duration-300",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

GlowButton.displayName = "GlowButton";
export default GlowButton;

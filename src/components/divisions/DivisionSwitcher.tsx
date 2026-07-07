import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchDivisions } from "@/lib/divisions-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DivisionSwitcherProps {
  basePath: "/tournaments" | "/rankings";
  activeSlug?: string;
  mode?: "tabs" | "dropdown";
  className?: string;
}

export function DivisionSwitcher({ basePath, activeSlug, mode = "tabs", className }: DivisionSwitcherProps) {
  const location = useLocation();
  const { data: divisions = [] } = useQuery({
    queryKey: ["divisions"],
    queryFn: fetchDivisions,
  });
  const active = divisions.find((division) => division.slug === activeSlug) || divisions[0];

  if (mode === "dropdown") {
    const isActive = location.pathname === basePath || location.pathname.startsWith(`${basePath}/`);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5",
              className
            )}
          >
            {basePath === "/tournaments" ? "Tournaments" : "Rankings"}
            <ChevronDown size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52 bg-[#0a0a12] border-white/10 text-white">
          <DropdownMenuItem asChild>
            <Link to={basePath}>Overview</Link>
          </DropdownMenuItem>
          {divisions.map((division) => (
            <DropdownMenuItem key={division.id} asChild>
              <Link to={`${basePath}/${division.slug}`}>{division.name}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1", className)}>
      {divisions.map((division) => (
        <Link
          key={division.id}
          to={`${basePath}/${division.slug}`}
          className={cn(
            "shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
            active?.slug === division.slug
              ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-200"
              : "border-white/10 bg-white/[0.03] text-white/65 hover:text-white hover:bg-white/[0.07]"
          )}
        >
          {division.name}
        </Link>
      ))}
    </div>
  );
}

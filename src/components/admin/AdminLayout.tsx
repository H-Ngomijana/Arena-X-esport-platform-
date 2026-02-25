import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Gamepad2,
  Trophy,
  Swords,
  Users,
  AlertTriangle,
  Image,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
  LogOut,
  CheckSquare,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/BrandLogo";

const navItems = [
  { id: "dashboard", label: "Command Center", icon: LayoutDashboard },
  { id: "games", label: "Game Manager", icon: Gamepad2 },
  { id: "tournaments", label: "Tournament Engine", icon: Trophy },
  { id: "matches", label: "Match Control", icon: Swords },
  { id: "teams", label: "Teams & Players", icon: Users },
  { id: "disputes", label: "Dispute Panel", icon: AlertTriangle },
  { id: "join_requests", label: "Join Requests", icon: UserCheck },
  { id: "submissions", label: "Solo Submissions", icon: CheckSquare },
  { id: "media", label: "Media & Branding", icon: Image },
  { id: "audit", label: "Audit Logs", icon: Activity },
  { id: "settings", label: "System Settings", icon: Settings },
];

interface AdminLayoutProps {
  activePanel: string;
  onPanelChange: (panel: string) => void;
  children: React.ReactNode;
  userEmail: string;
  onLogout?: () => void;
  awaitingJoinRequests?: number;
}

const AdminLayout = ({ activePanel, onPanelChange, children, userEmail, onLogout, awaitingJoinRequests = 0 }: AdminLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLabel = navItems.find((n) => n.id === activePanel)?.label || "Command Center";
  const selectPanel = (panelId: string, mobile = false) => {
    onPanelChange(panelId);
    if (mobile) setMobileOpen(false);
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full pointer-events-auto">
      <div className="p-4 border-b border-rose-500/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <BrandLogo size={24} />
          </div>
          {(!collapsed || mobile) && (
            <div>
              <div className="font-mono text-sm font-bold text-white tracking-wider">ARENAX</div>
              <div className="font-mono text-[10px] text-rose-400 tracking-widest">CONTROL ROOM</div>
            </div>
          )}
        </div>
      </div>

      <nav className="relative z-[1001] flex-1 p-2 space-y-1 overflow-y-auto pointer-events-auto">
        {navItems.map((item) => {
          const active = activePanel === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onPointerDown={() => selectPanel(item.id, mobile)}
              onClick={() => selectPanel(item.id, mobile)}
              className={cn(
                "relative z-[1002] pointer-events-auto touch-manipulation w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-xs transition-all",
                active
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <item.icon size={16} className="flex-shrink-0" />
              {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
              {item.id === "join_requests" && awaitingJoinRequests > 0 && (!collapsed || mobile) && (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] animate-pulse px-1">
                  {awaitingJoinRequests}
                </span>
              )}
              {active && (!collapsed || mobile) && (
                <span className="ml-auto w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {(!collapsed || mobile) && (
        <div className="p-4 border-t border-rose-500/20 space-y-3">
          <div className="font-mono text-[10px] text-white/30 space-y-1">
            <div className="flex items-center gap-1">
              <User size={10} /> AUTHENTICATED AS
            </div>
            <div className="text-white/60 truncate">{userEmail}</div>
            <div className="text-rose-400">ROLE: ADMIN</div>
          </div>
          <Link
            to="/"
            className="block text-center font-mono text-[10px] text-white/40 hover:text-white/60 transition-colors py-1"
          >
            {"<- BACK TO PLATFORM"}
          </Link>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 font-mono text-[10px] text-rose-300 hover:text-rose-200 transition-colors py-1"
            >
              <LogOut size={12} /> LOG OUT
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#07070c] font-mono overflow-hidden">
      <aside
        className={cn(
          "hidden md:flex flex-col bg-[#0a0a0f] border-r border-rose-500/20 relative z-[1000] pointer-events-auto transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-rose-600 border border-rose-500/50 flex items-center justify-center text-white hover:bg-rose-500 transition-colors z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-[#0a0a0f] border-r border-rose-500/20"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="relative z-0 flex-1 flex flex-col overflow-hidden">
        <header className="h-12 flex items-center justify-between px-4 border-b border-white/10 bg-[#0a0a0f] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-white/50 hover:text-white" onClick={() => setMobileOpen(true)}>
              <Menu size={18} />
            </button>
            <span className="font-mono text-xs text-white/30">Admin Control Room</span>
            <span className="font-mono text-xs text-white/20">/</span>
            <span className="font-mono text-xs text-white/70">{currentLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px] text-emerald-400">SYSTEM ONLINE</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
              <span className="font-mono text-[10px] text-rose-400">ADMIN SESSION ACTIVE</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Bell, ChevronDown } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/BrandLogo";
import { toast } from "sonner";
import { getCurrentUser, getMyJoinRequests, getUnreadNotificationCount, signOutUser } from "@/lib/storage";
import { useRealtimeRefresh } from "@/components/hooks/useRealtimeRefresh";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Tournaments", to: "/tournaments" },
  { label: "Announcements", to: "/announcements" },
  { label: "Rankings", to: "/rankings" },
  { label: "Games", to: "/games" },
  { label: "Teams", to: "/teams" },
];

const footerColumns: Array<{
  title: string;
  links: Array<{ label: string; to?: string; href?: string }>;
}> = [
  {
    title: "Platform",
    links: [
      { label: "Tournaments", to: "/tournaments" },
      { label: "Rankings", to: "/rankings" },
      { label: "Games", to: "/games" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Discord" },
      { label: "Twitter" },
      { label: "YouTube" },
      { label: "Instagram: Ngomijana_", href: "https://instagram.com/Ngomijana_" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center" },
      { label: "Contact: 0794417555" },
    ],
  },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  useRealtimeRefresh({
    keys: ["user_notifications", "join_requests"],
    intervalMs: 5000,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const [redirectTarget, setRedirectTarget] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (currentUser.is_guest) {
      setUnreadCount(0);
      return;
    }
    const refresh = () => setUnreadCount(getUnreadNotificationCount(currentUser.email));
    refresh();
    const timer = setInterval(refresh, 2000);
    return () => clearInterval(timer);
  }, [currentUser.email, currentUser.is_guest]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentUser.is_guest) return;
      if (location.pathname.toLowerCase().includes("tournamentlive")) return;

      const approved = getMyJoinRequests(currentUser.email)
        .filter((item) => item.approval_status === "approved")
        .sort(
          (a, b) =>
            new Date(b.approved_at || b.created_at).getTime() -
            new Date(a.approved_at || a.created_at).getTime()
        )[0];

      if (!approved) return;

      const redirectedRef = sessionStorage.getItem("arenax_auto_join_redirect_ref");
      if (redirectedRef === approved.payment_reference) return;

      sessionStorage.setItem("arenax_auto_join_redirect_ref", approved.payment_reference);
      setRedirectTarget(`/TournamentLive?id=${approved.tournament_id}`);
      setRedirectCountdown(3);
    }, 2000);

    return () => clearInterval(timer);
  }, [currentUser.email, currentUser.is_guest, location.pathname, navigate]);

  useEffect(() => {
    if (redirectCountdown <= 0 || !redirectTarget) return;
    if (redirectCountdown === 3) {
      toast.success("Your join request was approved. Entering tournament panel in 3 seconds.");
    }
    const timer = setTimeout(() => {
      if (redirectCountdown === 1) {
        navigate(redirectTarget);
      } else {
        setRedirectCountdown((n) => n - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, redirectTarget, navigate]);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 25, 0], y: [0, 20, 0], opacity: [0.25, 0.4, 0.25] }}
          transition={reduceMotion ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, -20, 0], y: [0, -25, 0], opacity: [0.2, 0.35, 0.2] }}
          transition={reduceMotion ? undefined : { duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 15, 0], y: [0, -18, 0], opacity: [0.2, 0.3, 0.2] }}
          transition={reduceMotion ? undefined : { duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <header className="fixed top-0 left-0 right-0 z-50 nav-blur">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size={24} />
            <span className="font-display text-xl font-bold tracking-wider gradient-text">ARENAX</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  location.pathname === l.to
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] px-1 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/5 text-muted-foreground"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            {currentUser.is_guest ? (
              <Link to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`} className="text-xs font-semibold px-3 py-2 rounded-lg bg-amber-500 text-black">
                Sign In
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-2 py-1.5 hover:bg-white/10">
                    {currentUser.avatar_url ? (
                      <img src={currentUser.avatar_url} alt={currentUser.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold">
                        {currentUser.name?.[0] || "U"}
                      </div>
                    )}
                    <span className="text-sm text-white/80 max-w-28 truncate">{currentUser.name}</span>
                    <ChevronDown size={14} className="text-white/60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 bg-[#0a0a12] border-white/10 text-white">
                  <DropdownMenuItem
                    onClick={() => {
                      signOutUser();
                      window.location.href = `/auth?mode=login&switch=1&redirect=${encodeURIComponent(location.pathname + location.search)}`;
                    }}
                  >
                    Switch accounts
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      signOutUser();
                      window.location.href = "/";
                    }}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-card border-l border-white/10 p-6"
            >
              <button
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 text-muted-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-2 mb-8">
                <BrandLogo size={20} />
                <span className="font-display text-lg font-bold gradient-text">ARENAX</span>
              </div>
              <nav className="flex flex-col gap-1">
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-lg font-medium transition-colors",
                      location.pathname === l.to
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 pt-16">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${location.pathname}${location.search}`}
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.992, filter: "blur(5px)" }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -12, scale: 0.996, filter: "blur(4px)" }}
            transition={{ duration: reduceMotion ? 0.12 : 0.34, ease: "easeOut" }}
            className="min-h-[calc(100vh-4rem)] will-change-transform"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      {redirectCountdown > 0 && (
        <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-[#0a0a12] p-6 text-center">
            <p className="text-emerald-300 font-mono text-xs uppercase tracking-widest">Approval Confirmed</p>
            <h3 className="text-2xl font-black mt-2">Entering Tournament Panel</h3>
            <p className="text-white/70 mt-1">Redirecting in {redirectCountdown}s</p>
            <div className="mt-4 h-2 rounded bg-white/10 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000"
                style={{ width: `${((4 - redirectCountdown) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-white/[0.06] bg-card/50 mt-20">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BrandLogo size={18} />
                <span className="font-display font-bold gradient-text">ARENAX</span>
              </div>
              <p className="text-xs text-muted-foreground">The premier competitive esports tournament platform.</p>
            </div>
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h4 className="font-display font-semibold text-sm mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.to ? (
                        <Link to={link.to} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {link.label}
                        </Link>
                      ) : link.href ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">{link.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.06] mt-8 pt-6 text-center text-xs text-muted-foreground font-mono">
            © 2026 Arena X . ngomijana. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

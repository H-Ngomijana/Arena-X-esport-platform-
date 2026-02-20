import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Trophy, Menu, X, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Tournaments", to: "/tournaments" },
  { label: "Rankings", to: "/rankings" },
  { label: "Games", to: "/games" },
  { label: "Teams", to: "/teams" },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 nav-blur">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Trophy className="text-primary" size={24} />
            <span className="font-display text-xl font-bold tracking-wider gradient-text">ARENAX</span>
          </Link>

          {/* Desktop nav */}
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
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            </button>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/5 text-muted-foreground"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
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
                <Trophy className="text-primary" size={20} />
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

      {/* Content */}
      <main className="flex-1 pt-16">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-card/50 mt-20">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="text-primary" size={18} />
                <span className="font-display font-bold gradient-text">ARENAX</span>
              </div>
              <p className="text-xs text-muted-foreground">The premier competitive esports tournament platform.</p>
            </div>
            {[
              { title: "Platform", links: ["Tournaments", "Rankings", "Games"] },
              { title: "Community", links: ["Discord", "Twitter", "YouTube"] },
              { title: "Support", links: ["Help Center", "Contact", "Terms"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-display font-semibold text-sm mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{link}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.06] mt-8 pt-6 text-center text-xs text-muted-foreground font-mono">
            © 2026 ArenaX. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

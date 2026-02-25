import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useReducer } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GamesProvider } from "@/context/GamesContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SubmissionsProvider } from "@/context/SubmissionsContext";
import { RegistrationsProvider } from "@/context/RegistrationsContext";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Tournaments from "./pages/Tournaments";
import Tournament from "./pages/Tournament";
import About from "./pages/About";
import CreateTeam from "./pages/CreateTeam";
import Games from "./pages/Games";
import Game from "./pages/Game";
import Rankings from "./pages/Rankings";
import TeamsPage from "./pages/TeamsPage";
import Team from "./pages/Team";
import UserProfile from "./pages/UserProfile";
import MatchRoom from "./pages/MatchRoom";
import Notifications from "./pages/Notifications";
import Announcements from "./pages/Announcements";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import PaymentFlow from "./pages/PaymentFlow";
import TournamentLive from "./pages/TournamentLive";
import { getSystemSettings } from "@/lib/storage";
import { startRemoteSync } from "@/lib/remote-sync";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 2,
    },
  },
});

const MaintenanceNotice = ({ message }: { message?: string }) => (
  <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-4">
    <div className="w-full max-w-xl rounded-2xl border border-amber-500/30 bg-[#0a0a12] p-8 text-center space-y-4">
      <p className="font-mono text-xs uppercase tracking-widest text-amber-300">Temporary Shutdown</p>
      <h1 className="text-3xl font-black">Platform Under Maintenance</h1>
      <p className="text-white/70">
        {message?.trim() || "ArenaX is temporarily unavailable while we apply updates. Please check back shortly."}
      </p>
    </div>
  </div>
);

const App = () => {
  const [, forceRerender] = useReducer((x) => x + 1, 0);
  const systemSettings = getSystemSettings();
  const maintenanceMode = Boolean(systemSettings.maintenance_mode);

  useEffect(() => {
    const stopSync = startRemoteSync();
    const onStorage = () => forceRerender();
    const onDataChanged = () => forceRerender();

    window.addEventListener("storage", onStorage);
    window.addEventListener("arenax:data-changed", onDataChanged as EventListener);

    return () => {
      if (typeof stopSync === "function") stopSync();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("arenax:data-changed", onDataChanged as EventListener);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <SubmissionsProvider>
            <RegistrationsProvider>
              <Toaster />
              <Sonner />
              <GamesProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/admin" element={<Admin />} />
                    {maintenanceMode ? (
                      <Route path="*" element={<MaintenanceNotice message={systemSettings.maintenance_message} />} />
                    ) : (
                      <>
                        <Route path="/PaymentFlow" element={<PaymentFlow />} />
                        <Route path="/payment-flow" element={<PaymentFlow />} />
                        <Route path="/TournamentLive" element={<TournamentLive />} />
                        <Route path="/tournament-live" element={<TournamentLive />} />
                    <Route
                      path="*"
                      element={
                        <Layout>
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/tournaments" element={<Tournaments />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/tournament" element={<Tournament />} />
                            <Route path="/Tournament" element={<Tournament />} />
                            <Route path="/create-team" element={<CreateTeam />} />
                            <Route path="/games" element={<Games />} />
                            <Route path="/game" element={<Game />} />
                            <Route path="/rankings" element={<Rankings />} />
                            <Route path="/teams" element={<TeamsPage />} />
                            <Route path="/team" element={<Team />} />
                            <Route path="/profile" element={<UserProfile />} />
                            <Route path="/match-room" element={<MatchRoom />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/announcements" element={<Announcements />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Layout>
                      }
                    />
                      </>
                    )}
                  </Routes>
                </BrowserRouter>
              </GamesProvider>
            </RegistrationsProvider>
          </SubmissionsProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

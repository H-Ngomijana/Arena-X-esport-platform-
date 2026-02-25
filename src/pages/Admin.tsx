import { useState, useCallback, useEffect } from "react";
import { Shield, LogIn } from "lucide-react";
import { adminUser } from "@/lib/admin-mock-data";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminCommandCenter from "@/components/admin/AdminCommandCenter";
import AdminGamesManager from "@/components/admin/AdminGamesManager";
import AdminTournamentEngine from "@/components/admin/AdminTournamentEngine";
import AdminMatchControl from "@/components/admin/AdminMatchControl";
import AdminTeamsPlayers from "@/components/admin/AdminTeamsPlayers";
import AdminDisputePanel from "@/components/admin/AdminDisputePanel";
import AdminSubmissionsPanel from "@/components/admin/AdminSubmissionsPanel";
import AdminAuditLog from "@/components/admin/AdminAuditLog";
import AdminMediaSettings from "@/components/admin/AdminMediaSettings";
import AdminJoinRequests from "@/components/admin/AdminJoinRequests";
import { getJoinRequests } from "@/lib/storage";

const ADMIN_USERNAME = "ngomijana";
const ADMIN_PASSWORD = "2468";
const ADMIN_SESSION_KEY = "admin_session_v1";
const ADMIN_PANEL_KEY = "admin_active_panel_v1";

const Admin = () => {
  const [activePanel, setActivePanel] = useState(() => sessionStorage.getItem(ADMIN_PANEL_KEY) || "dashboard");
  const [auditLogs, setAuditLogs] = useState<Array<{ action: string; admin: string; timestamp: string }>>([]);
  const [awaitingJoinRequests, setAwaitingJoinRequests] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  });

  const user = isAuthenticated ? adminUser : null;

  useEffect(() => {
    const refreshCount = () => {
      setAwaitingJoinRequests(
        getJoinRequests().filter((item) => item.approval_status === "awaiting_approval").length
      );
    };
    refreshCount();
    const timer = setInterval(refreshCount, 2000);
    return () => clearInterval(timer);
  }, []);

  const logAction = useCallback(
    (action: string) => {
      setAuditLogs((prev) => [
        ...prev,
        {
          action,
          admin: user?.email || "unknown",
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    [user]
  );

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      setIsAuthenticated(true);
      setLoginError("");
      setPassword("");
      return;
    }
    setLoginError("Invalid username or password");
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_PANEL_KEY);
    setIsAuthenticated(false);
    setActivePanel("dashboard");
    setUsername("");
    setPassword("");
  };

  useEffect(() => {
    sessionStorage.setItem(ADMIN_PANEL_KEY, activePanel);
  }, [activePanel]);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#07070c] flex items-center justify-center font-mono px-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-500/20 bg-[#0a0a0f] p-8 space-y-6">
          <div className="text-center space-y-3">
            <Shield size={54} className="text-rose-500 mx-auto" />
            <div className="font-mono text-xs tracking-[0.3em] text-rose-400">SECURE ACCESS</div>
            <h1 className="font-mono text-2xl font-bold text-white">ADMIN LOGIN</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-widest text-white/40 uppercase">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 rounded-md bg-white/5 border border-white/10 text-white font-mono px-3 text-sm"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-widest text-white/40 uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 rounded-md bg-white/5 border border-white/10 text-white font-mono px-3 text-sm"
                autoComplete="current-password"
                required
              />
            </div>
            {loginError && <div className="font-mono text-xs text-rose-400">{loginError}</div>}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs rounded-lg transition-colors"
            >
              <LogIn size={14} /> SIGN IN
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderPanel = () => {
    switch (activePanel) {
      case "dashboard":
        return <AdminCommandCenter />;
      case "games":
        return <AdminGamesManager logAction={logAction} />;
      case "tournaments":
        return <AdminTournamentEngine logAction={logAction} />;
      case "matches":
        return <AdminMatchControl logAction={logAction} />;
      case "teams":
        return <AdminTeamsPlayers logAction={logAction} />;
      case "disputes":
        return <AdminDisputePanel logAction={logAction} />;
      case "submissions":
        return <AdminSubmissionsPanel logAction={logAction} />;
      case "join_requests":
        return <AdminJoinRequests logAction={logAction} onAwaitingCountChange={setAwaitingJoinRequests} />;
      case "audit":
        return <AdminAuditLog logs={auditLogs} />;
      case "media":
      case "settings":
        return <AdminMediaSettings logAction={logAction} />;
      default:
        return <AdminCommandCenter />;
    }
  };

  return (
    <AdminLayout
      activePanel={activePanel}
      onPanelChange={setActivePanel}
      userEmail={user.email}
      onLogout={handleLogout}
      awaitingJoinRequests={awaitingJoinRequests}
    >
      {renderPanel()}
    </AdminLayout>
  );
};

export default Admin;

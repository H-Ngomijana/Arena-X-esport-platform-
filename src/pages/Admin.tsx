import { useState, useCallback } from "react";
import { Shield, LogIn } from "lucide-react";
import { adminUser } from "@/lib/admin-mock-data";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminCommandCenter from "@/components/admin/AdminCommandCenter";
import AdminGamesManager from "@/components/admin/AdminGamesManager";
import AdminTournamentEngine from "@/components/admin/AdminTournamentEngine";
import AdminMatchControl from "@/components/admin/AdminMatchControl";
import AdminTeamsPlayers from "@/components/admin/AdminTeamsPlayers";
import AdminDisputePanel from "@/components/admin/AdminDisputePanel";
import AdminAuditLog from "@/components/admin/AdminAuditLog";
import AdminMediaSettings from "@/components/admin/AdminMediaSettings";

const Admin = () => {
  const [activePanel, setActivePanel] = useState("dashboard");
  const [auditLogs, setAuditLogs] = useState<Array<{ action: string; admin: string; timestamp: string }>>([]);

  // Mock: always admin for demo. Change to null to see RBAC gate.
  const user = adminUser;

  const logAction = useCallback((action: string) => {
    setAuditLogs(prev => [...prev, {
      action,
      admin: user?.email || "unknown",
      timestamp: new Date().toISOString(),
    }]);
  }, [user]);

  // RBAC Gate
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#07070c] flex items-center justify-center font-mono">
        <div className="text-center space-y-6 max-w-md">
          <Shield size={64} className="text-rose-500 mx-auto" />
          <div className="font-mono text-xs tracking-[0.3em] text-rose-400">ACCESS DENIED</div>
          <h1 className="font-mono text-3xl font-bold text-white">RESTRICTED ZONE</h1>
          <div className="space-y-1 font-mono text-xs text-white/40">
            <div>YOUR ROLE: <span className="text-rose-400">{user?.role || "none"}</span></div>
            <div>REQUIRED ROLE: <span className="text-emerald-400">admin</span></div>
          </div>
          <button className="flex items-center gap-2 mx-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs rounded-lg transition-colors">
            <LogIn size={14} /> SIGN IN
          </button>
        </div>
      </div>
    );
  }

  const renderPanel = () => {
    switch (activePanel) {
      case "dashboard": return <AdminCommandCenter />;
      case "games": return <AdminGamesManager logAction={logAction} />;
      case "tournaments": return <AdminTournamentEngine logAction={logAction} />;
      case "matches": return <AdminMatchControl logAction={logAction} />;
      case "teams": return <AdminTeamsPlayers logAction={logAction} />;
      case "disputes": return <AdminDisputePanel logAction={logAction} />;
      case "audit": return <AdminAuditLog logs={auditLogs} />;
      case "media":
      case "settings": return <AdminMediaSettings logAction={logAction} />;
      default: return <AdminCommandCenter />;
    }
  };

  return (
    <AdminLayout activePanel={activePanel} onPanelChange={setActivePanel} userEmail={user.email}>
      {renderPanel()}
    </AdminLayout>
  );
};

export default Admin;

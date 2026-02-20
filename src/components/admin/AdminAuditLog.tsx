import { Activity, Shield, User, Clock } from "lucide-react";

interface AuditEntry {
  action: string;
  admin: string;
  timestamp: string;
}

const AdminAuditLog = ({ logs }: { logs: AuditEntry[] }) => {
  const reversed = [...logs].reverse();

  return (
    <div className="space-y-6">
      <h2 className="font-mono text-lg text-white/80">Audit Logs</h2>

      {reversed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield size={40} className="text-white/10 mb-4" />
          <span className="font-mono text-sm text-white/30">NO ACTIONS YET THIS SESSION</span>
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
          {reversed.map((entry, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                <Activity size={14} className="text-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-white">{entry.action}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 font-mono text-[10px] text-white/30">
                    <User size={10} /> {entry.admin}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10px] text-white/30">
                    <Clock size={10} /> {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <span className="font-mono text-[10px] text-white/20">#{logs.length - i}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAuditLog;

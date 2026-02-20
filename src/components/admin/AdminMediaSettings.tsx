import { useState } from "react";
import { Upload, Megaphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const uploadZones = [
  { label: "Hero Banner", hint: "1920×1080" },
  { label: "Platform Logo", hint: "SVG/PNG transparent" },
  { label: "Sponsor Banner", hint: "1200×200" },
];

const AdminMediaSettings = ({ logAction }: { logAction: (a: string) => void }) => {
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementType, setAnnouncementType] = useState("info");
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Mock upload
    toast.success(`Uploaded: ${label} — ${file.name}`);
    logAction(`Uploaded ${label}: ${file.name}`);
  };

  const broadcastAnnouncement = () => {
    if (!announcementTitle || !announcementMsg) return;
    logAction(`Broadcast: [${announcementType}] ${announcementTitle}`);
    toast.success("Announcement broadcast!");
    setAnnouncementTitle("");
    setAnnouncementMsg("");
  };

  return (
    <div className="space-y-8">
      <h2 className="font-mono text-lg text-white/80">Media & System Settings</h2>

      {/* Upload Zones */}
      <div>
        <span className="font-mono text-xs text-white/40 uppercase mb-4 block">Platform Media Uploads</span>
        <div className="grid md:grid-cols-3 gap-4">
          {uploadZones.map(z => (
            <label key={z.label} className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-white/15 cursor-pointer hover:border-white/30 hover:bg-white/[0.02] transition-all group">
              <Upload size={24} className="text-white/20 mb-2 group-hover:text-white/50" />
              <span className="font-mono text-xs text-white/30">{z.label}</span>
              <span className="font-mono text-[10px] text-white/20 mt-1">{z.hint}</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, z.label)} />
            </label>
          ))}
        </div>
      </div>

      {/* Announcement */}
      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone size={14} className="text-white/40" />
          <span className="font-mono text-xs text-white/40 uppercase">Global Announcement</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="col-span-2">
            <Input value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} placeholder="Announcement title" className="bg-white/5 border-white/10 text-white font-mono" />
          </div>
          <select value={announcementType} onChange={e => setAnnouncementType(e.target.value)} className="h-10 rounded-md bg-white/5 border border-white/10 text-white font-mono text-xs px-3">
            {["info", "warning", "success", "error"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Textarea value={announcementMsg} onChange={e => setAnnouncementMsg(e.target.value)} placeholder="Message..." className="bg-white/5 border-white/10 text-white font-mono mb-3" />
        <button onClick={broadcastAnnouncement} className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs rounded-lg transition-colors">
          BROADCAST ANNOUNCEMENT
        </button>
      </div>

      {/* System Config */}
      <div className="border-t border-white/10 pt-6 space-y-4">
        <span className="font-mono text-xs text-white/40 uppercase block">System Configuration</span>

        <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-4 flex items-center justify-between">
          <div>
            <div className="font-mono text-sm text-rose-300">Maintenance Mode</div>
            <div className="font-mono text-[10px] text-white/30 mt-1">Takes platform offline for all non-admin users</div>
          </div>
          <Switch
            checked={maintenanceMode}
            onCheckedChange={v => { setMaintenanceMode(v); logAction(`Maintenance mode → ${v ? "ON" : "OFF"}`); }}
            className="data-[state=checked]:bg-rose-500"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Platform", value: "ArenaX v1.0" },
            { label: "Environment", value: "Production", color: "text-emerald-400" },
            { label: "Auth", value: "Base44 RBAC" },
            { label: "Session", value: "Active" },
          ].map(item => (
            <div key={item.label} className="rounded-lg bg-white/[0.02] border border-white/10 p-3">
              <div className="font-mono text-[10px] text-white/30 uppercase">{item.label}</div>
              <div className={`font-mono text-xs mt-1 ${item.color || "text-white/60"}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMediaSettings;

import { useState } from "react";
import { addAnnouncement, getTournaments, saveTournaments } from "@/lib/storage";
import { toast } from "sonner";

const AdminAnnouncementPanel = ({ tournamentId, onDone }) => {
  const [type, setType] = useState("info");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const broadcast = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    const entry = {
      type,
      title: title.trim(),
      message: message.trim(),
      created_at: new Date().toISOString(),
    };

    const tournaments = getTournaments();
    saveTournaments(
      tournaments.map((item) =>
        item.id === tournamentId
          ? { ...item, announcements: [...(item.announcements || []), entry] }
          : item
      )
    );

    const platformType =
      type === "winner" ? "success" : type === "warning" ? "warning" : "info";
    addAnnouncement({
      title: `${entry.title}`,
      message: entry.message,
      type: platformType,
      created_by: "admin@arenax.gg",
    });

    toast.success("Announcement broadcasted");
    setTitle("");
    setMessage("");
    onDone?.();
  };

  return (
    <div className="rounded-xl border border-amber-500/20 bg-[#0a0a12] p-4 space-y-3">
      <p className="font-mono text-xs text-amber-300 uppercase">Broadcast Announcement</p>
      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono">
        <option value="info">Info</option>
        <option value="match">Match</option>
        <option value="winner">Winner</option>
        <option value="warning">Warning</option>
      </select>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono" />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" className="w-full min-h-24 rounded bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-mono" />
      <button onClick={broadcast} className="h-10 w-full rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono">
        BROADCAST
      </button>
    </div>
  );
};

export default AdminAnnouncementPanel;

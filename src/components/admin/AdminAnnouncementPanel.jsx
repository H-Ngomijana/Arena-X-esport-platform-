import { useMemo, useState } from "react";
import { addAnnouncement, getAnnouncements, getTournaments, removeAnnouncement, saveTournaments } from "@/lib/storage";
import { toast } from "sonner";
import { uploadMediaFile } from "@/lib/media-upload";

const AdminAnnouncementPanel = ({ tournamentId, onDone }) => {
  const [type, setType] = useState("info");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const tournament = useMemo(
    () => getTournaments().find((item) => item.id === tournamentId),
    [tournamentId, title, message, imageUrl, deletingId]
  );
  const announcements = Array.isArray(tournament?.announcements) ? tournament.announcements : [];

  const onUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    setUploadingImage(true);
    try {
      const url = await uploadMediaFile(file, "announcements");
      setImageUrl(url);
      toast.success("Announcement image uploaded.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload announcement image.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const broadcast = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    const announcementId = `ann_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const entry = {
      id: announcementId,
      type,
      title: title.trim(),
      message: message.trim(),
      image_url: imageUrl || "",
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
      tournament_id: tournamentId,
      title: `${entry.title}`,
      message: entry.message,
      type: platformType,
      image_url: entry.image_url || "",
      created_by: "admin@arenax.gg",
    });

    toast.success("Announcement broadcasted");
    setTitle("");
    setMessage("");
    setImageUrl("");
    onDone?.();
  };

  const deleteAnnouncement = (announcement) => {
    setDeletingId(announcement.id || announcement.created_at || announcement.title);
    try {
      const tournaments = getTournaments();
      saveTournaments(
        tournaments.map((item) =>
          item.id === tournamentId
            ? {
                ...item,
                announcements: (item.announcements || []).filter(
                  (row) =>
                    (row.id && announcement.id ? row.id !== announcement.id : true) &&
                    !(
                      row.title === announcement.title &&
                      row.message === announcement.message &&
                      row.created_at === announcement.created_at
                    )
                ),
              }
            : item
        )
      );

      const global = getAnnouncements().filter((row) => {
        if (row.tournament_id !== tournamentId) return true;
        if (announcement.id && row.id === announcement.id) return false;
        if (
          row.title === announcement.title &&
          row.message === announcement.message
        ) {
          return false;
        }
        return true;
      });
      // remove individually through helper to preserve storage events
      const existing = getAnnouncements();
      existing
        .filter((row) => !global.find((keep) => keep.id === row.id))
        .forEach((row) => removeAnnouncement(row.id));

      toast.success("Announcement deleted.");
      onDone?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete announcement.");
    } finally {
      setDeletingId("");
    }
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
      <label className="flex h-11 items-center justify-center rounded border border-dashed border-white/20 bg-white/5 text-xs text-white/70 font-mono cursor-pointer hover:bg-white/10">
        {uploadingImage ? "UPLOADING..." : "UPLOAD ANNOUNCEMENT IMAGE (optional)"}
        <input type="file" accept="image/*" className="hidden" onChange={onUploadImage} disabled={uploadingImage} />
      </label>
      {imageUrl ? (
        <div className="rounded border border-white/10 overflow-hidden bg-black/20">
          <img src={imageUrl} alt="announcement" className="w-full h-28 object-cover" />
        </div>
      ) : null}
      <button onClick={broadcast} className="h-10 w-full rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono">
        BROADCAST
      </button>
      <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-2">
        <p className="text-[11px] font-mono uppercase tracking-widest text-white/60">Existing announcements</p>
        {announcements.length === 0 ? (
          <p className="text-xs text-white/50 font-mono">No announcements yet.</p>
        ) : (
          announcements
            .slice()
            .reverse()
            .map((item) => (
              <div key={item.id || `${item.created_at}_${item.title}`} className="rounded border border-white/10 p-2 bg-white/[0.03]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                    <p className="text-[11px] text-white/70 line-clamp-2">{item.message}</p>
                  </div>
                  <button
                    onClick={() => deleteAnnouncement(item)}
                    disabled={Boolean(deletingId)}
                    className="h-8 px-2 rounded border border-rose-500/40 text-rose-300 hover:bg-rose-500/20 text-[10px] font-mono disabled:opacity-50"
                  >
                    {deletingId === (item.id || item.created_at || item.title) ? "DELETING..." : "DELETE"}
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncementPanel;

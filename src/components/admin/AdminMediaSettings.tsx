import { useEffect, useState } from "react";
import { Upload, Megaphone, Image as ImageIcon, Video, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  addAnnouncement,
  addMediaItem,
  getMediaFeed,
  getPageBackgrounds,
  PageBackgrounds,
  PlatformMediaItem,
  removeMediaItem,
  savePageBackgrounds,
  getSystemSettings,
  updateSystemSettings,
} from "@/lib/storage";
import { uploadMediaFile } from "@/lib/media-upload";
import {
  clearHomeHeroVideo,
  getHomeHeroVideoMeta,
  saveHomeHeroVideo,
} from "@/lib/hero-video";

const uploadZones = [
  { label: "Hero Banner", hint: "1920x1080" },
  { label: "Platform Logo", hint: "SVG/PNG transparent" },
  { label: "Sponsor Banner", hint: "1200x200" },
];

const AdminMediaSettings = ({ logAction }: { logAction: (a: string) => void }) => {
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementType, setAnnouncementType] = useState<"info" | "warning" | "success" | "error">("info");
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [mediaItems, setMediaItems] = useState<PlatformMediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroMeta, setHeroMeta] = useState<{
    name: string;
    type: string;
    size: number;
    updated_at: string;
  } | null>(null);
  const [pageBackgrounds, setPageBackgrounds] = useState<PageBackgrounds>({});

  useEffect(() => {
    setMediaItems(getMediaFeed());
    getHomeHeroVideoMeta().then(setHeroMeta).catch(() => setHeroMeta(null));
    setPageBackgrounds(getPageBackgrounds());
    const settings = getSystemSettings();
    setMaintenanceMode(Boolean(settings.maintenance_mode));
    setMaintenanceMessage(settings.maintenance_message || "");
  }, []);

  const handlePageBackgroundUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof PageBackgrounds,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    try {
      const mediaUrl = await uploadMediaFile(file, "page-backgrounds");
      const next = { ...pageBackgrounds, [key]: mediaUrl };
      setPageBackgrounds(next);
      savePageBackgrounds(next);
      toast.success(`${label} background saved`);
      logAction(`Updated page background: ${label}`);
      e.target.value = "";
    } catch (error) {
      console.error(error);
      toast.error("Failed to save page background");
    }
  };

  const removePageBackground = (key: keyof PageBackgrounds, label: string) => {
    const next = { ...pageBackgrounds, [key]: "" };
    setPageBackgrounds(next);
    savePageBackgrounds(next);
    toast.success(`${label} background removed`);
    logAction(`Removed page background: ${label}`);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.success(`Uploaded: ${label} - ${file.name}`);
    logAction(`Uploaded ${label}: ${file.name}`);
  };

  const handleFeedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Only images and videos are allowed");
      return;
    }

    setUploading(true);
    try {
      const mediaUrl = await uploadMediaFile(file, "platform-feed");
      const created = addMediaItem({
        name: file.name,
        kind: isImage ? "image" : "video",
        url: mediaUrl,
        mime_type: file.type,
        created_by: "admin@arenax.gg",
      });
      addAnnouncement({
        title: "New media published",
        message: `${file.name} was added to the platform media feed`,
        type: "info",
        created_by: "admin@arenax.gg",
      });
      setMediaItems((prev) => [created, ...prev]);
      toast.success("Media added to platform feed");
      logAction(`Published media: ${file.name}`);
      e.target.value = "";
    } catch (err) {
      console.error(err);
      toast.error("Failed to process media file");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = (id: string, name: string) => {
    removeMediaItem(id);
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
    toast.success("Media removed");
    logAction(`Removed media: ${name}`);
  };

  const handleHeroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file");
      return;
    }
    // Keep hard limit to avoid browser storage failures.
    if (file.size > 80 * 1024 * 1024) {
      toast.error("Video too large. Please use a file under 80MB.");
      return;
    }

    setHeroUploading(true);
    try {
      await saveHomeHeroVideo(file);
      const meta = await getHomeHeroVideoMeta();
      setHeroMeta(meta);
      toast.success("Home hero video uploaded");
      logAction(`Uploaded home hero video: ${file.name}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload hero video");
    } finally {
      setHeroUploading(false);
      e.target.value = "";
    }
  };

  const removeHeroVideo = async () => {
    await clearHomeHeroVideo();
    setHeroMeta(null);
    toast.success("Home hero video removed");
    logAction("Removed home hero video");
  };

  const broadcastAnnouncement = () => {
    if (!announcementTitle || !announcementMsg) return;
    addAnnouncement({
      title: announcementTitle,
      message: announcementMsg,
      type: announcementType,
      created_by: "admin@arenax.gg",
    });
    logAction(`Broadcast: [${announcementType}] ${announcementTitle}`);
    toast.success("Announcement published to notifications");
    setAnnouncementTitle("");
    setAnnouncementMsg("");
  };

  return (
    <div className="space-y-8">
      <h2 className="font-mono text-lg text-white/80">Media & System Settings</h2>

      <div>
        <span className="font-mono text-xs text-white/40 uppercase mb-4 block">Platform Media Uploads</span>
        <div className="grid md:grid-cols-3 gap-4">
          {uploadZones.map((z) => (
            <label
              key={z.label}
              className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-white/15 cursor-pointer hover:border-white/30 hover:bg-white/[0.02] transition-all group"
            >
              <Upload size={24} className="text-white/20 mb-2 group-hover:text-white/50" />
              <span className="font-mono text-xs text-white/30">{z.label}</span>
              <span className="font-mono text-[10px] text-white/20 mt-1">{z.hint}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, z.label)} />
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Video size={14} className="text-white/40" />
          <span className="font-mono text-xs text-white/40 uppercase">Home Hero Trailer / Advertisement</span>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
          <p className="font-mono text-[11px] text-white/60">
            Upload a constant video for homepage hero background. It appears only when uploaded.
          </p>
          <label className="flex items-center justify-center gap-2 h-12 rounded-lg border border-dashed border-cyan-400/40 bg-black/20 text-cyan-300 font-mono text-xs cursor-pointer hover:bg-cyan-500/10 transition-colors">
            {heroUploading ? "Uploading..." : "UPLOAD HERO VIDEO"}
            <input type="file" accept="video/*" className="hidden" onChange={handleHeroVideoUpload} disabled={heroUploading} />
          </label>
          {heroMeta ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 p-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-white truncate">{heroMeta.name}</p>
                <p className="font-mono text-[10px] text-white/40">
                  {(heroMeta.size / (1024 * 1024)).toFixed(1)}MB · Updated {new Date(heroMeta.updated_at).toLocaleString()}
                </p>
              </div>
              <button onClick={removeHeroVideo} className="px-3 h-8 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-mono">
                REMOVE
              </button>
            </div>
          ) : (
            <p className="font-mono text-[11px] text-white/40">No hero video uploaded yet.</p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon size={14} className="text-white/40" />
          <span className="font-mono text-xs text-white/40 uppercase">Page Background Images</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { key: "games_page", label: "Games Page" },
            { key: "game_page_default", label: "Game Detail Default" },
            { key: "teams_page", label: "Teams Page" },
            { key: "team_page_default", label: "Team Detail Default" },
            { key: "tournaments_page", label: "Tournaments Page" },
            { key: "tournament_page_default", label: "Tournament Detail Default" },
          ].map((item) => {
            const value = pageBackgrounds[item.key as keyof PageBackgrounds];
            return (
              <div key={item.key} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
                <div className="font-mono text-xs text-white/70">{item.label}</div>
                {value ? (
                  <div className="space-y-2">
                    <img src={value} alt={item.label} className="h-24 w-full rounded-lg object-cover border border-white/10" />
                    <button
                      onClick={() => removePageBackground(item.key as keyof PageBackgrounds, item.label)}
                      className="w-full h-9 rounded border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs font-mono"
                    >
                      REMOVE
                    </button>
                  </div>
                ) : (
                  <label className="flex h-24 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-cyan-500/30 bg-cyan-500/5 text-cyan-300 font-mono text-xs hover:bg-cyan-500/10">
                    UPLOAD IMAGE
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePageBackgroundUpload(e, item.key as keyof PageBackgrounds, item.label)}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon size={14} className="text-white/40" />
          <span className="font-mono text-xs text-white/40 uppercase">Platform Media Feed</span>
        </div>

        <label className="flex items-center justify-center gap-2 h-16 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 text-emerald-300 font-mono text-xs cursor-pointer hover:bg-emerald-500/10 transition-colors">
          {uploading ? "Uploading..." : "UPLOAD IMAGE OR VIDEO TO PLATFORM"}
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFeedUpload}
            disabled={uploading}
          />
        </label>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {mediaItems.length === 0 && (
            <div className="font-mono text-xs text-white/30">No media published yet.</div>
          )}
          {mediaItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
              <div className="rounded-lg overflow-hidden border border-white/10 bg-black/40">
                {item.kind === "image" ? (
                  <img src={item.url} alt={item.name} className="w-full h-40 object-cover" />
                ) : (
                  <video src={item.url} className="w-full h-40 object-cover" controls />
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-xs text-white truncate">{item.name}</div>
                  <div className="font-mono text-[10px] text-white/40">
                    {item.kind === "image" ? <ImageIcon size={12} className="inline mr-1" /> : <Video size={12} className="inline mr-1" />}
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMedia(item.id, item.name)}
                  className="p-2 rounded border border-rose-500/20 text-rose-300 hover:bg-rose-500/10"
                  title="Remove media"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone size={14} className="text-white/40" />
          <span className="font-mono text-xs text-white/40 uppercase">Global Announcement</span>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="col-span-2">
            <Input
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              placeholder="Announcement title"
              className="bg-white/5 border-white/10 text-white font-mono"
            />
          </div>
          <select
            value={announcementType}
            onChange={(e) => setAnnouncementType(e.target.value as "info" | "warning" | "success" | "error")}
            className="h-10 rounded-md bg-white/5 border border-white/10 text-white font-mono text-xs px-3"
          >
            {["info", "warning", "success", "error"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <Textarea
          value={announcementMsg}
          onChange={(e) => setAnnouncementMsg(e.target.value)}
          placeholder="Message..."
          className="bg-white/5 border-white/10 text-white font-mono mb-3"
        />
        <button
          onClick={broadcastAnnouncement}
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs rounded-lg transition-colors"
        >
          BROADCAST ANNOUNCEMENT
        </button>
      </div>

      <div className="border-t border-white/10 pt-6 space-y-4">
        <span className="font-mono text-xs text-white/40 uppercase block">System Configuration</span>

        <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-4 flex items-center justify-between">
          <div>
            <div className="font-mono text-sm text-rose-300">Maintenance Mode</div>
            <div className="font-mono text-[10px] text-white/30 mt-1">
              Takes platform offline for all non-admin users
            </div>
          </div>
          <Switch
            checked={maintenanceMode}
            onCheckedChange={(v) => {
              setMaintenanceMode(v);
              updateSystemSettings({ maintenance_mode: v, maintenance_message: maintenanceMessage });
              logAction(`Maintenance mode -> ${v ? "ON" : "OFF"}`);
              toast.success(v ? "Maintenance mode enabled" : "Maintenance mode disabled");
            }}
            className="data-[state=checked]:bg-rose-500"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] text-white/40 uppercase">Maintenance Message (Optional)</label>
          <Input
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            placeholder="Temporary shutdown for maintenance. Please check back soon."
            className="bg-white/5 border-white/10 text-white font-mono mt-2"
          />
          <button
            onClick={() => {
              updateSystemSettings({ maintenance_mode: maintenanceMode, maintenance_message: maintenanceMessage });
              toast.success("Maintenance message saved");
              logAction("Updated maintenance message");
            }}
            className="mt-2 px-4 h-9 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs"
          >
            SAVE MAINTENANCE MESSAGE
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminMediaSettings;

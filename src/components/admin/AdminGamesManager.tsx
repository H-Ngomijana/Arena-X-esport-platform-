import { useState } from "react";
import { Palette, Upload, X, Plus, Pencil, Trash2, Image as ImageIcon, Check } from "lucide-react";
import { useGames } from "@/context/GamesContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { uploadMediaFile } from "@/lib/media-upload";

interface GameForm {
  name: string; slug: string; description: string; players_per_team: number; is_active: boolean;
  logo_url: string; banner_url: string; background_url: string;
  primary: string; secondary: string; accent: string; gradient_from: string; gradient_to: string;
  win_points: number; loss_points: number; draw_points: number; k_factor: number;
  game_modes: ("team" | "solo")[];
}

const defaultForm: GameForm = {
  name: "", slug: "", description: "", players_per_team: 5, is_active: true,
  logo_url: "", banner_url: "", background_url: "",
  primary: "#6366f1", secondary: "#a855f7", accent: "#22d3ee", gradient_from: "#6366f1", gradient_to: "#a855f7",
  win_points: 25, loss_points: -25, draw_points: 0, k_factor: 32,
  game_modes: ["team"],
};

const AdminGamesManager = ({ logAction }: { logAction: (a: string) => void }) => {
  const { games: gamesList, createGame, updateGame, deleteGame } = useGames();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<GameForm>(defaultForm);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [backgroundPreview, setBackgroundPreview] = useState<string>("");

  const openCreate = () => { 
    setEditId(null); 
    setForm(defaultForm); 
    setLogoPreview("");
    setBannerPreview("");
    setBackgroundPreview("");
    setDialogOpen(true); 
  };
  
  const openEdit = (g: typeof gamesList[0]) => {
    setEditId(g.id);
    setForm({ 
      ...defaultForm, 
      name: g.name, 
      slug: g.slug, 
      description: g.description, 
      is_active: g.is_active, 
      logo_url: g.logo_url || "", 
      banner_url: g.banner_url || "",
      background_url: g.background_url || "",
      game_modes: g.game_modes || ["team"]
    });
    setLogoPreview(g.logo_url || "");
    setBannerPreview(g.banner_url || "");
    setBackgroundPreview(g.background_url || "");
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: name.toLowerCase().replace(/\s+/g, "-") }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await uploadMediaFile(file, "games");
      setLogoPreview(result);
      setForm(f => ({ ...f, logo_url: result }));
      logAction(`Uploaded game logo: ${file.name}`);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await uploadMediaFile(file, "games");
      setBannerPreview(result);
      setForm(f => ({ ...f, banner_url: result }));
      logAction(`Uploaded game banner: ${file.name}`);
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await uploadMediaFile(file, "games");
      setBackgroundPreview(result);
      setForm(f => ({ ...f, background_url: result }));
      logAction(`Uploaded game background: ${file.name}`);
    }
  };

  const removeLogo = () => {
    setLogoPreview("");
    setForm(f => ({ ...f, logo_url: "" }));
  };

  const removeBanner = () => {
    setBannerPreview("");
    setForm(f => ({ ...f, banner_url: "" }));
  };

  const removeBackground = () => {
    setBackgroundPreview("");
    setForm(f => ({ ...f, background_url: "" }));
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editId) {
      updateGame(editId, { 
        name: form.name, 
        slug: form.slug, 
        description: form.description, 
        is_active: form.is_active, 
        logo_url: form.logo_url, 
        banner_url: form.banner_url,
        background_url: form.background_url,
        game_modes: form.game_modes
      });
      logAction(`Updated game: ${form.name}`);
      toast.success("Game updated");
    } else {
      const newGame = { 
        id: Date.now().toString(), 
        name: form.name, 
        slug: form.slug, 
        description: form.description, 
        player_count: 0, 
        tournament_count: 0, 
        theme: { primary: "239 84% 67%", secondary: "270 70% 50%", accent: "187 96% 52%" }, 
        is_active: form.is_active, 
        logo_url: form.logo_url, 
        banner_url: form.banner_url,
        background_url: form.background_url,
        game_modes: form.game_modes
      } as any;
      createGame(newGame);
      logAction(`Created game: ${form.name}`);
      toast.success("Game created");
    }
    setDialogOpen(false);
  };

  const handleDelete = (g: typeof gamesList[0]) => {
    deleteGame(g.id);
    logAction(`Deleted game: ${g.name}`);
    toast.success("Game deleted");
  };

  const toggleActive = (g: typeof gamesList[0]) => {
    updateGame(g.id, { is_active: !g.is_active });
    logAction(`Toggled game active: ${g.name} → ${!g.is_active}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-lg text-white/80">Game Manager</h2>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs rounded-lg transition-colors">
          <Plus size={14} /> ADD GAME
        </button>
      </div>

      <div className="space-y-2">
        {gamesList.map((g) => (
          <div key={g.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            {g.logo_url ? (
              <img src={g.logo_url} alt={g.name} className="w-14 h-14 rounded-lg flex-shrink-0 object-cover border border-white/10" />
            ) : (
              <div className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center border border-white/10" style={{ background: `linear-gradient(135deg, hsl(${g.theme.primary}), hsl(${g.theme.secondary}))` }} />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm text-white">{g.name}</div>
              <div className="font-mono text-[10px] text-white/30">{g.slug}</div>
            </div>
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${g.is_active ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-400"}`}>
              {g.is_active ? "ACTIVE" : "INACTIVE"}
            </span>
            <Switch checked={g.is_active} onCheckedChange={() => toggleActive(g)} className="data-[state=checked]:bg-emerald-500" />
            <button onClick={() => openEdit(g)} className="p-2 text-white/30 hover:text-white transition-colors"><Pencil size={14} /></button>
            <button onClick={() => handleDelete(g)} className="p-2 text-white/30 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0a0a0f] border-rose-500/20 max-w-2xl max-h-[90vh] overflow-y-auto font-mono">
          <DialogHeader>
            <DialogTitle className="font-mono text-white">{editId ? "Edit Game" : "Create Game"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Name</label>
                <Input value={form.name} onChange={e => handleNameChange(e.target.value)} className="bg-white/5 border-white/10 text-white font-mono" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Slug</label>
                <Input value={form.slug} readOnly className="bg-white/5 border-white/10 text-white/50 font-mono" />
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] text-white/40 uppercase">Description</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-white/5 border-white/10 text-white font-mono" />
            </div>

            {/* Media Upload */}
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={14} className="text-white/40" />
                <span className="font-mono text-xs text-white/60 uppercase">Game Media</span>
              </div>
              
              {/* Logo Upload */}
              <div className="mb-4">
                <label className="font-mono text-[10px] text-white/40 uppercase mb-2 block">Game Logo</label>
                {logoPreview ? (
                  <div className="relative w-32 h-32 rounded-lg border border-white/20 overflow-hidden bg-white/5 p-2">
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover rounded" />
                    <button
                      onClick={removeLogo}
                      className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 rounded-full transition-colors"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg hover:border-rose-500/50 transition-colors cursor-pointer bg-white/[0.02] hover:bg-white/[0.05]">
                    <div className="text-center">
                      <Upload size={20} className="mx-auto text-white/40 mb-2" />
                      <span className="font-mono text-xs text-white/40">Click to upload logo</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Banner Upload */}
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase mb-2 block">Game Banner</label>
                {bannerPreview ? (
                  <div className="relative w-full h-24 rounded-lg border border-white/20 overflow-hidden bg-white/5 p-2">
                    <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover rounded" />
                    <button
                      onClick={removeBanner}
                      className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 rounded-full transition-colors"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-white/20 rounded-lg hover:border-rose-500/50 transition-colors cursor-pointer bg-white/[0.02] hover:bg-white/[0.05]">
                    <div className="text-center">
                      <Upload size={20} className="mx-auto text-white/40 mb-2" />
                      <span className="font-mono text-xs text-white/40">Click to upload banner</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Page Background Upload */}
              <div className="mt-4">
                <label className="font-mono text-[10px] text-white/40 uppercase mb-2 block">Game Page Background</label>
                {backgroundPreview ? (
                  <div className="relative w-full h-28 rounded-lg border border-white/20 overflow-hidden bg-white/5 p-2">
                    <img src={backgroundPreview} alt="Background preview" className="w-full h-full object-cover rounded" />
                    <button
                      onClick={removeBackground}
                      className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 rounded-full transition-colors"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-28 border-2 border-dashed border-white/20 rounded-lg hover:border-rose-500/50 transition-colors cursor-pointer bg-white/[0.02] hover:bg-white/[0.05]">
                    <div className="text-center">
                      <Upload size={20} className="mx-auto text-white/40 mb-2" />
                      <span className="font-mono text-xs text-white/40">Click to upload game page background</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Players per team</label>
                <Input type="number" value={form.players_per_team} onChange={e => setForm(f => ({ ...f, players_per_team: +e.target.value }))} className="bg-white/5 border-white/10 text-white font-mono" />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} className="data-[state=checked]:bg-emerald-500" />
                <span className="font-mono text-xs text-white/60">Active</span>
              </div>
            </div>

            {/* Game Modes */}
            <div className="border-t border-white/10 pt-4">
              <span className="font-mono text-xs text-white/60 uppercase mb-3 block">Game Modes</span>
              <div className="grid grid-cols-2 gap-3">
                {(["team", "solo"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setForm(f => ({
                      ...f,
                      game_modes: f.game_modes.includes(mode)
                        ? f.game_modes.filter(m => m !== mode)
                        : [...f.game_modes, mode]
                    }))}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      form.game_modes.includes(mode)
                        ? "border-emerald-500 bg-emerald-500/20"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    {form.game_modes.includes(mode) && <Check size={14} className="text-emerald-400" />}
                    <span className="font-mono text-xs capitalize">{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Config */}
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Palette size={14} className="text-white/40" />
                <span className="font-mono text-xs text-white/60 uppercase">Theme Configuration</span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {(["primary", "secondary", "accent", "gradient_from", "gradient_to"] as const).map(key => (
                  <div key={key}>
                    <label className="font-mono text-[10px] text-white/30 capitalize">{key.replace("_", " ")}</label>
                    <input type="color" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="w-full h-10 rounded-lg cursor-pointer border-0" />
                  </div>
                ))}
              </div>
              <div className="h-12 rounded-lg mt-3 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${form.gradient_from}, ${form.gradient_to})`, boxShadow: `0 0 20px ${form.primary}66` }}>
                <span className="font-mono text-xs font-bold" style={{ color: form.accent }}>THEME PREVIEW</span>
              </div>
            </div>

            {/* ELO */}
            <div className="border-t border-white/10 pt-4">
              <span className="font-mono text-xs text-white/60 uppercase mb-3 block">ELO Scoring Rules</span>
              <div className="grid grid-cols-4 gap-3">
                {(["win_points", "loss_points", "draw_points", "k_factor"] as const).map(key => (
                  <div key={key}>
                    <label className="font-mono text-[10px] text-white/30 capitalize">{key.replace("_", " ")}</label>
                    <Input type="number" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: +e.target.value }))} className="bg-white/5 border-white/10 text-white font-mono" />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSave} className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs rounded-lg transition-colors">
              {editId ? "UPDATE GAME" : "CREATE GAME"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGamesManager;

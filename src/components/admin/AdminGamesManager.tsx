import { useState } from "react";
import { Palette, Upload, X, Plus, Pencil, Trash2 } from "lucide-react";
import { games as initialGames } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface GameForm {
  name: string; slug: string; description: string; players_per_team: number; is_active: boolean;
  logo_url: string; banner_url: string;
  primary: string; secondary: string; accent: string; gradient_from: string; gradient_to: string;
  win_points: number; loss_points: number; draw_points: number; k_factor: number;
}

const defaultForm: GameForm = {
  name: "", slug: "", description: "", players_per_team: 5, is_active: true,
  logo_url: "", banner_url: "",
  primary: "#6366f1", secondary: "#a855f7", accent: "#22d3ee", gradient_from: "#6366f1", gradient_to: "#a855f7",
  win_points: 25, loss_points: -25, draw_points: 0, k_factor: 32,
};

const AdminGamesManager = ({ logAction }: { logAction: (a: string) => void }) => {
  const [gamesList, setGamesList] = useState(initialGames.map(g => ({ ...g, is_active: true })));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<GameForm>(defaultForm);

  const openCreate = () => { setEditId(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (g: typeof gamesList[0]) => {
    setEditId(g.id);
    setForm({ ...defaultForm, name: g.name, slug: g.slug, description: g.description, is_active: g.is_active });
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: name.toLowerCase().replace(/\s+/g, "-") }));
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editId) {
      setGamesList(prev => prev.map(g => g.id === editId ? { ...g, name: form.name, slug: form.slug, description: form.description, is_active: form.is_active } : g));
      logAction(`Updated game: ${form.name}`);
      toast.success("Game updated");
    } else {
      const newGame = { id: Date.now().toString(), name: form.name, slug: form.slug, description: form.description, player_count: 0, tournament_count: 0, theme: { primary: "239 84% 67%", secondary: "270 70% 50%", accent: "187 96% 52%" }, is_active: form.is_active };
      setGamesList(prev => [...prev, newGame]);
      logAction(`Created game: ${form.name}`);
      toast.success("Game created");
    }
    setDialogOpen(false);
  };

  const handleDelete = (g: typeof gamesList[0]) => {
    setGamesList(prev => prev.filter(x => x.id !== g.id));
    logAction(`Deleted game: ${g.name}`);
    toast.success("Game deleted");
  };

  const toggleActive = (g: typeof gamesList[0]) => {
    setGamesList(prev => prev.map(x => x.id === g.id ? { ...x, is_active: !x.is_active } : x));
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
            <div className="w-14 h-14 rounded-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, hsl(${g.theme.primary}), hsl(${g.theme.secondary}))` }} />
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

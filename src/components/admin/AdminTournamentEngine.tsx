import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Zap, Star } from "lucide-react";
import { tournaments as initialTournaments, games } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const statusBadge: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-slate-500/20", text: "text-slate-300" },
  registration_open: { bg: "bg-emerald-500/20", text: "text-emerald-300" },
  registration_closed: { bg: "bg-amber-500/20", text: "text-amber-300" },
  in_progress: { bg: "bg-cyan-500/20", text: "text-cyan-300" },
  completed: { bg: "bg-purple-500/20", text: "text-purple-300" },
  cancelled: { bg: "bg-rose-500/20", text: "text-rose-300" },
};

const AdminTournamentEngine = ({ logAction }: { logAction: (a: string) => void }) => {
  const [tournamentsList, setTournamentsList] = useState(initialTournaments);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", game_id: "", game_name: "", format: "single_elimination", max_teams: 16,
    start_date: "", registration_deadline: "", prize_1st: "", prize_2nd: "", prize_3rd: "",
    status: "draft", region: "", rules: "",
  });

  const openCreate = () => { setEditId(null); setForm({ name: "", game_id: "", game_name: "", format: "single_elimination", max_teams: 16, start_date: "", registration_deadline: "", prize_1st: "", prize_2nd: "", prize_3rd: "", status: "draft", region: "", rules: "" }); setDialogOpen(true); };

  const openEdit = (t: typeof tournamentsList[0]) => {
    setEditId(t.id);
    setForm({ name: t.name, game_id: t.game_id, game_name: t.game_name, format: t.format, max_teams: t.max_teams, start_date: t.start_date, registration_deadline: t.registration_deadline, prize_1st: "", prize_2nd: "", prize_3rd: "", status: t.status, region: t.region, rules: "" });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editId) {
      setTournamentsList(prev => prev.map(t => t.id === editId ? { ...t, ...form, prize_pool: form.prize_1st || t.prize_pool } : t));
      logAction(`Updated tournament: ${form.name}`);
    } else {
      setTournamentsList(prev => [...prev, { id: Date.now().toString(), ...form, registered_count: 0, prize_pool: form.prize_1st || "$0", featured: false }]);
      logAction(`Created tournament: ${form.name}`);
    }
    toast.success(editId ? "Tournament updated" : "Tournament created");
    setDialogOpen(false);
  };

  const quickStatus = (id: string, status: string) => {
    setTournamentsList(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    logAction(`Changed tournament status: ${status}`);
    toast.success(`Status → ${status}`);
  };

  const generateBracket = (t: typeof tournamentsList[0]) => {
    const teamCount = t.registered_count || t.max_teams;
    const n = Math.pow(2, Math.ceil(Math.log2(teamCount)));
    const rounds = Math.log2(n);
    logAction(`Generated bracket for: ${t.name} (${rounds} rounds, ${n} slots)`);
    toast.success(`Bracket generated: ${rounds} rounds, ${n} slots`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-lg text-white/80">Tournament Engine</h2>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs rounded-lg transition-colors">
          <Plus size={14} /> CREATE TOURNAMENT
        </button>
      </div>

      <div className="space-y-2">
        {tournamentsList.map((t) => {
          const sb = statusBadge[t.status] || statusBadge.draft;
          const expanded = expandedId === t.id;
          return (
            <div key={t.id} className="rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-white">{t.name}</span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${sb.bg} ${sb.text}`}>{t.status.replace("_", " ")}</span>
                    {t.featured && <Star size={12} className="text-amber-400 fill-amber-400" />}
                  </div>
                  <div className="font-mono text-[10px] text-white/30 mt-1">
                    {t.game_name} · {t.format.replace("_", " ")} · {t.registered_count}/{t.max_teams} teams · {t.prize_pool}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {["registration_open", "in_progress", "completed"].map(s => (
                    <button key={s} onClick={() => quickStatus(t.id, s)} className={`font-mono text-[9px] px-2 py-1 rounded border transition-colors ${t.status === s ? "bg-rose-500/20 border-rose-500/30 text-rose-300" : "border-white/10 text-white/30 hover:text-white/60"}`}>
                      {s === "registration_open" ? "REG" : s === "in_progress" ? "START" : "END"}
                    </button>
                  ))}
                </div>
                <button onClick={() => generateBracket(t)} className="p-2 text-amber-400/60 hover:text-amber-400 transition-colors" title="Generate Bracket"><Zap size={14} /></button>
                <button onClick={() => openEdit(t)} className="p-2 text-white/30 hover:text-white transition-colors"><Pencil size={14} /></button>
                <button onClick={() => { setTournamentsList(prev => prev.filter(x => x.id !== t.id)); logAction(`Deleted tournament: ${t.name}`); toast.success("Deleted"); }} className="p-2 text-white/30 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
                <button onClick={() => setExpandedId(expanded ? null : t.id)} className="p-2 text-white/30 hover:text-white transition-colors">
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {expanded && (
                <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-white/5 pt-3">
                  <div><span className="font-mono text-[10px] text-white/30">Prize Pool</span><div className="font-mono text-sm text-white">{t.prize_pool}</div></div>
                  <div><span className="font-mono text-[10px] text-white/30">Start Date</span><div className="font-mono text-sm text-white">{t.start_date}</div></div>
                  <div><span className="font-mono text-[10px] text-white/30">Bracket</span><div className="font-mono text-sm text-white/50">Not generated</div></div>
                  <div><span className="font-mono text-[10px] text-white/30">Region</span><div className="font-mono text-sm text-white">{t.region}</div></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0a0a0f] border-rose-500/20 max-w-2xl max-h-[90vh] overflow-y-auto font-mono">
          <DialogHeader><DialogTitle className="font-mono text-white">{editId ? "Edit Tournament" : "Create Tournament"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="font-mono text-[10px] text-white/40 uppercase">Name</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-white/5 border-white/10 text-white font-mono" /></div>
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Game</label>
                <select value={form.game_id} onChange={e => { const g = games.find(g => g.id === e.target.value); setForm(f => ({ ...f, game_id: e.target.value, game_name: g?.name || "" })); }} className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white font-mono text-sm px-3">
                  <option value="">Select game</option>
                  {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Format</label>
                <select value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white font-mono text-sm px-3">
                  {["single_elimination", "double_elimination", "round_robin", "swiss"].map(f => <option key={f} value={f}>{f.replace("_", " ")}</option>)}
                </select>
              </div>
              <div><label className="font-mono text-[10px] text-white/40 uppercase">Max Teams</label><Input type="number" value={form.max_teams} onChange={e => setForm(f => ({ ...f, max_teams: +e.target.value }))} className="bg-white/5 border-white/10 text-white font-mono" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="font-mono text-[10px] text-white/40 uppercase">Start Date</label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="bg-white/5 border-white/10 text-white font-mono" /></div>
              <div><label className="font-mono text-[10px] text-white/40 uppercase">Reg Deadline</label><Input type="date" value={form.registration_deadline} onChange={e => setForm(f => ({ ...f, registration_deadline: e.target.value }))} className="bg-white/5 border-white/10 text-white font-mono" /></div>
            </div>
            <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-4">
              <span className="font-mono text-xs text-rose-400 uppercase mb-3 block">Prize Structure</span>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="font-mono text-[10px] text-white/30">1st Place</label><Input value={form.prize_1st} onChange={e => setForm(f => ({ ...f, prize_1st: e.target.value }))} className="bg-white/5 border-white/10 text-white font-mono" /></div>
                <div><label className="font-mono text-[10px] text-white/30">2nd Place</label><Input value={form.prize_2nd} onChange={e => setForm(f => ({ ...f, prize_2nd: e.target.value }))} className="bg-white/5 border-white/10 text-white font-mono" /></div>
                <div><label className="font-mono text-[10px] text-white/30">3rd Place</label><Input value={form.prize_3rd} onChange={e => setForm(f => ({ ...f, prize_3rd: e.target.value }))} className="bg-white/5 border-white/10 text-white font-mono" /></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white font-mono text-sm px-3">
                  {["draft", "registration_open", "registration_closed", "in_progress", "completed", "cancelled"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
              <div><label className="font-mono text-[10px] text-white/40 uppercase">Region</label><Input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} className="bg-white/5 border-white/10 text-white font-mono" /></div>
            </div>
            <div>
              <label className="font-mono text-[10px] text-white/40 uppercase">Rules</label>
              <Textarea value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} className="bg-white/5 border-white/10 text-white font-mono min-h-28" />
            </div>
            <button onClick={handleSave} className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs rounded-lg transition-colors">
              {editId ? "UPDATE TOURNAMENT" : "CREATE TOURNAMENT"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTournamentEngine;

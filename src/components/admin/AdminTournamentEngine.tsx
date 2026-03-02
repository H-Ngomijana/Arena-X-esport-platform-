import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Zap, Star, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getTournaments, saveTournaments } from "@/lib/storage";
import { useGames } from "@/context/GamesContext";
import { uploadMediaFile } from "@/lib/media-upload";

const statusBadge: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-slate-500/20", text: "text-slate-300" },
  registration_open: { bg: "bg-emerald-500/20", text: "text-emerald-300" },
  registration_closed: { bg: "bg-amber-500/20", text: "text-amber-300" },
  in_progress: { bg: "bg-cyan-500/20", text: "text-cyan-300" },
  completed: { bg: "bg-purple-500/20", text: "text-purple-300" },
  cancelled: { bg: "bg-rose-500/20", text: "text-rose-300" },
};

const defaultForm = {
  name: "",
  game_id: "",
  game_name: "",
  format: "single_elimination",
  max_teams: 16,
  start_date: "",
  registration_deadline: "",
  prize_1st: "",
  prize_2nd: "",
  prize_3rd: "",
  status: "draft",
  region: "",
  rules: "",
  entry_fee_amount: 0,
  entry_fee_currency: "RWF",
  payment_recipient_name: "Uwase Kevine",
  payment_recipient_number: "0794417555",
  payment_description: "ArenaX Tournament Entry Fee",
  banner_url: "",
};

const AdminTournamentEngine = ({ logAction }: { logAction: (a: string) => void }) => {
  const { games } = useGames();
  const [tournamentsList, setTournamentsList] = useState<any[]>(getTournaments());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    const refresh = () => setTournamentsList(getTournaments());
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (!detail?.key || detail.key === "tournaments" || detail.key === "remote_sync") refresh();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "tournaments" || event.key === null) refresh();
    };
    window.addEventListener("arenax:data-changed", onChange as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("arenax:data-changed", onChange as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (t: any) => {
    setEditId(t.id);
    setForm({
      name: t.name,
      game_id: t.game_id,
      game_name: t.game_name,
      format: t.format,
      max_teams: t.max_teams,
      start_date: t.start_date,
      registration_deadline: t.registration_deadline,
      prize_1st: "",
      prize_2nd: "",
      prize_3rd: "",
      status: t.status,
      region: t.region,
      rules: t.rules || "",
      entry_fee_amount: Number(t.entry_fee_amount ?? t.entry_fee ?? 0),
      entry_fee_currency: t.entry_fee_currency || "RWF",
      payment_recipient_name: t.payment_recipient_name || "Uwase Kevine",
      payment_recipient_number: t.payment_recipient_number || "0794417555",
      payment_description: t.payment_description || "ArenaX Tournament Entry Fee",
      banner_url: t.banner_url || "",
    });
    setDialogOpen(true);
  };

  const persist = (next: any[]) => {
    setTournamentsList(next);
    saveTournaments(next);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadMediaFile(file, "tournaments");
      setForm((f) => ({ ...f, banner_url: result }));
      logAction(`Uploaded tournament banner: ${file.name}`);
      toast.success("Tournament public banner uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload tournament banner");
    }
  };

  const handleSave = () => {
    if (!form.name) return;
    if (!form.game_id) {
      toast.error("Please select a game for this tournament");
      return;
    }

    const selectedGame = games.find((g) => g.id === form.game_id);
    const normalizedForm = {
      ...form,
      game_name: selectedGame?.name || form.game_name || "",
    };

    if (editId) {
      const next = tournamentsList.map((t) =>
        t.id === editId
          ? {
              ...t,
              ...normalizedForm,
              prize_pool: normalizedForm.prize_1st || t.prize_pool,
              entry_fee: Number(normalizedForm.entry_fee_amount || 0),
            }
          : t
      );
      persist(next);
      logAction(`Updated tournament: ${form.name}`);
    } else {
      const next = [
        ...tournamentsList,
        {
          id: Date.now().toString(),
          ...normalizedForm,
          registered_count: 0,
          registered_teams: [],
          prize_pool: normalizedForm.prize_1st || "$0",
          featured: false,
          entry_fee: Number(normalizedForm.entry_fee_amount || 0),
        },
      ];
      persist(next);
      logAction(`Created tournament: ${form.name}`);
    }

    toast.success(editId ? "Tournament updated" : "Tournament created");
    setDialogOpen(false);
  };

  const quickStatus = (id: string, status: string) => {
    const next = tournamentsList.map((t) => (t.id === id ? { ...t, status } : t));
    persist(next);
    logAction(`Changed tournament status: ${status}`);
    toast.success(`Status -> ${status}`);
  };

  const generateBracket = (t: any) => {
    const teamCount = t.registered_teams?.length || t.registered_count || t.max_teams;
    const n = Math.pow(2, Math.ceil(Math.log2(Math.max(teamCount, 2))));
    const rounds = Math.log2(n);
    logAction(`Generated bracket for: ${t.name} (${rounds} rounds, ${n} slots)`);
    toast.success(`Bracket generated: ${rounds} rounds, ${n} slots`);
  };

  const deleteTournament = (id: string, name: string) => {
    const next = tournamentsList.filter((t) => t.id !== id);
    persist(next);
    logAction(`Deleted tournament: ${name}`);
    toast.success("Deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-lg text-white/80">Tournament Engine</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs rounded-lg transition-colors"
        >
          <Plus size={14} /> CREATE TOURNAMENT
        </button>
      </div>

      <div className="space-y-2">
        {tournamentsList.map((t) => {
          const sb = statusBadge[t.status] || statusBadge.draft;
          const expanded = expandedId === t.id;
          const teamCount = t.registered_teams?.length || t.registered_count || 0;
          return (
            <div key={t.id} className="rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3 p-4">
                <div className="w-20 h-14 rounded-md overflow-hidden border border-white/10 bg-black/30 shrink-0">
                  {t.banner_url ? (
                    <img src={t.banner_url} alt={`${t.name} banner`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-slate-700 to-slate-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-white">{t.name}</span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${sb.bg} ${sb.text}`}>
                      {t.status.replace("_", " ")}
                    </span>
                    {t.featured && <Star size={12} className="text-amber-400 fill-amber-400" />}
                  </div>
                  <div className="font-mono text-[10px] text-white/30 mt-1">
                    {t.game_name} · {t.format.replace("_", " ")} · {teamCount}/{t.max_teams} teams · {t.prize_pool}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {["registration_open", "in_progress", "completed"].map((s) => (
                    <button
                      key={s}
                      onClick={() => quickStatus(t.id, s)}
                      className={`font-mono text-[9px] px-2 py-1 rounded border transition-colors ${
                        t.status === s
                          ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                          : "border-white/10 text-white/30 hover:text-white/60"
                      }`}
                    >
                      {s === "registration_open" ? "REG" : s === "in_progress" ? "START" : "END"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => generateBracket(t)}
                  className="p-2 text-amber-400/60 hover:text-amber-400 transition-colors"
                  title="Generate Bracket"
                >
                  <Zap size={14} />
                </button>
                <button onClick={() => openEdit(t)} className="p-2 text-white/30 hover:text-white transition-colors">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteTournament(t.id, t.name)}
                  className="p-2 text-white/30 hover:text-rose-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setExpandedId(expanded ? null : t.id)}
                  className="p-2 text-white/30 hover:text-white transition-colors"
                >
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {expanded && (
                <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-white/5 pt-3">
                  <div>
                    <span className="font-mono text-[10px] text-white/30">Prize Pool</span>
                    <div className="font-mono text-sm text-white">{t.prize_pool}</div>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-white/30">Start Date</span>
                    <div className="font-mono text-sm text-white">{t.start_date}</div>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-white/30">Bracket</span>
                    <div className="font-mono text-sm text-white/50">Not generated</div>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-white/30">Region</span>
                    <div className="font-mono text-sm text-white">{t.region}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0a0a0f] border-rose-500/20 max-w-2xl max-h-[90vh] overflow-y-auto font-mono">
          <DialogHeader>
            <DialogTitle className="font-mono text-white">
              {editId ? "Edit Tournament" : "Create Tournament"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white font-mono"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Game</label>
                <select
                  value={form.game_id}
                  onChange={(e) => {
                    const g = games.find((game) => game.id === e.target.value);
                    setForm((f) => ({ ...f, game_id: e.target.value, game_name: g?.name || "" }));
                  }}
                  className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white font-mono text-sm px-3"
                >
                  <option value="">Select game</option>
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Format</label>
                <select
                  value={form.format}
                  onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
                  className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white font-mono text-sm px-3"
                >
                  {["single_elimination", "double_elimination", "round_robin", "swiss"].map((f) => (
                    <option key={f} value={f}>
                      {f.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Max Teams</label>
                <Input
                  type="number"
                  value={form.max_teams}
                  onChange={(e) => setForm((f) => ({ ...f, max_teams: +e.target.value }))}
                  className="bg-white/5 border-white/10 text-white font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Start Date</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white font-mono"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Reg Deadline</label>
                <Input
                  type="date"
                  value={form.registration_deadline}
                  onChange={(e) => setForm((f) => ({ ...f, registration_deadline: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white font-mono"
                />
              </div>
            </div>
            <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-4">
              <span className="font-mono text-xs text-rose-400 uppercase mb-3 block">Prize Structure</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-[10px] text-white/30">1st Place</label>
                  <Input
                    value={form.prize_1st}
                    onChange={(e) => setForm((f) => ({ ...f, prize_1st: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-white/30">2nd Place</label>
                  <Input
                    value={form.prize_2nd}
                    onChange={(e) => setForm((f) => ({ ...f, prize_2nd: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-white/30">3rd Place</label>
                  <Input
                    value={form.prize_3rd}
                    onChange={(e) => setForm((f) => ({ ...f, prize_3rd: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white font-mono text-sm px-3"
                >
                  {["draft", "registration_open", "registration_closed", "in_progress", "completed", "cancelled"].map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Region</label>
                <Input
                  value={form.region}
                  onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] text-white/40 uppercase">Rules</label>
              <Textarea
                value={form.rules}
                onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
                className="bg-white/5 border-white/10 text-white font-mono min-h-28"
              />
            </div>
            <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-3">
              <label className="font-mono text-[10px] text-cyan-300 uppercase mb-2 block">Tournament Public Banner (Visible to Users)</label>
              <p className="font-mono text-[10px] text-white/45 mb-2">
                Shown on tournament selection cards in Games and Tournaments pages.
              </p>
              {form.banner_url ? (
                <div className="relative h-28 rounded-lg overflow-hidden border border-white/10">
                  <img src={form.banner_url} alt="Tournament banner preview" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setForm((f) => ({ ...f, banner_url: "" }))}
                    className="absolute right-2 top-2 p-1 rounded-full bg-rose-600 hover:bg-rose-700"
                    type="button"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex h-24 cursor-pointer items-center justify-center rounded-lg border border-dashed border-cyan-500/30 bg-cyan-500/5 text-cyan-300 font-mono text-xs hover:bg-cyan-500/10">
                  <Upload size={14} className="mr-2" /> UPLOAD TOURNAMENT BANNER
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                </label>
              )}
            </div>
            <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-4 space-y-3">
              <span className="font-mono text-xs text-rose-400 uppercase block">Entry Fee & Payment Settings</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] text-white/40 uppercase">Entry Fee Amount</label>
                  <Input
                    type="number"
                    value={form.entry_fee_amount}
                    onChange={(e) => setForm((f) => ({ ...f, entry_fee_amount: Number(e.target.value || 0) }))}
                    className="bg-white/5 border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-white/40 uppercase">Currency</label>
                  <select
                    value={form.entry_fee_currency}
                    onChange={(e) => setForm((f) => ({ ...f, entry_fee_currency: e.target.value }))}
                    className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white font-mono text-sm px-3"
                  >
                    <option value="RWF">RWF</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-white/40">0 = FREE tournament, no payment required.</p>
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Payment Recipient Name</label>
                <Input
                  value={form.payment_recipient_name}
                  onChange={(e) => setForm((f) => ({ ...f, payment_recipient_name: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white font-mono"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">MTN MoMo Recipient Number</label>
                <Input
                  value={form.payment_recipient_number}
                  onChange={(e) => setForm((f) => ({ ...f, payment_recipient_number: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white font-mono"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase">Payment Description</label>
                <Input
                  value={form.payment_description}
                  onChange={(e) => setForm((f) => ({ ...f, payment_description: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white font-mono"
                />
              </div>
              <p className="text-[10px] text-white/40">
                Funds are collected via MTN MoMo. Admin receives payment directly.
              </p>
            </div>
            <button
              onClick={handleSave}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs rounded-lg transition-colors"
            >
              {editId ? "UPDATE TOURNAMENT" : "CREATE TOURNAMENT"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTournamentEngine;

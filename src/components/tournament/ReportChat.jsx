import { useState } from "react";
import { toast } from "sonner";
import { createDisputeReport, getCurrentUser } from "@/lib/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadMediaFile } from "@/lib/media-upload";

const ReportChat = ({ tournamentId, matchId }) => {
  const user = getCurrentUser();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState([]);

  const handleEvidence = async (e) => {
    const files = Array.from(e.target.files || []);
    const urls = await Promise.all(files.map((file) => uploadMediaFile(file, "reports")));
    setEvidence((prev) => [...prev, ...urls]);
  };

  const handleSend = () => {
    if (!reason || !description.trim()) {
      toast.error("Please complete issue type and description");
      return;
    }
    createDisputeReport({
      tournament_id: tournamentId,
      match_id: matchId,
      reported_by_email: user.email,
      reported_by_name: user.name,
      reason,
      description: description.trim(),
      evidence_urls: evidence,
    });
    setReason("");
    setDescription("");
    setEvidence([]);
    toast.success("Report submitted. Admin will review shortly.");
  };

  return (
    <div className="font-mono rounded-xl border border-white/10 bg-[#0a0a12] p-4">
      <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3">Report To Admin</h3>
      <div className="space-y-3">
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="bg-slate-900 border-white/10">
            <SelectValue placeholder="Select issue type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unfair_match">Unfair match</SelectItem>
            <SelectItem value="lag">Lag</SelectItem>
            <SelectItem value="cheating">Cheating</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-slate-900 border-white/10 min-h-20"
          placeholder="Describe the issue..."
        />
        <label className="block rounded-lg border border-dashed border-white/20 bg-slate-900 p-3 text-sm text-white/70 cursor-pointer">
          Attach Evidence (optional)
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleEvidence} />
        </label>
        <button
          onClick={handleSend}
          className="h-11 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-widest"
        >
          SEND REPORT
        </button>
      </div>
    </div>
  );
};

export default ReportChat;

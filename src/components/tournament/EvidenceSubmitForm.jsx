import { useState } from "react";
import { toast } from "sonner";
import { updateMatch } from "@/lib/storage";
import { uploadMediaFile } from "@/lib/media-upload";

const EvidenceSubmitForm = ({ match, currentUser, onRefresh }) => {
  const [files, setFiles] = useState([]);
  const [scoreClaimed, setScoreClaimed] = useState(0);
  const [notes, setNotes] = useState("");
  const [previews, setPreviews] = useState([]);

  const onFileChange = async (event) => {
    const selected = Array.from(event.target.files || []);
    setFiles(selected);
    const urls = await Promise.all(selected.map((file) => uploadMediaFile(file, "evidence")));
    setPreviews(urls);
  };

  const submitEvidence = () => {
    if (previews.length === 0) {
      toast.error("Upload at least one screenshot");
      return;
    }

    const nextSubmissions = [
      ...(match.evidence_submissions || []),
      {
        submitted_by_email: currentUser.email,
        submitted_by_name: currentUser.name,
        screenshot_urls: previews,
        score_claimed: Number(scoreClaimed || 0),
        notes,
        submitted_at: new Date().toISOString(),
        is_public: true,
      },
    ];

    updateMatch(match.id, {
      evidence_submissions: nextSubmissions,
      status: "awaiting_results",
    });
    toast.success("Evidence submitted");
    setFiles([]);
    setPreviews([]);
    setScoreClaimed(0);
    setNotes("");
    onRefresh?.();
  };

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-[#0a0a12] p-6 font-mono space-y-4">
      <p className="text-xs uppercase tracking-widest text-white/40">Submit Match Evidence</p>
      <label className="block rounded-xl border border-white/15 bg-black/20 p-4 cursor-pointer text-sm text-white/70">
        [+] Click to upload screenshots (multiple)
        <input type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
      </label>
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((src, index) => (
            <img key={`${src}_${index}`} src={src} alt="preview" className="w-24 h-16 object-cover rounded-lg border border-white/20" />
          ))}
        </div>
      )}
      <div>
        <label className="text-xs uppercase tracking-widest text-white/40">Your Score (claimed)</label>
        <input
          type="number"
          value={scoreClaimed}
          onChange={(e) => setScoreClaimed(Number(e.target.value))}
          className="mt-1 w-full h-11 rounded-lg bg-black/30 border border-white/15 px-3 text-white"
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-white/40">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full min-h-24 rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-white"
          placeholder="Describe what happened..."
        />
      </div>
      <button
        onClick={submitEvidence}
        className="h-12 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
      >
        SUBMIT EVIDENCE
      </button>
    </div>
  );
};

export default EvidenceSubmitForm;

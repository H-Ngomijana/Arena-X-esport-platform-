import { useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { createDivisionAccessRequest, DivisionSummary } from "@/lib/divisions-api";
import { getCurrentUser } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DivisionAccessRequestModalProps {
  division: DivisionSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DivisionAccessRequestModal({ division, open, onOpenChange }: DivisionAccessRequestModalProps) {
  const currentUser = getCurrentUser() as any;
  const [proofUrl, setProofUrl] = useState("");
  const [inGameName, setInGameName] = useState("");
  const [inGameId, setInGameId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const userId = currentUser?.id || currentUser?.email;
    if (!userId) {
      toast.error("Sign in before requesting division access.");
      return;
    }
    if (!proofUrl.trim()) {
      toast.error("Add proof showing your current eFootball division.");
      return;
    }
    setSubmitting(true);
    try {
      await createDivisionAccessRequest({
        divisionSlug: division.slug,
        userId,
        currentDivisionProofUrl: proofUrl.trim(),
        inGameName: inGameName.trim(),
        inGameId: inGameId.trim(),
        note: note.trim(),
      });
      toast.success("Division request sent for admin review.");
      setProofUrl("");
      setInGameName("");
      setInGameId("");
      setNote("");
      onOpenChange(false);
    } catch {
      toast.error("Could not send request yet. Check backend database setup.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0a0a12] text-white">
        <DialogHeader>
          <DialogTitle>Request {division.name} Access</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
            Upload proof of your current eFootball division. An admin must approve your level before you can join or move divisions.
          </div>
          <Input
            value={inGameName}
            onChange={(event) => setInGameName(event.target.value)}
            placeholder="In-game username"
            className="border-white/10 bg-white/[0.04]"
          />
          <Input
            value={inGameId}
            onChange={(event) => setInGameId(event.target.value)}
            placeholder="eFootball user ID"
            className="border-white/10 bg-white/[0.04]"
          />
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-white/45">Division proof image URL</label>
            <div className="flex gap-2">
              <Input
                value={proofUrl}
                onChange={(event) => setProofUrl(event.target.value)}
                placeholder="https://..."
                className="border-white/10 bg-white/[0.04]"
              />
              <Button type="button" variant="secondary" size="icon" title="Upload image in media flow first, then paste URL">
                <Upload size={16} />
              </Button>
            </div>
          </div>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note for admin"
            className="min-h-24 border-white/10 bg-white/[0.04]"
          />
          <Button className="w-full" disabled={submitting} onClick={submit}>
            {submitting ? "Sending..." : "Send to Admin"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

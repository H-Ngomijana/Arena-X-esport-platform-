import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { createDivisionAccessRequest, DivisionSummary } from "@/lib/divisions-api";
import { uploadMediaFile } from "@/lib/media-upload";
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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState("");
  const [inGameName, setInGameName] = useState("");
  const [inGameId, setInGameId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (proofPreview) URL.revokeObjectURL(proofPreview);
    };
  }, [proofPreview]);

  const submit = async () => {
    const userId = currentUser?.id || currentUser?.email;
    if (!userId) {
      toast.error("Sign in before requesting division access.");
      return;
    }
    if (!proofFile) {
      toast.error("Upload proof showing your current eFootball division.");
      return;
    }
    setSubmitting(true);
    try {
      const proofUrl = await uploadMediaFile(proofFile, "division-proof");
      await createDivisionAccessRequest({
        divisionSlug: division.slug,
        userId,
        currentDivisionProofUrl: proofUrl,
        inGameName: inGameName.trim(),
        inGameId: inGameId.trim(),
        note: note.trim(),
      });
      toast.success("Division request sent for admin review.");
      setProofFile(null);
      setProofPreview("");
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

  const selectProofFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Upload an image file.");
      return;
    }
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
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
            <label className="text-xs font-mono uppercase tracking-widest text-white/45">Division proof image</label>
            <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-4">
              {proofPreview ? (
                <img src={proofPreview} alt="Division proof preview" className="mb-3 max-h-44 w-full rounded-md object-cover" />
              ) : (
                <div className="mb-3 flex h-32 items-center justify-center rounded-md bg-black/25 text-sm text-white/45">
                  Screenshot preview
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => selectProofFile(event.target.files?.[0])}
                className="border-white/10 bg-white/[0.04]"
              />
              <div className="mt-2 flex items-center gap-2 text-xs text-white/45">
                <Upload size={16} />
                {proofFile ? proofFile.name : "Upload the screenshot that shows your current division"}
              </div>
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

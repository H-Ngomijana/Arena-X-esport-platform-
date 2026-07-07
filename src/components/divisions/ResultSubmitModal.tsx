import { DivisionFixture } from "@/lib/divisions-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ResultSubmitModalProps {
  fixture: DivisionFixture | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResultSubmitModal({ fixture, open, onOpenChange }: ResultSubmitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0a0a12] text-white">
        <DialogHeader>
          <DialogTitle>Submit Result</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-white/70">
            {fixture?.home?.username || fixture?.homeId || "TBD"} vs {fixture?.away?.username || fixture?.awayId || "TBD"}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" min={0} placeholder="Home score" className="bg-white/[0.04] border-white/10" />
            <Input type="number" min={0} placeholder="Away score" className="bg-white/[0.04] border-white/10" />
          </div>
          <Input type="file" accept="image/*" className="bg-white/[0.04] border-white/10" />
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Save Submission
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

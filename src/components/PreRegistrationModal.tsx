import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MTN_LOGO = "https://seeklogo.com/images/M/mtn-logo-0B1E7F9A0F-seeklogo.com.png";

const PreRegistrationModal: React.FC<{
  open: boolean;
  tournament: any;
  onClose: () => void;
  onContinue: () => void;
}> = ({ open, tournament, onClose, onContinue }) => {
  if (!tournament) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ready to Compete?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{tournament.name}</p>
              <p className="text-sm text-muted-foreground">Entry Fee: {tournament.entry_fee || 0} RWF</p>
              <p className="text-sm text-muted-foreground">Registration Deadline: {tournament.registration_deadline}</p>
              <p className="text-sm text-muted-foreground">Prize Pool: {tournament.prize_pool}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <img src={MTN_LOGO} alt="MTN" className="h-8" />
              <span className="rounded-full border border-[#FFCC00]/40 bg-[#FFCC00]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFCC00]">
                Auto Popup
              </span>
            </div>
          </div>

          <div className="p-3 bg-white/5 rounded">
            <p className="text-sm">Join tournaments for only <strong>{tournament.entry_fee || 0} RWF</strong>. Compete, rank up, and win prizes.</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Back</Button>
            <Button onClick={onContinue}>Continue to Registration</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreRegistrationModal;

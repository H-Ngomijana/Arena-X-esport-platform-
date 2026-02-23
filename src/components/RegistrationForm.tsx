import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { initiatePayment } from "@/lib/payment";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const RegistrationForm: React.FC<{
  tournament: any;
  teams: any[];
  onCancel: () => void;
  onSuccess: (result: any) => void;
}> = ({ tournament, teams, onCancel, onSuccess }) => {
  const [teamId, setTeamId] = useState<string>(teams?.[0]?.id || "");
  const [members, setMembers] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [agreeRules, setAgreeRules] = useState(false);
  const [agreePayment, setAgreePayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMtnCard, setShowMtnCard] = useState(false);

  const fee = tournament?.entry_fee || 0;
  const isMobile = typeof window !== "undefined" && (
    window.matchMedia("(max-width: 768px)").matches ||
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(window.navigator.userAgent)
  );

  const selectedTeam = teams.find((t) => t.id === teamId);

  const runPayment = async () => {
    setLoading(true);
    try {
      const res = await initiatePayment({
        amount: fee,
        currency: "RWF",
        method: "MTN MoMo",
        description: `Tournament entry: ${tournament.name}`,
        phone,
        team_id: teamId,
        tournament_id: tournament.id,
        tournament_name: tournament.name,
      });

      if (res.status === "success") {
        onSuccess({ transaction: res, teamId, phone, members });
      } else {
        alert("Payment failed or cancelled");
      }
    } catch (err) {
      console.error(err);
      alert("Payment error");
    } finally {
      setLoading(false);
      setShowMtnCard(false);
    }
  };

  const proceed = async () => {
    if (!agreeRules || !agreePayment) {
      alert("Please accept rules and payment terms");
      return;
    }
    if (!teamId) return alert("Select a team");
    if (!phone) return alert("Enter captain phone number (MTN)");

    if (fee <= 0) {
      onSuccess({ transaction: null, teamId, phone, members });
      return;
    }

    if (isMobile) {
      setShowMtnCard(true);
      return;
    }

    await runPayment();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2">Select Team</Label>
        <Select onValueChange={(v) => setTeamId(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose your team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2">Captain Phone (MTN)</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="2507XXXXXXXX" />
      </div>

      <div>
        <Label className="mb-2">Team Members (comma separated emails)</Label>
        <Input onChange={(e) => setMembers(e.target.value.split(",").map(s=>s.trim()).filter(Boolean))} />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={agreeRules} onChange={(e) => setAgreeRules(e.target.checked)} />
          <span className="text-sm">I accept tournament rules</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={agreePayment} onChange={(e) => setAgreePayment(e.target.checked)} />
          <span className="text-sm">I agree to payment terms</span>
        </label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Back</Button>
        <Button onClick={proceed} disabled={loading}>
          {loading ? "Processing..." : fee > 0 ? `Proceed to Payment (${fee} RWF)` : "Register Team"}
        </Button>
      </div>

      <Dialog open={showMtnCard} onOpenChange={(open) => !loading && setShowMtnCard(open)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>MTN MoMo Payment</DialogTitle>
            <DialogDescription>Flutterwave checkout card for mobile payments.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-white/20 bg-white/5 p-4 space-y-2">
            <div className="text-xs text-muted-foreground">Team</div>
            <div className="font-semibold">{selectedTeam?.name || "Selected team"}</div>
            <div className="text-xs text-muted-foreground mt-2">Phone</div>
            <div className="font-mono">{phone}</div>
            <div className="text-xs text-muted-foreground mt-2">Amount</div>
            <div className="font-semibold">{fee} RWF</div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={loading} onClick={() => setShowMtnCard(false)}>Cancel</Button>
            <Button disabled={loading} onClick={runPayment}>
              {loading ? "Charging..." : "Pay with MTN MoMo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegistrationForm;

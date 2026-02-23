import { toast } from "sonner";

const DeviceWarning = ({ onBack }) => {
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied! Open on your phone.");
  };

  return (
    <div className="max-w-md mx-auto rounded-2xl bg-slate-900 border border-amber-500/30 p-8 text-center space-y-4">
      <div className="w-16 h-16 text-amber-400 mx-auto mb-2 text-5xl">📱</div>
      <h2 className="text-2xl font-black">MOBILE DEVICE REQUIRED</h2>
      <p className="text-white/70 text-sm">
        MTN MoMo payment requires a mobile phone. The USSD popup can only appear on your device.
      </p>
      <div className="text-sm text-white/60">
        <p>1. Open ArenaX on your mobile phone</p>
        <p>2. Navigate to this tournament</p>
        <p>3. Click Join Tournament again</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={copyLink} className="h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold">
          COPY TOURNAMENT LINK
        </button>
        <button onClick={onBack} className="h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold">
          BACK
        </button>
      </div>
      <p className="text-xs text-white/50">Link copied? Open it on your phone browser.</p>
    </div>
  );
};

export default DeviceWarning;


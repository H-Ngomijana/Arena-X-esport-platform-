import { useEffect, useMemo, useState } from "react";

interface CountdownTimerProps {
  targetTime: string;
  className?: string;
  onComplete?: () => void;
}

const splitDuration = (deltaMs: number) => {
  const total = Math.max(0, Math.floor(deltaMs / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
};

const CountdownTimer = ({ targetTime, className, onComplete }: CountdownTimerProps) => {
  const targetTs = useMemo(() => new Date(targetTime).getTime(), [targetTime]);
  const [remaining, setRemaining] = useState(Math.max(0, targetTs - Date.now()));
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = Math.max(0, targetTs - Date.now());
      setRemaining(next);
      if (next === 0 && !completed) {
        setCompleted(true);
        onComplete?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetTs, completed, onComplete]);

  if (remaining <= 0) {
    return <div className={className || "font-mono text-4xl font-black text-rose-400 animate-pulse"}>MATCH IS LIVE NOW</div>;
  }

  const { days, hours, minutes, seconds } = splitDuration(remaining);
  const blocks = [
    { value: days, label: "DAYS" },
    { value: hours, label: "HRS" },
    { value: minutes, label: "MINS" },
    { value: seconds, label: "SECS" },
  ];

  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Match Starts In</p>
      <div className="flex gap-2 justify-center">
        {blocks.map((block) => (
          <div key={block.label} className="w-16">
            <div className="h-16 rounded-xl border border-cyan-500/30 bg-[#0a0a12] flex items-center justify-center text-3xl font-mono font-black text-cyan-400">
              {block.value}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 mt-1 text-center">{block.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;

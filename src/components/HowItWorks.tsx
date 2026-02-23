import React from "react";
import { CheckCircle, Users, CreditCard } from "lucide-react";

const HowItWorks: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const items = [
    {
      icon: <Users size={20} className="text-primary" />,
      title: "Create Team",
      desc: "Register your team and add members before joining tournaments.",
    },
    {
      icon: <CreditCard size={20} className="text-primary" />,
      title: "Pay Entry Fee",
      desc: "Secure MTN MoMo payment powered by Flutterwave to reserve your slot.",
    },
    {
      icon: <CheckCircle size={20} className="text-primary" />,
      title: "Compete & Win",
      desc: "Play matches, report results and climb the leaderboard.",
    },
  ];

  return (
    <div className={compact ? "grid grid-cols-3 gap-4" : "space-y-6"}>
      {items.map((it) => (
        <div key={it.title} className={compact ? "text-center" : "flex items-start gap-4"}>
          <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">{it.icon}</div>
          <div>
            <h4 className="font-semibold">{it.title}</h4>
            <p className="text-sm text-muted-foreground">{it.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HowItWorks;

const typeStyles = {
  info: "border-cyan-400",
  match: "border-amber-400",
  winner: "border-emerald-400",
  warning: "border-rose-400",
};

const timeAgo = (iso) => {
  const diffMin = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const hrs = Math.floor(diffMin / 60);
  return `${hrs}h ago`;
};

const AnnouncementFeed = ({ items = [] }) => {
  return (
    <div className="font-mono rounded-xl border border-cyan-500/20 bg-[#0a0a12] p-4">
      <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3">Announcements</h3>
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <div key={`${item.created_at}_${idx}`} className={`border-l-4 ${typeStyles[item.type] || "border-cyan-400"} bg-black/20 p-3 rounded-r`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm">{item.message || item.title}</p>
                <span className="text-[10px] text-white/50 whitespace-nowrap">{timeAgo(item.created_at)}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-white/60">No announcements yet.</p>
        )}
      </div>
    </div>
  );
};

export default AnnouncementFeed;

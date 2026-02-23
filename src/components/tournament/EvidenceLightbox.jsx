const EvidenceLightbox = ({ images = [], currentIndex = 0, open, onClose, onPrev, onNext }) => {
  if (!open || images.length === 0) return null;
  const src = images[currentIndex] || images[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-xs font-mono border border-white/20 px-3 py-1 rounded">
        CLOSE
      </button>
      <button onClick={onPrev} className="absolute left-4 text-white/70 hover:text-white text-2xl">
        ‹
      </button>
      <img src={src} alt="Evidence" className="max-w-full max-h-[90vh] object-contain rounded-xl border border-white/20" />
      <button onClick={onNext} className="absolute right-4 text-white/70 hover:text-white text-2xl">
        ›
      </button>
    </div>
  );
};

export default EvidenceLightbox;


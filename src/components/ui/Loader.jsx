const Loader = ({ size = 'full' }) => {
  if (size === 'inline') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-f1-border border-t-f1-red rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-f1-dark flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-f1-border border-t-f1-red rounded-full animate-spin" />
        <span className="text-white/30 text-sm tracking-widest uppercase">Caricamento</span>
      </div>
    </div>
  );
};

export default Loader;

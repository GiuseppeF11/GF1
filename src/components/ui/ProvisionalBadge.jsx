/**
 * Shown while results come from OpenF1 timing data because the official FIA
 * classification has not been published yet. Retired drivers keep their last
 * on-track position in this view, so the order can still shift.
 */
const ProvisionalBadge = ({ className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 ${className}`}
    title="Classifica non ancora ufficiale — in attesa dei dati FIA"
  >
    <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
    </span>
    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400">
      Provvisorio
    </span>
  </span>
);

export default ProvisionalBadge;

import { useState, useEffect } from 'react';
import { getCountdown } from '../../utils/time';

const Pad = ({ n }) => String(n).padStart(2, '0');

const CountdownTimer = ({ targetUtc, compact = false }) => {
  const [cd, setCd] = useState(() => getCountdown(targetUtc));

  useEffect(() => {
    const id = setInterval(() => setCd(getCountdown(targetUtc)), 1000);
    return () => clearInterval(id);
  }, [targetUtc]);

  if (!cd) return null;

  const units = [
    { label: 'GG', value: cd.days },
    { label: 'HH', value: cd.hours },
    { label: 'MM', value: cd.minutes },
    { label: 'SS', value: cd.seconds },
  ];

  return (
    <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-3'}`}>
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-center">
          <div className="text-center">
            <div className={`font-black text-white tabular-nums ${compact ? 'text-lg' : 'text-2xl sm:text-3xl'}`}>
              <Pad n={value} />
            </div>
            <div className="text-[9px] text-white/30 uppercase tracking-widest">{label}</div>
          </div>
          {i < units.length - 1 && (
            <span className={`text-white/20 font-light ${compact ? 'text-base ml-1.5' : 'text-2xl ml-3'}`}>:</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;

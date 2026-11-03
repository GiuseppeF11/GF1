export const TEAM_COLORS = {
  'red_bull': '#3671C6',
  'ferrari': '#E8002D',
  'mercedes': '#27F4D2',
  'mclaren': '#FF8000',
  'aston_martin': '#229971',
  'alpine': '#FF87BC',
  'williams': '#64C4FF',
  'haas': '#B6BABD',
  'rb': '#6692FF',
  'kick_sauber': '#52E252',
  'sauber': '#52E252',
};

export const FALLBACK_COLOR = '#6b7280';

export const getTeamColor = (id) => TEAM_COLORS[id] ?? FALLBACK_COLOR;

/** Tailwind text class for a podium position (accepts number or string) */
export const posColor = (pos) => {
  const p = String(pos);
  if (p === '1') return 'text-yellow-400';
  if (p === '2') return 'text-gray-300';
  if (p === '3') return 'text-amber-600';
  return 'text-white/60';
};

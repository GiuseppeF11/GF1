import { createContext, useContext, useState } from 'react';

const CURRENT_YEAR = new Date().getFullYear();
const AVAILABLE_SEASONS = Array.from(
  { length: CURRENT_YEAR - 2018 },
  (_, i) => CURRENT_YEAR - i
);

const SeasonContext = createContext({ season: CURRENT_YEAR, setSeason: () => {}, availableSeasons: AVAILABLE_SEASONS });

export const SeasonProvider = ({ children }) => {
  const [season, setSeason] = useState(CURRENT_YEAR);
  return (
    <SeasonContext.Provider value={{ season, setSeason, availableSeasons: AVAILABLE_SEASONS }}>
      {children}
    </SeasonContext.Provider>
  );
};

export const useSeason = () => useContext(SeasonContext);

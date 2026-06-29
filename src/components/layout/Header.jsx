import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSeason } from "../../contexts/SeasonContext";
import { useLiveSession } from "../../hooks/useLiveSession";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/schedule", label: "Calendario" },
  { to: "/results/races", label: "Risultati" },
];

const LiveIndicator = () => {
  const { isLive, year, round } = useLiveSession();
  const navigate = useNavigate();
  const [showMsg, setShowMsg] = useState(false);

  const handleClick = () => {
    if (isLive && year && round) {
      navigate(`/gp/${year}/${round}`);
    } else {
      setShowMsg(true);
      setTimeout(() => setShowMsg(false), 3000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-widest transition-colors ${
          isLive
            ? 'border-f1-red/40 bg-f1-red/10 text-f1-red hover:bg-f1-red/20'
            : 'border-f1-border bg-transparent text-white/25 hover:text-white/40'
        }`}
        aria-label="Sessione live"
      >
        <span className="relative flex h-2 w-2 flex-shrink-0">
          {isLive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-f1-red opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-f1-red' : 'bg-white/20'}`} />
        </span>
        Live
      </button>

      {showMsg && (
        <div className="absolute top-full right-0 mt-2 w-52 bg-f1-surface border border-f1-border rounded-xl px-3 py-2 text-white/60 text-xs shadow-lg z-50 text-center">
          Nessuna sessione in corso al momento
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const { pathname } = useLocation();
  const { season, setSeason, availableSeasons } = useSeason();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-f1-dark/95 backdrop-blur border-b border-f1-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-screen-xl mx-auto">
        <Link to="/" className="flex items-center" aria-label="GF1 — Home">
          <svg viewBox="0 0 82 30" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto" aria-hidden="true">
            {/* Speed lines */}
            <rect x="0" y="8"  width="11" height="1.8" rx="0.9" fill="#E8002D" opacity="0.55"/>
            <rect x="0" y="13" width="8"  height="1.2" rx="0.6" fill="#E8002D" opacity="0.32"/>
            <rect x="0" y="17" width="5"  height="0.9" rx="0.5" fill="#E8002D" opacity="0.18"/>
            {/* GF1 italic */}
            <g transform="translate(15,26) skewX(-9)">
              <text y="0" fontFamily="'Arial Black',Impact,Arial,sans-serif" fontSize="26" fontWeight="900" fill="#ffffff" letterSpacing="-1">G</text>
              <text x="19" y="0" fontFamily="'Arial Black',Impact,Arial,sans-serif" fontSize="26" fontWeight="900" fill="#E8002D" letterSpacing="-1">F</text>
              <text x="37" y="0" fontFamily="'Arial Black',Impact,Arial,sans-serif" fontSize="26" fontWeight="900" fill="#ffffff" letterSpacing="-1">1</text>
            </g>
            {/* Underline */}
            <rect x="15" y="28" width="60" height="2" rx="1" fill="#E8002D"/>
          </svg>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.to ||
              (link.to !== "/" &&
                pathname.startsWith(
                  link.to.split("/")[1] !== ""
                    ? `/${link.to.split("/")[1]}`
                    : "/",
                ));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-f1-red text-white"
                    : "text-white/60 hover:text-white hover:bg-f1-surface"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Live + season selector */}
        <div className="flex items-center gap-2">
          <LiveIndicator />
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="bg-f1-surface border border-f1-border rounded-lg px-2 py-1 text-white text-xs font-semibold appearance-none cursor-pointer focus:outline-none focus:border-f1-red/60 tabular-nums"
            aria-label="Seleziona stagione"
          >
            {availableSeasons.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};

export default Header;

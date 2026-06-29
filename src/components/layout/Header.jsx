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
        <Link to="/" className="flex items-center gap-2">
          <span className="text-f1-red font-black text-xl tracking-tighter leading-none">
            GF1
          </span>
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

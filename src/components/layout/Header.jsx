import { Link, useLocation } from "react-router-dom";
import { useSeason } from "../../contexts/SeasonContext";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/schedule", label: "Calendario" },
  { to: "/results/races", label: "Risultati" },
];

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

        {/* Season selector */}
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
    </header>
  );
};

export default Header;

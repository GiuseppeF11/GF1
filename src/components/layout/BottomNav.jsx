import { NavLink, useLocation } from 'react-router-dom';

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const CalIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ResultsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const DriversIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const TABS = [
  { to: '/', label: 'Home', icon: HomeIcon, exact: true },
  { to: '/schedule', label: 'Calendario', icon: CalIcon },
  { to: '/results/races', label: 'Risultati', icon: ResultsIcon },
];

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-f1-dark/95 backdrop-blur border-t border-f1-border md:hidden safe-area-inset-bottom">
      <div className="flex">
        {TABS.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to.replace(/\/[^/]+$/, '') || to);
          const isActive = exact
            ? pathname === to
            : pathname === to || pathname.startsWith(to.split('/').slice(0, 2).join('/') + '/') || pathname === to.split('/').slice(0, 2).join('/');

          return (
            <NavLink
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                isActive ? 'text-f1-red' : 'text-white/40'
              }`}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

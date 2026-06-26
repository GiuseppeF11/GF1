import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';

const TABS = [
  { to: '/results/races', label: 'Gare' },
  { to: '/results/drivers', label: 'Piloti' },
  { to: '/results/teams', label: 'Scuderie' },
];

const Results = () => {
  const { pathname } = useLocation();

  if (pathname === '/results') {
    return <Navigate to="/results/races" replace />;
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Sub-nav tabs */}
      <div className="flex gap-1 bg-f1-surface rounded-2xl p-1 border border-f1-border">
        {TABS.map(tab => {
          const active = pathname.startsWith(tab.to);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`flex-1 text-center py-2 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-f1-red text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
};

export default Results;

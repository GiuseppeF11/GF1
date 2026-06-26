import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { SeasonProvider } from './contexts/SeasonContext';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Results from './pages/Results';
import ResultsRaces from './pages/Results/Races';
import ResultsDrivers from './pages/Results/Drivers';
import ResultsTeams from './pages/Results/Teams';
import DriverDetail from './pages/DriverDetail';
import GPDetail from './pages/GPDetail';

function App() {
  return (
    <Router>
      <SeasonProvider>
      <div className="min-h-dvh bg-f1-dark flex flex-col">
        <Header />

        {/* Main content — padded for header and bottom nav */}
        <main className="flex-1 pt-14 pb-20 md:pb-0 px-4 py-4 max-w-screen-xl mx-auto w-full">
          <div className="pt-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/results" element={<Results />}>
                <Route index element={<Navigate to="/results/races" replace />} />
                <Route path="races" element={<ResultsRaces />} />
                <Route path="drivers" element={<ResultsDrivers />} />
                <Route path="teams" element={<ResultsTeams />} />
              </Route>
              <Route path="/driver/:driverNumber" element={<DriverDetail />} />
              <Route path="/gp/:year/:round" element={<GPDetail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        <Footer />
        <BottomNav />
      </div>
      </SeasonProvider>
    </Router>
  );
}

export default App;

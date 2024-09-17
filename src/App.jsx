import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Races from './routes/Races';
import RaceDetails from './routes/RaceDetails';
import './App.css'

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Races />} />
          <Route path="/race/:id" element={<RaceDetails />} />
        </Routes>
      </Router>
    </>
  )
}

export default App

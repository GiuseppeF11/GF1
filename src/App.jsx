import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Races from './routes/Races';
import Header from './components/Header';
import Aside from './components/Aside';
import Footer from './components/Footer';
import RaceDetails from './routes/RaceDetails';
import './App.css'

function App() {

  return (
    <>
      <Header></Header>
      <div className="container flex">
        <Aside></Aside>
        <Router>
          <Routes>
            <Route path="/" element={<Races />} />
            <Route path="/race/:id" element={<RaceDetails />} />
          </Routes>
        </Router>
      </div>
      <Footer></Footer>
    </>
  )
}

export default App

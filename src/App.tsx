import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VisionAidHomepage from './components/VisionAidHomepage';
import Projects from './components/Projects';
import About from './components/About';
import Contact from './components/Contact';
import UrbanTrafficDynamics from './components/projects/UrbanTrafficDynamics';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VisionAidHomepage />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/urban-traffic-dynamics" element={<UrbanTrafficDynamics />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}

export default App;

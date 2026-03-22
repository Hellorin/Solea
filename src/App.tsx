import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Guide from './pages/Guide';
import Cycle from './pages/Cycle';
import CycleBuilder from './pages/CycleBuilder';
import Stats from './pages/Stats';
import BottomNav from './components/BottomNav';
import styles from './App.module.css';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div className={styles.routeWrapper} key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/cycle" element={<Cycle />} />
        <Route path="/cycle/new" element={<CycleBuilder />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className={styles.app}>
        <AnimatedRoutes />
        <BottomNav />
      </div>
    </HashRouter>
  );
}

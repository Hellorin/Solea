import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Guide from './pages/Guide';
import Cycle from './pages/Cycle';
import CycleBuilder from './pages/CycleBuilder';
import Stats from './pages/Stats';
import BottomNav from './components/BottomNav';
import { loadTimes } from './utils/storage';
import { requestPermission, scheduleNotifications } from './utils/notifications';
import styles from './App.module.css';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div className={styles.routeWrapper} key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/cycle" element={<Cycle />} />
        <Route path="/cycle/new" element={<CycleBuilder />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // On startup, request notification permission then refresh the 30-day schedule
    // so the rolling window stays current even if the user hasn't opened the app in a while.
    requestPermission().then(async granted => {
      if (granted) scheduleNotifications(await loadTimes());
    });
  }, []);

  return (
    <HashRouter>
      <div className={styles.app}>
        <AnimatedRoutes />
        <BottomNav />
      </div>
    </HashRouter>
  );
}

import { useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import Guide from './pages/Guide';
import Cycle from './pages/Cycle';
import Stats from './pages/Stats';
import BottomNav from './components/BottomNav';
import { loadTimes } from './utils/storage';
import { requestPermission, startReminderChecker } from './utils/notifications';
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
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const [times, setTimes] = useState<string[]>([]);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const saved = loadTimes();
    setTimes(saved);
    requestPermission();
  }, []);

  useEffect(() => {
    if (cleanupRef.current) cleanupRef.current();
    cleanupRef.current = startReminderChecker(times);
    return () => { if (cleanupRef.current) cleanupRef.current(); };
  }, [times]);

  // Listen for storage changes from Schedule page
  useEffect(() => {
    function handleStorage() {
      setTimes(loadTimes());
    }
    window.addEventListener('storage', handleStorage);
    // Also poll every 5s to catch same-tab changes.
    // Use functional update and bail out when content hasn't changed,
    // otherwise the checker effect would restart on every poll tick.
    const poll = setInterval(() => {
      const fresh = loadTimes();
      setTimes(prev =>
        JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh
      );
    }, 5000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(poll);
    };
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

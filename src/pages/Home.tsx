import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadTimes } from '../utils/storage';
import { requestPermission } from '../utils/notifications';
import styles from './Home.module.css';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getNextReminder(times: string[]): string | null {
  if (times.length === 0) return null;
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const sorted = [...times].sort();
  for (const t of sorted) {
    const [h, m] = t.split(':').map(Number);
    const mins = h * 60 + m;
    if (mins > currentMins) return t;
  }
  return sorted[0]; // wrap to first of next day
}

export default function Home() {
  const [times, setTimes] = useState<string[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const navigate = useNavigate();

  useEffect(() => {
    setTimes(loadTimes());
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const nextReminder = getNextReminder(times);

  async function handlePermissionBanner() {
    const granted = await requestPermission();
    setPermission(granted ? 'granted' : 'denied');
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <svg
          className={styles.wave}
          viewBox="0 0 480 200"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,0 L480,0 L480,140 Q360,200 240,160 Q120,120 0,180 Z"
            fill="#7BAF8E"
            opacity="0.15"
          />
          <path
            d="M0,0 L480,0 L480,100 Q360,160 240,120 Q120,80 0,140 Z"
            fill="#7BAF8E"
            opacity="0.2"
          />
        </svg>
        <div className={styles.heroContent}>
          <p className={styles.greeting}>{getGreeting()} 👋</p>
          <h1 className={styles.title}>Solea</h1>
        </div>
      </div>

      {permission === 'denied' && (
        <button className={styles.permissionBanner} onClick={handlePermissionBanner}>
          Reminders are disabled. Tap here to open notification settings.
        </button>
      )}

      <div className={styles.content}>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Next reminder</p>
            <p className={styles.statValue}>
              {nextReminder ?? '—'}
            </p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Today's reminders</p>
            <p className={styles.statValue}>{times.length}</p>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => navigate('/guide')}>
            View Exercises
          </button>
          <button className={styles.btnSecondary} onClick={() => navigate('/schedule')}>
            Manage Schedule
          </button>
        </div>

        <p className={styles.tagline}>
          A few minutes a day keeps the pain away.
        </p>
      </div>
    </div>
  );
}

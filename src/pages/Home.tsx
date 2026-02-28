import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadTimes } from '../utils/storage';
import { requestPermission } from '../utils/notifications';
import { getGreeting, getNextReminder } from '../utils/reminderUtils';
import { PRESETS, getPresetExercises } from '../data/cycles';
import { toLocalDateStr, computeStreaks, computeThisWeek } from '../utils/statsUtils';
import { getTodayPain, savePainEntry } from '../utils/painLog';
import { loadHistory } from '../utils/history';
import { recommendCycle } from '../utils/recommendations';
import styles from './Home.module.css';

const PAIN_EMOJIS = [
  { level: 1, emoji: '😌', label: 'No pain' },
  { level: 2, emoji: '😐', label: 'Mild pain' },
  { level: 3, emoji: '😬', label: 'Moderate pain' },
  { level: 4, emoji: '😣', label: 'Quite painful' },
  { level: 5, emoji: '😭', label: 'Severe pain' },
];

export default function Home() {
  const [times, setTimes] = useState<string[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [todayPain, setTodayPain] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const today = toLocalDateStr(new Date());
      const [times, todayPain, history] = await Promise.all([
        loadTimes(),
        getTodayPain(today),
        loadHistory(),
      ]);
      setTimes(times);
      if ('Notification' in globalThis) {
        setPermission(Notification.permission);
      }
      setTodayPain(todayPain);
      setStreak(computeStreaks(history, today).current);
      setWeeklyCount(computeThisWeek(history, today).done);
    }
    load();
  }, []);

  async function handlePainSelect(level: number) {
    const today = toLocalDateStr(new Date());
    await savePainEntry(today, level);
    setTodayPain(level);
  }

  const nextReminder = getNextReminder(times, new Date());
  const recommendation = recommendCycle({
    painLevel: todayPain,
    streak,
    weeklyCount,
    hour: new Date().getHours(),
  });
  const quickStartCycle = PRESETS.find(p => p.id === recommendation.presetId)!;
  const quickStartExercises = getPresetExercises(quickStartCycle);

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
          <p className={styles.greeting}>{getGreeting(new Date().getHours())} 👋</p>
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

        <div className={styles.painCard}>
          <p className={styles.painTitle}>How's your foot today?</p>
          {todayPain === null ? (
            <div className={styles.painEmojis}>
              {PAIN_EMOJIS.map(({ level, emoji, label }) => (
                <button key={level} className={styles.painBtn}
                  aria-label={label} onClick={() => handlePainSelect(level)}>
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.painLogged}>
              <span className={styles.painSelectedEmoji}>{PAIN_EMOJIS[todayPain - 1].emoji}</span>
              <button className={styles.painChangeBtn} onClick={() => setTodayPain(null)}>
                Change
              </button>
            </div>
          )}
        </div>

        <div className={styles.quickStartCard}>
          <div className={styles.quickStartLeft}>
            <span className={styles.quickStartEmoji}>{quickStartCycle.emoji}</span>
            <div className={styles.quickStartText}>
              <span className={styles.quickStartLabel}>{quickStartCycle.label}</span>
              <span className={styles.quickStartReason}>
                {recommendation.reasonEmoji} {recommendation.reason}
              </span>
              <span className={styles.quickStartCount}>{quickStartExercises.length} exercises</span>
            </div>
          </div>
          <button
            className={styles.quickStartBtn}
            onClick={() => navigate('/cycle', { state: { quickStart: quickStartCycle.id } })}
          >
            Start
          </button>
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

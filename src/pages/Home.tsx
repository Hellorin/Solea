import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGreeting } from '../utils/reminderUtils';
import { PRESETS, getPresetExercises } from '../data/cycles';
import { toLocalDateStr, computeStreaks, computeThisWeek } from '../utils/statsUtils';
import { getTodayPain, savePainEntry } from '../utils/painLog';
import { loadHistory } from '../utils/history';
import { recommendCycle } from '../utils/recommendations';
import { PAIN_EMOJIS } from '../data/pain';
import { loadProgram, PROGRAM_DAYS } from '../utils/rehabProgram';
import styles from './Home.module.css';

export default function Home() {
  const [todayPain, setTodayPain] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [rehabDay, setRehabDay] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const today = toLocalDateStr(new Date());
    setTodayPain(getTodayPain(today));
    const history = loadHistory();
    setStreak(computeStreaks(history, today).current);
    setWeeklyCount(computeThisWeek(history, today).done);
    const program = loadProgram();
    if (program && program.active && !program.paused) {
      setRehabDay(program.currentDay);
    }
  }, []);

  function handlePainSelect(level: number) {
    const today = toLocalDateStr(new Date());
    savePainEntry(today, level);
    setTodayPain(level);
  }

  const recommendation = recommendCycle({
    painLevel: todayPain,
    streak,
    weeklyCount,
    hour: new Date().getHours(),
  });
  const quickStartCycle = PRESETS.find(p => p.id === recommendation.presetId)!;
  const quickStartExercises = getPresetExercises(quickStartCycle);

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

      <div className={styles.content}>
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

        {rehabDay !== null && (
          <button
            className={styles.rehabBanner}
            onClick={() => navigate('/rehab')}
          >
            <span className={styles.rehabBannerIcon}>🦶</span>
            <span className={styles.rehabBannerText}>
              <strong>Rehab program</strong> — Day {rehabDay} of {PROGRAM_DAYS}
            </span>
            <span className={styles.rehabBannerArrow}>→</span>
          </button>
        )}

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
        </div>

        <p className={styles.tagline}>
          A few minutes a day keeps the pain away.
        </p>
      </div>
    </div>
  );
}

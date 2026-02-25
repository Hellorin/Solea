import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exercises } from '../data/exercises';
import { saveSession } from '../utils/history';
import styles from './Cycle.module.css';

type View = 'pre' | 'running' | 'done';

function fmt(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Cycle() {
  const navigate = useNavigate();
  const [includeStrength, setIncludeStrength] = useState(false);
  const [view, setView] = useState<View>('pre');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSecs, setTotalSecs] = useState(0);
  const [exSecs, setExSecs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const list = [
    ...exercises.filter(e => e.category === 'stretching'),
    ...exercises.filter(e => e.category === 'mobility'),
    ...(includeStrength ? exercises.filter(e => e.category === 'strengthening') : []),
  ];

  const stretchCount = exercises.filter(e => e.category === 'stretching').length;
  const mobilityCount = exercises.filter(e => e.category === 'mobility').length;
  const strengthCount = exercises.filter(e => e.category === 'strengthening').length;
  const totalCount = stretchCount + mobilityCount + (includeStrength ? strengthCount : 0);
  const estMins = Math.round(totalCount * 1.5);

  function startTick() {
    intervalRef.current = setInterval(() => {
      setTotalSecs(s => s + 1);
      if (readyRef.current) setExSecs(s => s + 1);
    }, 1000);
  }

  function pauseTick() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    return () => pauseTick();
  }, []);

  function handleStart() {
    setCurrentIndex(0);
    setTotalSecs(0);
    setExSecs(0);
    setReady(false);
    readyRef.current = false;
    setPaused(false);
    setView('running');
    startTick();
  }

  function handleReady() {
    setReady(true);
    readyRef.current = true;
  }

  function handlePause() {
    pauseTick();
    setPaused(true);
  }

  function handleResume() {
    startTick();
    setPaused(false);
  }

  function handleNext() {
    if (currentIndex + 1 >= list.length) {
      pauseTick();
      saveSession(totalSecs, list.length);
      setView('done');
    } else {
      setCurrentIndex(i => i + 1);
      setExSecs(0);
      setReady(false);
      readyRef.current = false;
    }
  }

  function handleRestart() {
    pauseTick();
    setView('pre');
    setCurrentIndex(0);
    setTotalSecs(0);
    setExSecs(0);
    setReady(false);
    readyRef.current = false;
    setPaused(false);
  }

  if (view === 'pre') {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/guide')}>
            ← Back
          </button>
          <h1 className={styles.title}>Exercise Cycle</h1>
          <p className={styles.subtitle}>Run through all exercises in sequence</p>
        </div>

        <div className={styles.content}>
          <div className={styles.card}>
            <label className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                <span className={styles.toggleIcon}>💪</span>
                Include strengthening exercises
                <span className={styles.toggleNote}>Acute phase — skip if painful</span>
              </span>
              <button
                role="switch"
                aria-checked={includeStrength}
                className={`${styles.toggle} ${includeStrength ? styles.toggleOn : ''}`}
                onClick={() => setIncludeStrength(v => !v)}
              >
                <span className={styles.toggleThumb} />
              </button>
            </label>
          </div>

          <div className={styles.statsCard}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{totalCount}</span>
              <span className={styles.statLabel}>exercises</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statValue}>~{estMins}</span>
              <span className={styles.statLabel}>min estimated</span>
            </div>
          </div>

          <button className={styles.btnPrimary} onClick={handleStart}>
            Start Cycle
          </button>
        </div>
      </div>
    );
  }

  if (view === 'running') {
    const ex = list[currentIndex];

    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.progressLine}>
            Exercise {currentIndex + 1} of {list.length}
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${((currentIndex + 1) / list.length) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.content}>
          <img
            src={ex.image}
            alt={ex.name}
            className={styles.exerciseImage}
          />

          <h2 className={styles.exerciseName}>{ex.name}</h2>

          <div className={styles.badges}>
            <span className={styles.badge}>{ex.duration}</span>
            <span className={styles.badge}>{ex.reps}</span>
          </div>

          <ol className={styles.steps}>
            {ex.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          {ex.tip && (
            <p className={styles.tip}>
              <strong>Tip:</strong> {ex.tip}
            </p>
          )}

          <div className={styles.timers}>
            <div className={styles.timerBlock}>
              <span className={styles.timerValue}>{ready ? fmt(exSecs) : '--:--'}</span>
              <span className={styles.timerLabel}>this exercise</span>
            </div>
            <div className={styles.timerDivider} />
            <div className={styles.timerBlock}>
              <span className={styles.timerValue}>{fmt(totalSecs)}</span>
              <span className={styles.timerLabel}>total</span>
            </div>
          </div>

          {!ready ? (
            <div className={styles.runActions}>
              <button className={styles.btnPause} onClick={paused ? handleResume : handlePause}>
                {paused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button className={styles.btnPrimary} onClick={handleReady}>
                I'm Ready
              </button>
            </div>
          ) : (
            <>
              <div className={styles.runActions}>
                <button
                  className={styles.btnPause}
                  onClick={paused ? handleResume : handlePause}
                >
                  {paused ? '▶ Resume' : '⏸ Pause'}
                </button>
                <button className={styles.btnPrimary} onClick={handleNext}>
                  {currentIndex + 1 >= list.length ? 'Finish' : 'Next Exercise'}
                </button>
              </div>

              {currentIndex + 1 < list.length && (
                <button className={styles.skipBtn} onClick={handleNext}>
                  Skip
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // done view
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.doneHero}>
          <span className={styles.doneEmoji}>🎉</span>
          <h1 className={styles.doneTitle}>Cycle complete!</h1>
          <p className={styles.doneSub}>Great work — you finished all {list.length} exercises.</p>
        </div>

        <div className={styles.statsCard}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{fmt(totalSecs)}</span>
            <span className={styles.statLabel}>total time</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{list.length}</span>
            <span className={styles.statLabel}>exercises done</span>
          </div>
        </div>

        <button className={styles.btnPrimary} onClick={handleRestart}>
          Start Again
        </button>
        <button className={styles.btnSecondary} onClick={() => navigate('/guide')}>
          Back to Guide
        </button>
      </div>
    </div>
  );
}

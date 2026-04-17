import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loadProgram,
  saveProgram,
  clearProgram,
  checkMissedDays,
  PROGRAM_DAYS,
  type RehabProgram,
  type RehabDay,
} from '../utils/rehabProgram';
import { exercises as allExercises } from '../data/exercises';
import type { Phase } from '../data/cycles';
import { toLocalDateStr } from '../utils/statsUtils';
import { loadHistory } from '../utils/history';
import styles from './Rehab.module.css';

const PHASE_LABEL: Record<Phase, string> = {
  relief: 'Pain relief',
  loading: 'Loading',
  strengthening: 'Strengthening',
};

const PHASE_CLASS: Record<Phase, string> = {
  relief: styles.phaseRelief,
  loading: styles.phaseLoading,
  strengthening: styles.phaseStrengthening,
};

const PHASE_DOT: Record<Phase, string> = {
  relief: styles.dotRelief,
  loading: styles.dotLoading,
  strengthening: styles.dotStrengthening,
};

function nameFor(id: string): string {
  return allExercises.find(e => e.id === id)?.name ?? id;
}

function didSessionToday(today: string): boolean {
  return loadHistory().some(s => s.date === today);
}

export default function Rehab() {
  const navigate = useNavigate();
  const [program, setProgram] = useState<RehabProgram | null>(null);
  const [today] = useState(() => toLocalDateStr(new Date()));
  const [sessionToday, setSessionToday] = useState(false);

  useEffect(() => {
    const p = loadProgram();
    if (p && p.active) {
      const { shouldPause } = checkMissedDays(p, today);
      if (shouldPause && !p.paused) {
        const paused = { ...p, paused: true };
        saveProgram(paused);
        setProgram(paused);
      } else {
        setProgram(p);
      }
    } else {
      setProgram(p);
    }
    setSessionToday(didSessionToday(today));
  }, [today]);

  function handleStart() {
    navigate('/rehab/start');
  }

  function handleResume() {
    if (!program) return;
    const resumed = { ...program, paused: false };
    saveProgram(resumed);
    setProgram(resumed);
  }

  function handleAbandon() {
    if (!globalThis.confirm('Abandon your 30-day program? Your check-in history will be lost.')) return;
    clearProgram();
    setProgram(null);
  }

  function handleStartSession(day: RehabDay) {
    navigate('/cycle', {
      state: {
        prescribedIds: day.exerciseIds,
        prescribedLabel: `Day ${day.day} of ${PROGRAM_DAYS}`,
        prescribedEmoji: phaseEmoji(day.phase),
        fromRehab: true,
      },
    });
  }

  function handleCheckin() {
    navigate('/rehab/checkin');
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>30-Day Rehab</h1>
        <p className={styles.subtitle}>
          {program && program.active
            ? `Day ${program.currentDay} of ${PROGRAM_DAYS}`
            : 'Adaptive plantar fasciitis recovery'}
        </p>
      </div>

      <div className={styles.content}>
        {!program || !program.active
          ? renderNoProgram(handleStart, program)
          : program.paused
            ? renderPaused(handleResume, handleAbandon)
            : renderActive(program, today, sessionToday, handleStartSession, handleCheckin)}

        {program && program.active && renderGrid(program)}

        {program && program.active && (
          <button className={styles.footerLink} onClick={handleAbandon}>
            Abandon program
          </button>
        )}
      </div>
    </div>
  );
}

function renderNoProgram(onStart: () => void, program: RehabProgram | null) {
  return (
    <div className={styles.hero}>
      <span className={styles.heroEmoji}>🦶</span>
      <h2 className={styles.heroTitle}>
        {program && !program.active ? 'Start a new 30-day program' : 'Start your 30-day program'}
      </h2>
      <p className={styles.heroSub}>
        Two quick questions and we'll build a daily plan that adapts to how your foot feels.
      </p>
      <button className={styles.startBtn} onClick={onStart}>
        Start now
      </button>
    </div>
  );
}

function renderPaused(onResume: () => void, onAbandon: () => void) {
  return (
    <div className={styles.pausedCard}>
      <h2 className={styles.pausedTitle}>Your program is paused</h2>
      <p className={styles.pausedSub}>
        You missed 2 or more days in a row. Resume when you're ready — we'll pick up where you left off.
      </p>
      <div className={styles.pausedBtns}>
        <button className={styles.btnOutline} onClick={onResume}>Resume</button>
        <button className={styles.btnDanger} onClick={onAbandon}>Abandon</button>
      </div>
    </div>
  );
}

function renderActive(
  program: RehabProgram,
  today: string,
  sessionToday: boolean,
  onStartSession: (day: RehabDay) => void,
  onCheckin: () => void,
) {
  const day = program.days[program.currentDay - 1];
  // Check-in pending: user completed a session today (saved to history) but
  // hasn't submitted feedback, so the current day isn't marked completed yet.
  const checkinPending = sessionToday && !day.completed;

  if (checkinPending) {
    return (
      <div className={styles.banner}>
        <span>How did today feel? Log a check-in to plan tomorrow.</span>
        <button className={styles.bannerBtn} onClick={onCheckin}>Log check-in</button>
      </div>
    );
  }

  // If the current day is already completed (check-in submitted), show "done for today" card.
  if (day.completed && day.date === today) {
    return (
      <div className={styles.bannerDone}>
        ✓ Done for today — see you tomorrow.
      </div>
    );
  }

  return (
    <div className={styles.todayCard}>
      {program.lastAdaptationReason && (
        <p className={styles.reason}>{program.lastAdaptationReason}</p>
      )}
      <div className={styles.dayLine}>
        <span className={styles.dayLabel}>Day {day.day}</span>
        <span className={`${styles.phaseBadge} ${PHASE_CLASS[day.phase]}`}>
          {PHASE_LABEL[day.phase]}
        </span>
        {day.lite && <span className={styles.liteBadge}>Lighter day</span>}
      </div>
      <ul className={styles.exList}>
        {day.exerciseIds.map(id => (
          <li key={id} className={styles.exItem}>{nameFor(id)}</li>
        ))}
      </ul>
      <button className={styles.startBtn} onClick={() => onStartSession(day)}>
        Start today's session
      </button>
    </div>
  );
}

function renderGrid(program: RehabProgram) {
  return (
    <div className={styles.gridCard}>
      <h2 className={styles.gridTitle}>Your 30 days</h2>
      <div className={styles.grid}>
        {program.days.map(d => {
          const isToday = d.day === program.currentDay;
          const cls = [
            styles.dot,
            d.completed ? PHASE_DOT[d.phase] : '',
            d.completed ? styles.dotCompleted : '',
            isToday ? styles.dotToday : '',
          ].filter(Boolean).join(' ');
          return (
            <div
              key={d.day}
              className={cls}
              title={`Day ${d.day}${d.completed ? ` · ${PHASE_LABEL[d.phase]}` : ''}`}
            >
              {!d.completed ? d.day : null}
            </div>
          );
        })}
      </div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.dotRelief}`} /> Relief
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.dotLoading}`} /> Loading
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.dotStrengthening}`} /> Strengthening
        </div>
      </div>
    </div>
  );
}

function phaseEmoji(phase: Phase): string {
  if (phase === 'relief') return '🌿';
  if (phase === 'loading') return '💪';
  return '🔥';
}

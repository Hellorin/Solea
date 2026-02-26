import { useMemo } from 'react';
import { loadHistory } from '../utils/history';
import type { Session } from '../utils/history';
import styles from './Stats.module.css';

function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toLocalDateStr(d);
}

function computeStreaks(history: Session[], today: string) {
  const datesWithSession = new Set(history.map(s => s.date));

  // Current streak: walk backwards from today
  let current = 0;
  let cursor = today;
  while (datesWithSession.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  // Best streak: iterate from first session date to today
  let best = 0;
  let running = 0;
  if (history.length > 0) {
    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
    let iter = sorted[0].date;
    while (iter <= today) {
      if (datesWithSession.has(iter)) {
        running++;
        if (running > best) best = running;
      } else {
        running = 0;
      }
      iter = addDays(iter, 1);
    }
  }

  return { current, best };
}

function computeThisWeek(history: Session[], today: string): { done: number; elapsed: number } {
  const d = new Date(today + 'T00:00:00');
  // Monday = 1, Sunday = 0 → adjust to Mon-based week
  const dayOfWeek = d.getDay(); // 0 Sun, 1 Mon, ... 6 Sat
  const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = addDays(today, -daysFromMon);

  const datesWithSession = new Set(history.map(s => s.date));
  let done = 0;
  let elapsed = 0;
  let iter = monday;
  while (iter <= today) {
    elapsed++;
    if (datesWithSession.has(iter)) done++;
    iter = addDays(iter, 1);
  }
  return { done, elapsed };
}

function buildCalendarWeeks(today: string): string[][] {
  // Show last ~30 days: 5 full weeks (Mon–Sun)
  const d = new Date(today + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  // End on the Sunday of the current week
  const endSunday = addDays(today, 6 - daysFromMon);
  // Start: 5 weeks back from endSunday
  const startMonday = addDays(endSunday, -(5 * 7 - 1));

  const weeks: string[][] = [];
  let iter = startMonday;
  while (iter <= endSunday) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(iter);
      iter = addDays(iter, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Stats() {
  const today = toLocalDateStr(new Date());
  const history = useMemo(() => loadHistory(), []);

  const { current: currentStreak, best: bestStreak } = useMemo(
    () => computeStreaks(history, today),
    [history, today]
  );
  const { done: weekDone, elapsed: weekElapsed } = useMemo(
    () => computeThisWeek(history, today),
    [history, today]
  );

  const sessionsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of history) {
      map[s.date] = (map[s.date] ?? 0) + 1;
    }
    return map;
  }, [history]);

  const calendarWeeks = useMemo(() => buildCalendarWeeks(today), [today]);

  const recentHistory = useMemo(
    () => [...history].reverse().slice(0, 20),
    [history]
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Progress</h1>
        <p className={styles.subtitle}>Your exercise history at a glance</p>
      </div>

      <div className={styles.content}>
        {/* Summary cards */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Current streak</p>
            <p className={styles.statValue}>{currentStreak}</p>
            <p className={styles.statUnit}>days</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Best streak</p>
            <p className={styles.statValue}>{bestStreak}</p>
            <p className={styles.statUnit}>days</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Total sessions</p>
            <p className={styles.statValue}>{history.length}</p>
            <p className={styles.statUnit}>all time</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>This week</p>
            <p className={styles.statValue}>{weekDone}/{weekElapsed}</p>
            <p className={styles.statUnit}>days</p>
          </div>
        </div>

        {/* Calendar heatmap */}
        <div className={styles.calendarCard}>
          <p className={styles.sectionTitle}>Last 30 days</p>
          <div className={styles.dayLabels}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i} className={styles.dayLabel}>{d}</span>
            ))}
          </div>
          <div className={styles.calendarGrid}>
            {calendarWeeks.map((week, wi) => (
              <div key={wi} className={styles.calendarRow}>
                {week.map((date) => {
                  const count = sessionsByDate[date] ?? 0;
                  const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;
                  const isToday = date === today;
                  const isFuture = date > today;
                  return (
                    <div
                      key={date}
                      title={`${formatDisplayDate(date)}${count > 0 ? `: ${count} session${count > 1 ? 's' : ''}` : ''}`}
                      className={[
                        styles.dot,
                        level === 1 ? styles.dotLevel1 : '',
                        level === 2 ? styles.dotLevel2 : '',
                        level >= 3 ? styles.dotLevel3 : '',
                        isFuture ? styles.dotFuture : '',
                        isToday ? styles.dotToday : '',
                      ].filter(Boolean).join(' ')}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Recent history */}
        <div>
          <p className={styles.sectionTitle}>Recent sessions</p>
          {recentHistory.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No sessions yet. Complete an exercise cycle to get started!</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {recentHistory.map((s, i) => (
                <div key={i} className={styles.historyCard}>
                  <div className={styles.historyLeft}>
                    <p className={styles.historyDate}>{formatDisplayDate(s.date)}</p>
                    <p className={styles.historyTime}>{s.time}</p>
                  </div>
                  <div className={styles.historyRight}>
                    <span className={styles.badge}>{fmtDuration(s.secs)}</span>
                    <span className={styles.badge}>{s.exerciseCount} exercises</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

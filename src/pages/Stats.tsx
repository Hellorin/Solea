import { useMemo } from 'react';
import { loadHistory } from '../utils/history';
import {
  fmtDuration,
  toLocalDateStr,
  computeStreaks,
  computeThisWeek,
  buildCalendarWeeks,
  formatDisplayDate,
} from '../utils/statsUtils';
import styles from './Stats.module.css';

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

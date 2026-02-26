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
import { loadPainLog } from '../utils/painLog';
import type { PainEntry } from '../utils/painLog';
import styles from './Stats.module.css';

interface PainChartProps {
  entries: PainEntry[];
  today: string;
}

function PainChart({ entries, today }: PainChartProps) {
  const W = 300;
  const H = 80;
  const PAD = { left: 4, right: 4, top: 8, bottom: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Show last 30 days
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 29);
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;

  const visible = entries
    .filter((e) => e.date >= cutoffStr && e.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (visible.length < 2) return null;

  const dates = visible.map((e) => e.date);
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  const minTime = new Date(minDate).getTime();
  const maxTime = new Date(maxDate).getTime();
  const timeRange = maxTime - minTime || 1;

  function svgX(date: string) {
    return PAD.left + ((new Date(date).getTime() - minTime) / timeRange) * chartW;
  }
  function svgY(level: number) {
    return PAD.top + ((level - 1) / 4) * chartH;
  }

  const points = visible.map((e) => `${svgX(e.date)},${svgY(e.level)}`).join(' ');
  const guideY = svgY(3);

  const Y_AXIS = [
    { level: 1, emoji: '😌' },
    { level: 2, emoji: '😐' },
    { level: 3, emoji: '😬' },
    { level: 4, emoji: '😣' },
    { level: 5, emoji: '😭' },
  ];

  return (
    <div className={styles.painChartContainer}>
      <div className={styles.painYAxis}>
        {Y_AXIS.map(({ level, emoji }) => (
          <span
            key={level}
            className={styles.painYLabel}
            style={{ top: `${(svgY(level) / H) * 100}%` }}
          >
            {emoji}
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        width="100%"
        height={H}
        style={{ display: 'block', flex: 1 }}
        aria-label="Pain trend chart"
      >
        {/* Dashed guideline at level 3 */}
        <line
          x1={PAD.left} y1={guideY} x2={W - PAD.right} y2={guideY}
          stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3"
        />
        {/* Pain line */}
        <polyline
          points={points}
          fill="none"
          className={styles.painLine}
        />
        {/* Dots */}
        {visible.map((e) => (
          <circle
            key={e.date}
            cx={svgX(e.date)}
            cy={svgY(e.level)}
            r="3.5"
            className={styles.painDot}
          />
        ))}
      </svg>
    </div>
  );
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
  const painLog = useMemo(() => loadPainLog(), []);

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

        {/* Pain trend chart */}
        {painLog.length >= 2 && (
          <div className={styles.painCard}>
            <p className={styles.sectionTitle}>Pain trend</p>
            <PainChart entries={painLog} today={today} />
          </div>
        )}

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

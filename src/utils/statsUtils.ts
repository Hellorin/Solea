import type { Session } from './history';

export function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toLocalDateStr(d);
}

export function computeStreaks(history: Session[], today: string): { current: number; best: number } {
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

export function computeThisWeek(history: Session[], today: string): { done: number; elapsed: number } {
  const d = new Date(today + 'T00:00:00');
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

export function buildCalendarWeeks(today: string): string[][] {
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

export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

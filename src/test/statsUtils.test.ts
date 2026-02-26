import { describe, it, expect } from 'vitest';
import {
  fmtDuration,
  toLocalDateStr,
  addDays,
  computeStreaks,
  computeThisWeek,
  buildCalendarWeeks,
} from '../utils/statsUtils';
import type { Session } from '../utils/history';

describe('fmtDuration', () => {
  it('formats 0 seconds', () => expect(fmtDuration(0)).toBe('0s'));
  it('formats 45 seconds', () => expect(fmtDuration(45)).toBe('45s'));
  it('formats 90 seconds', () => expect(fmtDuration(90)).toBe('1m 30s'));
  it('formats 3600 seconds', () => expect(fmtDuration(3600)).toBe('60m 0s'));
});

describe('toLocalDateStr', () => {
  it('formats a known date as YYYY-MM-DD', () => {
    expect(toLocalDateStr(new Date(2024, 0, 5))).toBe('2024-01-05');
  });
  it('pads month and day with zeros', () => {
    expect(toLocalDateStr(new Date(2024, 11, 31))).toBe('2024-12-31');
  });
});

describe('addDays', () => {
  it('adds 1 day', () => expect(addDays('2024-01-01', 1)).toBe('2024-01-02'));
  it('subtracts 1 day', () => expect(addDays('2024-01-02', -1)).toBe('2024-01-01'));
  it('crosses month boundary', () => expect(addDays('2024-01-31', 1)).toBe('2024-02-01'));
  it('handles leap year', () => expect(addDays('2024-02-28', 1)).toBe('2024-02-29'));
});

function makeSession(date: string): Session {
  return { date, secs: 60, exerciseCount: 3, time: '08:00' };
}

describe('computeStreaks', () => {
  it('returns 0/0 for empty history', () => {
    expect(computeStreaks([], '2024-01-10')).toEqual({ current: 0, best: 0 });
  });

  it('returns 1/1 for a single session today', () => {
    const history = [makeSession('2024-01-10')];
    expect(computeStreaks(history, '2024-01-10')).toEqual({ current: 1, best: 1 });
  });

  it('counts a 3-day streak', () => {
    const history = ['2024-01-08', '2024-01-09', '2024-01-10'].map(makeSession);
    expect(computeStreaks(history, '2024-01-10')).toEqual({ current: 3, best: 3 });
  });

  it('stops current streak on a gap but tracks best', () => {
    // sessions on Jan 8 and Jan 10, gap on Jan 9
    const history = ['2024-01-08', '2024-01-10'].map(makeSession);
    const result = computeStreaks(history, '2024-01-10');
    expect(result.current).toBe(1);
    expect(result.best).toBe(1);
  });

  it('tracks best streak across a break', () => {
    // 3-day streak, then gap, then 1 day
    const history = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-10'].map(makeSession);
    const result = computeStreaks(history, '2024-01-10');
    expect(result.current).toBe(1);
    expect(result.best).toBe(3);
  });
});

describe('computeThisWeek', () => {
  it('returns 0/1 for Monday with no sessions', () => {
    // 2024-01-08 is a Monday
    const result = computeThisWeek([], '2024-01-08');
    expect(result.done).toBe(0);
    expect(result.elapsed).toBe(1);
  });

  it('counts sessions this week only', () => {
    // 2024-01-10 is a Wednesday (Mon=Jan8, Tue=9, Wed=10 → elapsed=3)
    const history = ['2024-01-08', '2024-01-09'].map(makeSession);
    const result = computeThisWeek(history, '2024-01-10');
    expect(result.done).toBe(2);
    expect(result.elapsed).toBe(3);
  });

  it('excludes sessions from last week', () => {
    // 2024-01-10 Wednesday, previous week session on Jan 5
    const history = [makeSession('2024-01-05')];
    const result = computeThisWeek(history, '2024-01-10');
    expect(result.done).toBe(0);
    expect(result.elapsed).toBe(3);
  });
});

describe('buildCalendarWeeks', () => {
  it('returns exactly 5 weeks', () => {
    const weeks = buildCalendarWeeks('2024-01-10');
    expect(weeks).toHaveLength(5);
  });

  it('each week has 7 days', () => {
    const weeks = buildCalendarWeeks('2024-01-10');
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it('last cell is on or after today', () => {
    const today = '2024-01-10';
    const weeks = buildCalendarWeeks(today);
    const lastCell = weeks[weeks.length - 1][6];
    expect(lastCell >= today).toBe(true);
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Stats from '../pages/Stats';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

beforeEach(() => {
  localStorageMock.clear();
  vi.setSystemTime(new Date('2024-06-15T08:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Stats', () => {
  it('shows an empty state when there is no session history', () => {
    render(<Stats />);
    expect(screen.getByText(/No sessions yet/)).toBeTruthy();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('renders streaks and totals computed from history', () => {
    localStorageMock.setItem('plantar_history', JSON.stringify([
      { date: '2024-06-14', secs: 120, exerciseCount: 3, time: '08:00' },
      { date: '2024-06-15', secs: 90, exerciseCount: 4, time: '09:00' },
    ]));
    render(<Stats />);
    // Current streak, best streak, and total sessions are all 2 here
    expect(screen.getAllByText('2')).toHaveLength(3);
    expect(screen.getByText('Total sessions')).toBeTruthy();
  });

  it('lists recent sessions with duration and exercise count', () => {
    localStorageMock.setItem('plantar_history', JSON.stringify([
      { date: '2024-06-15', secs: 90, exerciseCount: 4, time: '09:00', exerciseNames: ['Calf Stretch'] },
    ]));
    render(<Stats />);
    expect(screen.getByText('1m 30s')).toBeTruthy();
    expect(screen.getByText('4 exercises')).toBeTruthy();
    expect(screen.getByText('Calf Stretch')).toBeTruthy();
  });

  it('does not render a pain trend chart with fewer than 2 pain entries', () => {
    localStorageMock.setItem('pain_log', JSON.stringify([{ date: '2024-06-15', level: 2 }]));
    render(<Stats />);
    expect(screen.queryByText('Pain trend')).toBeNull();
  });

  it('renders a pain trend chart with 2+ pain entries', () => {
    localStorageMock.setItem('pain_log', JSON.stringify([
      { date: '2024-06-13', level: 2 },
      { date: '2024-06-14', level: 3 },
    ]));
    render(<Stats />);
    expect(screen.getByText('Pain trend')).toBeTruthy();
    expect(screen.getByLabelText('Pain trend chart')).toBeTruthy();
  });

  it('renders the last-30-days calendar heatmap', () => {
    render(<Stats />);
    expect(screen.getByText('Last 30 days')).toBeTruthy();
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.getAllByText('S')).toHaveLength(2);
  });
});

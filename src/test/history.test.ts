import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadHistory, saveSession } from '../utils/history';

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

beforeEach(() => localStorageMock.clear());

describe('loadHistory', () => {
  it('returns empty array when key is missing', () => {
    expect(loadHistory()).toEqual([]);
  });

  it('returns parsed sessions from valid JSON', () => {
    const sessions = [{ date: '2024-01-10', secs: 120, exerciseCount: 4, time: '08:30' }];
    localStorageMock.setItem('plantar_history', JSON.stringify(sessions));
    expect(loadHistory()).toEqual(sessions);
  });

  it('returns empty array on malformed JSON', () => {
    localStorageMock.setItem('plantar_history', '{{invalid');
    expect(loadHistory()).toEqual([]);
  });
});

describe('saveSession', () => {
  it('creates a session with correct shape and saves it', () => {
    const now = new Date('2024-06-15T09:30:00');
    vi.setSystemTime(now);

    saveSession(180, 5);

    const saved = loadHistory();
    expect(saved).toHaveLength(1);
    expect(saved[0].date).toBe('2024-06-15');
    expect(saved[0].secs).toBe(180);
    expect(saved[0].exerciseCount).toBe(5);
    expect(saved[0].time).toMatch(/^\d{2}:\d{2}$/);

    vi.useRealTimers();
  });

  it('appends to existing history', () => {
    const existing = [{ date: '2024-01-01', secs: 60, exerciseCount: 3, time: '08:00' }];
    localStorageMock.setItem('plantar_history', JSON.stringify(existing));

    const now = new Date('2024-06-15T10:00:00');
    vi.setSystemTime(now);

    saveSession(90, 4);

    const saved = loadHistory();
    expect(saved).toHaveLength(2);
    expect(saved[0].date).toBe('2024-01-01');
    expect(saved[1].secs).toBe(90);

    vi.useRealTimers();
  });

  it('does not throw when localStorage throws', () => {
    const spy = vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => saveSession(60, 3)).not.toThrow();
    spy.mockRestore();
  });
});

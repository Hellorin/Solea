import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadPainLog, getTodayPain, savePainEntry } from '../utils/painLog';

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

describe('loadPainLog', () => {
  it('returns empty array when localStorage is empty', () => {
    expect(loadPainLog()).toEqual([]);
  });

  it('returns parsed entries from valid JSON', () => {
    const entries = [{ date: '2025-01-10', level: 2 }];
    localStorageMock.setItem('pain_log', JSON.stringify(entries));
    expect(loadPainLog()).toEqual(entries);
  });

  it('returns empty array on malformed JSON', () => {
    localStorageMock.setItem('pain_log', '{{invalid');
    expect(loadPainLog()).toEqual([]);
  });
});

describe('getTodayPain', () => {
  it('returns null when no entry for today', () => {
    expect(getTodayPain('2025-01-10')).toBeNull();
  });

  it('returns the level when an entry exists for today', () => {
    localStorageMock.setItem('pain_log', JSON.stringify([{ date: '2025-01-10', level: 3 }]));
    expect(getTodayPain('2025-01-10')).toBe(3);
  });

  it('returns null when entry exists for a different date', () => {
    localStorageMock.setItem('pain_log', JSON.stringify([{ date: '2025-01-09', level: 3 }]));
    expect(getTodayPain('2025-01-10')).toBeNull();
  });
});

describe('savePainEntry', () => {
  it('stores a new entry', () => {
    savePainEntry('2025-01-10', 2);
    expect(loadPainLog()).toEqual([{ date: '2025-01-10', level: 2 }]);
  });

  it('upserts (replaces) existing entry for same date', () => {
    savePainEntry('2025-01-10', 2);
    savePainEntry('2025-01-10', 4);
    const log = loadPainLog();
    expect(log).toHaveLength(1);
    expect(log[0].level).toBe(4);
  });

  it('stores multiple dates independently', () => {
    savePainEntry('2025-01-09', 1);
    savePainEntry('2025-01-10', 5);
    const log = loadPainLog();
    expect(log).toHaveLength(2);
    expect(log.find((e) => e.date === '2025-01-09')?.level).toBe(1);
    expect(log.find((e) => e.date === '2025-01-10')?.level).toBe(5);
  });

  it('does not throw when localStorage throws', () => {
    const spy = vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => savePainEntry('2025-01-10', 3)).not.toThrow();
    spy.mockRestore();
  });
});

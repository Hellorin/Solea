import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTimes, saveTimes } from '../utils/storage';

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

describe('loadTimes', () => {
  it('returns empty array when key is missing', () => {
    expect(loadTimes()).toEqual([]);
  });

  it('returns parsed array from valid JSON', () => {
    localStorageMock.setItem('reminder_times', JSON.stringify(['08:00', '18:00']));
    expect(loadTimes()).toEqual(['08:00', '18:00']);
  });

  it('returns empty array on malformed JSON', () => {
    localStorageMock.setItem('reminder_times', 'not-json{{{');
    expect(loadTimes()).toEqual([]);
  });
});

describe('saveTimes', () => {
  it('writes times as JSON to localStorage', () => {
    saveTimes(['07:30', '19:00']);
    expect(localStorageMock.getItem('reminder_times')).toBe('["07:30","19:00"]');
  });

  it('overwrites previous value', () => {
    saveTimes(['08:00']);
    saveTimes(['09:00']);
    expect(localStorageMock.getItem('reminder_times')).toBe('["09:00"]');
  });

  it('does not throw when localStorage throws (quota exceeded)', () => {
    const spy = vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => saveTimes(['08:00'])).not.toThrow();
    spy.mockRestore();
  });
});

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
  it('returns empty array when key is missing', async () => {
    expect(await loadTimes()).toEqual([]);
  });

  it('returns parsed array from valid JSON', async () => {
    localStorageMock.setItem('reminder_times', JSON.stringify(['08:00', '18:00']));
    expect(await loadTimes()).toEqual(['08:00', '18:00']);
  });

  it('returns empty array on malformed JSON', async () => {
    localStorageMock.setItem('reminder_times', 'not-json{{{');
    expect(await loadTimes()).toEqual([]);
  });
});

describe('saveTimes', () => {
  it('writes times as JSON to localStorage', async () => {
    await saveTimes(['07:30', '19:00']);
    expect(localStorageMock.getItem('reminder_times')).toBe('["07:30","19:00"]');
  });

  it('overwrites previous value', async () => {
    await saveTimes(['08:00']);
    await saveTimes(['09:00']);
    expect(localStorageMock.getItem('reminder_times')).toBe('["09:00"]');
  });

  it('does not throw when localStorage throws (quota exceeded)', async () => {
    const spy = vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    await expect(saveTimes(['08:00'])).resolves.not.toThrow();
    spy.mockRestore();
  });
});

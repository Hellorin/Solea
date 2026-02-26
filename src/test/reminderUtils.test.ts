import { describe, it, expect } from 'vitest';
import { getGreeting, getNextReminder } from '../utils/reminderUtils';

describe('getGreeting', () => {
  it('returns Good morning for hour 6', () => {
    expect(getGreeting(6)).toBe('Good morning');
  });
  it('returns Good morning for hour 0', () => {
    expect(getGreeting(0)).toBe('Good morning');
  });
  it('returns Good morning for hour 11', () => {
    expect(getGreeting(11)).toBe('Good morning');
  });
  it('returns Good afternoon for hour 12', () => {
    expect(getGreeting(12)).toBe('Good afternoon');
  });
  it('returns Good afternoon for hour 13', () => {
    expect(getGreeting(13)).toBe('Good afternoon');
  });
  it('returns Good afternoon for hour 16', () => {
    expect(getGreeting(16)).toBe('Good afternoon');
  });
  it('returns Good evening for hour 17', () => {
    expect(getGreeting(17)).toBe('Good evening');
  });
  it('returns Good evening for hour 20', () => {
    expect(getGreeting(20)).toBe('Good evening');
  });
  it('returns Good evening for hour 23', () => {
    expect(getGreeting(23)).toBe('Good evening');
  });
});

describe('getNextReminder', () => {
  it('returns null for empty array', () => {
    expect(getNextReminder([], new Date('2024-01-10T10:00:00'))).toBeNull();
  });

  it('returns the next upcoming reminder', () => {
    const now = new Date('2024-01-10T10:00:00');
    expect(getNextReminder(['08:00', '12:00', '18:00'], now)).toBe('12:00');
  });

  it('wraps to first reminder of next day when all times have passed', () => {
    const now = new Date('2024-01-10T20:00:00');
    expect(getNextReminder(['08:00', '12:00', '18:00'], now)).toBe('08:00');
  });

  it('returns the single reminder if it is upcoming', () => {
    const now = new Date('2024-01-10T07:00:00');
    expect(getNextReminder(['08:00'], now)).toBe('08:00');
  });

  it('wraps single reminder when it has passed', () => {
    const now = new Date('2024-01-10T09:00:00');
    expect(getNextReminder(['08:00'], now)).toBe('08:00');
  });
});

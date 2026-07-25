import { describe, it, expect } from 'vitest';
import { getGreeting } from '../utils/reminderUtils';

describe('getGreeting', () => {
  it('returns morning greeting before noon', () => {
    expect(getGreeting(0)).toBe('Good morning');
    expect(getGreeting(11)).toBe('Good morning');
  });

  it('returns afternoon greeting from noon to before 5pm', () => {
    expect(getGreeting(12)).toBe('Good afternoon');
    expect(getGreeting(16)).toBe('Good afternoon');
  });

  it('returns evening greeting from 5pm onward', () => {
    expect(getGreeting(17)).toBe('Good evening');
    expect(getGreeting(23)).toBe('Good evening');
  });
});

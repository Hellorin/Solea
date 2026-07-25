import { describe, it, expect } from 'vitest';
import { PAIN_EMOJIS } from '../data/pain';

describe('PAIN_EMOJIS', () => {
  it('has 5 entries with levels 1 through 5 in order', () => {
    expect(PAIN_EMOJIS).toHaveLength(5);
    expect(PAIN_EMOJIS.map(p => p.level)).toEqual([1, 2, 3, 4, 5]);
  });

  it('each entry has a non-empty emoji and label', () => {
    for (const entry of PAIN_EMOJIS) {
      expect(entry.emoji.length).toBeGreaterThan(0);
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it('is indexable by level - 1 (as used by pages)', () => {
    expect(PAIN_EMOJIS[3 - 1].label).toBe('Moderate pain');
  });
});

import { describe, it, expect } from 'vitest';
import { recommendCycle } from '../utils/recommendations';

// Helper to build a minimal input with sensible defaults
function input(overrides: Partial<Parameters<typeof recommendCycle>[0]> = {}) {
  return { painLevel: null, streak: 3, weeklyCount: 2, hour: 14, ...overrides };
}

describe('recommendCycle — pain-based (highest priority)', () => {
  it('recommends morning for pain level 4', () => {
    const r = recommendCycle(input({ painLevel: 4 }));
    expect(r.presetId).toBe('morning');
  });

  it('recommends morning for pain level 5', () => {
    const r = recommendCycle(input({ painLevel: 5 }));
    expect(r.presetId).toBe('morning');
  });

  it('recommends evening for pain level 3', () => {
    const r = recommendCycle(input({ painLevel: 3 }));
    expect(r.presetId).toBe('evening');
  });

  it('recommends anytime/rehab for pain level 2', () => {
    const r = recommendCycle(input({ painLevel: 2 }));
    expect(r.presetId).toBe('anytime');
  });

  it('recommends anytime/rehab for pain level 1', () => {
    const r = recommendCycle(input({ painLevel: 1 }));
    expect(r.presetId).toBe('anytime');
  });

  it('pain overrides time-of-day (morning pain at midday → morning)', () => {
    const r = recommendCycle(input({ painLevel: 4, hour: 13 }));
    expect(r.presetId).toBe('morning');
  });

  it('pain overrides time-of-day (low pain in morning → rehab)', () => {
    const r = recommendCycle(input({ painLevel: 1, hour: 7 }));
    expect(r.presetId).toBe('anytime');
  });

  it('returns a non-empty reason string for each pain level', () => {
    for (const painLevel of [1, 2, 3, 4, 5]) {
      const r = recommendCycle(input({ painLevel }));
      expect(r.reason.length).toBeGreaterThan(0);
      expect(r.reasonEmoji.length).toBeGreaterThan(0);
    }
  });
});

describe('recommendCycle — engagement fallback (no pain logged)', () => {
  it('recommends morning when streak=0 and weeklyCount=0', () => {
    const r = recommendCycle(input({ painLevel: null, streak: 0, weeklyCount: 0, hour: 14 }));
    expect(r.presetId).toBe('morning');
  });

  it('does NOT apply "getting back" logic when weeklyCount > 0', () => {
    // streak 0 but has done sessions this week → falls through to time-based
    const r = recommendCycle(input({ painLevel: null, streak: 0, weeklyCount: 1, hour: 14 }));
    expect(r.presetId).toBe('anytime'); // midday fallback
  });
});

describe('recommendCycle — time-of-day fallback', () => {
  it('recommends morning at 5am', () => {
    const r = recommendCycle(input({ painLevel: null, hour: 5 }));
    expect(r.presetId).toBe('morning');
  });

  it('recommends morning at 9am', () => {
    const r = recommendCycle(input({ painLevel: null, hour: 9 }));
    expect(r.presetId).toBe('morning');
  });

  it('recommends anytime at 10am', () => {
    const r = recommendCycle(input({ painLevel: null, hour: 10 }));
    expect(r.presetId).toBe('anytime');
  });

  it('recommends anytime at 12pm', () => {
    const r = recommendCycle(input({ painLevel: null, hour: 12 }));
    expect(r.presetId).toBe('anytime');
  });

  it('recommends anytime at 17:59', () => {
    const r = recommendCycle(input({ painLevel: null, hour: 17 }));
    expect(r.presetId).toBe('anytime');
  });

  it('recommends evening at 18:00', () => {
    const r = recommendCycle(input({ painLevel: null, hour: 18 }));
    expect(r.presetId).toBe('evening');
  });

  it('recommends evening at midnight', () => {
    const r = recommendCycle(input({ painLevel: null, hour: 0 }));
    expect(r.presetId).toBe('evening');
  });

  it('recommends evening at 4am', () => {
    const r = recommendCycle(input({ painLevel: null, hour: 4 }));
    expect(r.presetId).toBe('evening');
  });

  it('always returns a reason and reasonEmoji', () => {
    for (const hour of [0, 5, 10, 18, 23]) {
      const r = recommendCycle(input({ painLevel: null, hour }));
      expect(r.reason.length).toBeGreaterThan(0);
      expect(r.reasonEmoji.length).toBeGreaterThan(0);
    }
  });
});

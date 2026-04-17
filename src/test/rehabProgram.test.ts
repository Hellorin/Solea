import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createProgram,
  computeNextDay,
  pickExercises,
  loadProgram,
  saveProgram,
  clearProgram,
  hasActiveProgram,
  checkMissedDays,
  consecutiveBetterCount,
  PROGRAM_DAYS,
  type RehabProgram,
  type Feedback,
} from '../utils/rehabProgram';
import { PHASE_POOLS } from '../data/cycles';
import { exercises } from '../data/exercises';

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

const exerciseIdSet = new Set(exercises.map(e => e.id));

function stepThrough(
  program: RehabProgram,
  steps: { feedback: Feedback; pain: number; date: string }[],
): RehabProgram {
  let p = program;
  for (const s of steps) {
    p = computeNextDay(p, s.feedback, s.pain, s.date);
  }
  return p;
}

describe('createProgram', () => {
  it('creates a 30-day program with day 1 prescribed', () => {
    const p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    expect(p.days).toHaveLength(PROGRAM_DAYS);
    expect(p.currentDay).toBe(1);
    expect(p.active).toBe(true);
    expect(p.paused).toBe(false);
    expect(p.days[0].exerciseIds.length).toBe(6);
    expect(p.days[0].painBefore).toBe(3);
  });

  it('starts in relief when duration is acute', () => {
    const p = createProgram({ initialPain: 2, duration: 'acute' }, '2026-04-17');
    expect(p.days[0].phase).toBe('relief');
  });

  it('starts in relief when pain is high regardless of duration', () => {
    const p = createProgram({ initialPain: 5, duration: 'chronic' }, '2026-04-17');
    expect(p.days[0].phase).toBe('relief');
  });

  it('starts in loading when chronic + low pain', () => {
    const p = createProgram({ initialPain: 2, duration: 'chronic' }, '2026-04-17');
    expect(p.days[0].phase).toBe('loading');
  });

  it('defaults to relief for moderate cases', () => {
    const p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    expect(p.days[0].phase).toBe('relief');
  });

  it('all prescribed exercise IDs exist in the exercise library', () => {
    const p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    for (const id of p.days[0].exerciseIds) {
      expect(exerciseIdSet.has(id)).toBe(true);
    }
  });
});

describe('pickExercises', () => {
  it('returns 6 IDs normally', () => {
    expect(pickExercises('relief', [], false).length).toBe(6);
  });

  it('returns 4 IDs in lite mode', () => {
    expect(pickExercises('relief', [], true).length).toBe(4);
  });

  it('all returned IDs exist in the library', () => {
    for (const phase of ['relief', 'loading', 'strengthening'] as const) {
      const ids = pickExercises(phase, [], false);
      for (const id of ids) expect(exerciseIdSet.has(id)).toBe(true);
    }
  });

  it('all returned IDs belong to the phase pool', () => {
    for (const phase of ['relief', 'loading', 'strengthening'] as const) {
      const pool = new Set(PHASE_POOLS[phase]);
      for (const id of pickExercises(phase, [], false)) {
        expect(pool.has(id)).toBe(true);
      }
    }
  });

  it('biases away from avoid list when pool is large enough', () => {
    // Relief pool has 9 exercises. Avoid 3 of them, pick 6 — result should
    // contain the remaining 6, none from the avoid list.
    const avoid = ['toe-extension', 'towel-stretch', 'calf-straight'];
    const picked = pickExercises('relief', avoid, false);
    for (const id of picked) expect(avoid).not.toContain(id);
  });

  it('rotates selection with different offsets', () => {
    const a = pickExercises('relief', [], false, 0);
    const b = pickExercises('relief', [], false, 3);
    expect(a).not.toEqual(b);
  });
});

describe('computeNextDay — advance', () => {
  it('advances relief → loading after three better days', () => {
    let p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    p = stepThrough(p, [
      { feedback: 'better', pain: 2, date: '2026-04-17' },
      { feedback: 'better', pain: 2, date: '2026-04-18' },
      { feedback: 'better', pain: 1, date: '2026-04-19' },
    ]);
    expect(p.days[3].phase).toBe('loading');
    expect(p.lastAdaptationReason).toContain('loading');
  });

  it('advances loading → strengthening after three better in loading', () => {
    let p = createProgram({ initialPain: 2, duration: 'chronic' }, '2026-04-17'); // starts loading
    p = stepThrough(p, [
      { feedback: 'better', pain: 1, date: '2026-04-17' },
      { feedback: 'better', pain: 1, date: '2026-04-18' },
      { feedback: 'better', pain: 1, date: '2026-04-19' },
    ]);
    expect(p.days[3].phase).toBe('strengthening');
  });

  it('does not advance with only two better days', () => {
    let p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    p = stepThrough(p, [
      { feedback: 'better', pain: 2, date: '2026-04-17' },
      { feedback: 'better', pain: 2, date: '2026-04-18' },
      { feedback: 'same', pain: 2, date: '2026-04-19' },
    ]);
    expect(p.days[3].phase).toBe('relief');
  });

  it('strengthening stays strengthening on three better', () => {
    let p = createProgram({ initialPain: 2, duration: 'chronic' }, '2026-04-17');
    p = stepThrough(p, [
      { feedback: 'better', pain: 1, date: '2026-04-17' },
      { feedback: 'better', pain: 1, date: '2026-04-18' },
      { feedback: 'better', pain: 1, date: '2026-04-19' },
      { feedback: 'better', pain: 1, date: '2026-04-20' },
      { feedback: 'better', pain: 1, date: '2026-04-21' },
      { feedback: 'better', pain: 1, date: '2026-04-22' },
    ]);
    // currentDay is now 7, day 7 should still be strengthening
    expect(p.days[p.currentDay - 1].phase).toBe('strengthening');
  });
});

describe('computeNextDay — regress', () => {
  it('marks next day lite when feedback is worse', () => {
    let p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    p = computeNextDay(p, 'worse', 3, '2026-04-17');
    expect(p.days[1].lite).toBe(true);
    expect(p.days[1].exerciseIds.length).toBe(4);
    expect(p.lastAdaptationReason).toContain('light');
  });

  it('marks next day lite when pain jumps by 2', () => {
    let p = createProgram({ initialPain: 1, duration: 'chronic' }, '2026-04-17'); // loading
    p = computeNextDay(p, 'same', 3, '2026-04-17');
    expect(p.days[1].lite).toBe(true);
    // Phase stays the same when not severe
    expect(p.days[1].phase).toBe('loading');
  });

  it('floors phase to relief when pain is severe (>=4)', () => {
    let p = createProgram({ initialPain: 1, duration: 'chronic' }, '2026-04-17'); // loading
    p = computeNextDay(p, 'worse', 5, '2026-04-17');
    expect(p.days[1].phase).toBe('relief');
    expect(p.days[1].lite).toBe(true);
    expect(p.lastAdaptationReason).toMatch(/high|relief|easing/i);
  });

  it('stays same phase on same feedback with flat pain', () => {
    let p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    p = computeNextDay(p, 'same', 3, '2026-04-17');
    expect(p.days[1].phase).toBe('relief');
    expect(p.days[1].lite).toBe(false);
  });
});

describe('computeNextDay — edges', () => {
  it('stores feedback, pain, and date on the completed day', () => {
    let p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    p = computeNextDay(p, 'better', 2, '2026-04-17');
    expect(p.days[0].completed).toBe(true);
    expect(p.days[0].feedback).toBe('better');
    expect(p.days[0].painAfter).toBe(2);
    expect(p.days[0].date).toBe('2026-04-17');
  });

  it('sets active=false when day 30 is completed', () => {
    let p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    // Jump currentDay to 30 by mutating (we're testing the branch, not real flow).
    p = { ...p, currentDay: 30 };
    p = computeNextDay(p, 'better', 1, '2026-05-16');
    expect(p.active).toBe(false);
    expect(p.currentDay).toBe(30);
  });

  it('sets painBefore on the next day equal to the submitted painAfter', () => {
    let p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    p = computeNextDay(p, 'better', 2, '2026-04-17');
    expect(p.days[1].painBefore).toBe(2);
  });
});

describe('localStorage CRUD', () => {
  it('round-trips save/load', () => {
    const p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    saveProgram(p);
    const loaded = loadProgram();
    expect(loaded).toEqual(p);
  });

  it('loadProgram returns null when nothing saved', () => {
    expect(loadProgram()).toBeNull();
  });

  it('loadProgram returns null on malformed JSON', () => {
    localStorageMock.setItem('rehab_program', '{{not json');
    expect(loadProgram()).toBeNull();
  });

  it('hasActiveProgram reflects active flag', () => {
    expect(hasActiveProgram()).toBe(false);
    const p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    saveProgram(p);
    expect(hasActiveProgram()).toBe(true);
    saveProgram({ ...p, active: false });
    expect(hasActiveProgram()).toBe(false);
  });

  it('clearProgram removes the key', () => {
    saveProgram(createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17'));
    clearProgram();
    expect(loadProgram()).toBeNull();
  });

  it('does not throw when localStorage throws', () => {
    const spy = vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    const p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    expect(() => saveProgram(p)).not.toThrow();
    spy.mockRestore();
  });
});

describe('checkMissedDays', () => {
  it('reports 0 missed when user starts today', () => {
    const p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    const { missed, shouldPause } = checkMissedDays(p, '2026-04-17');
    expect(missed).toBe(0);
    expect(shouldPause).toBe(false);
  });

  it('reports 0 missed when user returns the day after starting (still on track)', () => {
    const p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    const { missed } = checkMissedDays(p, '2026-04-18');
    expect(missed).toBe(0);
  });

  it('reports 1 missed as grace when 2 days pass with no activity', () => {
    const p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    const { missed, shouldPause } = checkMissedDays(p, '2026-04-19');
    expect(missed).toBe(1);
    expect(shouldPause).toBe(false);
  });

  it('flags pause when 2+ days missed in a row', () => {
    const p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    const { missed, shouldPause } = checkMissedDays(p, '2026-04-20');
    expect(missed).toBe(2);
    expect(shouldPause).toBe(true);
  });

  it('uses last completed date as anchor', () => {
    let p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    p = computeNextDay(p, 'better', 2, '2026-04-17');
    // After completing day 1 on 04-17, checking on 04-19 should be 1 missed (grace).
    const { missed } = checkMissedDays(p, '2026-04-19');
    expect(missed).toBe(1);
  });
});

describe('consecutiveBetterCount', () => {
  it('counts trailing better check-ins', () => {
    let p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    p = stepThrough(p, [
      { feedback: 'same', pain: 3, date: '2026-04-17' },
      { feedback: 'better', pain: 2, date: '2026-04-18' },
      { feedback: 'better', pain: 2, date: '2026-04-19' },
    ]);
    // currentDay is now 4 (uncompleted). Trailing completed: day3 better, day2 better, day1 same.
    expect(consecutiveBetterCount(p)).toBe(2);
  });

  it('returns 0 when last completed day was not better', () => {
    let p = createProgram({ initialPain: 3, duration: 'subacute' }, '2026-04-17');
    p = computeNextDay(p, 'worse', 4, '2026-04-17');
    expect(consecutiveBetterCount(p)).toBe(0);
  });
});

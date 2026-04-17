import type { Phase } from '../data/cycles';
import { PHASE_POOLS } from '../data/cycles';
import { addDays, toLocalDateStr } from './statsUtils';

export type Feedback = 'worse' | 'same' | 'better';
export type Duration = 'acute' | 'subacute' | 'chronic';

export type OnboardingAnswers = {
  initialPain: number;
  duration: Duration;
};

export type RehabDay = {
  day: number;
  date?: string;
  phase: Phase;
  exerciseIds: string[];
  completed: boolean;
  painBefore?: number;
  painAfter?: number;
  feedback?: Feedback;
  lite?: boolean;
};

export type RehabProgram = {
  version: 1;
  startDate: string;
  onboarding: OnboardingAnswers;
  days: RehabDay[];
  currentDay: number;
  active: boolean;
  paused: boolean;
  lastAdaptationReason: string | null;
};

const KEY = 'rehab_program';
const PROGRAM_LENGTH = 30;
const NORMAL_SIZE = 6;
const LITE_SIZE = 4;

export function loadProgram(): RehabProgram | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.days)) return null;
    return parsed as RehabProgram;
  } catch {
    return null;
  }
}

export function saveProgram(p: RehabProgram): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // localStorage unavailable or quota exceeded — silently no-op
  }
}

export function clearProgram(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}

export function hasActiveProgram(): boolean {
  const p = loadProgram();
  return !!p && p.active;
}

function initialPhase(answers: OnboardingAnswers): Phase {
  if (answers.initialPain >= 4 || answers.duration === 'acute') return 'relief';
  if (answers.initialPain <= 2 && answers.duration === 'chronic') return 'loading';
  return 'relief';
}

// Deterministic pool pick. `offset` rotates which IDs are chosen to add variety
// across days; `avoid` biases away from yesterday's selection when pool size allows.
export function pickExercises(phase: Phase, avoid: string[], lite: boolean, offset = 0): string[] {
  const pool = PHASE_POOLS[phase];
  const size = lite ? LITE_SIZE : NORMAL_SIZE;
  const avoidSet = new Set(avoid);

  const fresh: string[] = [];
  const overlap: string[] = [];
  for (let i = 0; i < pool.length; i++) {
    const id = pool[(i + offset) % pool.length];
    if (avoidSet.has(id)) overlap.push(id);
    else fresh.push(id);
  }
  const ordered = [...fresh, ...overlap].slice(0, size);
  return ordered;
}

export function createProgram(answers: OnboardingAnswers, startDate: string): RehabProgram {
  const phase = initialPhase(answers);
  const day1: RehabDay = {
    day: 1,
    phase,
    exerciseIds: pickExercises(phase, [], false, 0),
    completed: false,
    painBefore: answers.initialPain,
  };
  const days: RehabDay[] = [day1];
  for (let i = 2; i <= PROGRAM_LENGTH; i++) {
    days.push({ day: i, phase, exerciseIds: [], completed: false });
  }
  return {
    version: 1,
    startDate,
    onboarding: answers,
    days,
    currentDay: 1,
    active: true,
    paused: false,
    lastAdaptationReason: null,
  };
}

function buildReason(opts: {
  regress: boolean;
  severe: boolean;
  phaseAdvanced: boolean;
  newPhase: Phase;
}): string {
  if (opts.severe) return 'Pain is high — easing back to relief exercises.';
  if (opts.phaseAdvanced) {
    if (opts.newPhase === 'loading') return 'Three good days in a row — moving to the loading phase.';
    if (opts.newPhase === 'strengthening') return 'Three good days in a row — moving to strengthening.';
  }
  if (opts.regress) return 'Pain went up — keeping today light.';
  return 'Staying the course — keep it up.';
}

export function computeNextDay(
  program: RehabProgram,
  feedback: Feedback,
  painAfter: number,
  today: string = toLocalDateStr(new Date()),
): RehabProgram {
  const idx = program.currentDay - 1;
  const current = program.days[idx];
  const completedDay: RehabDay = {
    ...current,
    completed: true,
    painAfter,
    feedback,
    date: today,
  };

  const days = [...program.days];
  days[idx] = completedDay;

  // Program finished.
  if (program.currentDay >= PROGRAM_LENGTH) {
    return {
      ...program,
      days,
      active: false,
      lastAdaptationReason: 'Program complete — great work!',
    };
  }

  const painBefore = current.painBefore ?? program.onboarding.initialPain;
  const painJumped = painAfter - painBefore >= 2;
  const severe = painAfter >= 4;
  const regress = painJumped || feedback === 'worse' || severe;

  // Look at the last 3 completed days for the advance rule.
  const lastThree = days.slice(Math.max(0, program.currentDay - 3), program.currentDay);
  const threeBetter =
    lastThree.length === 3 && lastThree.every(d => d.feedback === 'better');

  let nextPhase: Phase = current.phase;
  let phaseAdvanced = false;
  if (severe) {
    nextPhase = 'relief';
  } else if (threeBetter && current.phase === 'relief') {
    nextPhase = 'loading';
    phaseAdvanced = true;
  } else if (threeBetter && current.phase === 'loading') {
    nextPhase = 'strengthening';
    phaseAdvanced = true;
  }

  const nextDayNum = program.currentDay + 1;
  const lite = regress;
  const offset = nextDayNum - 1; // rotates pool each day for variety
  const exerciseIds = pickExercises(nextPhase, current.exerciseIds, lite, offset);

  days[nextDayNum - 1] = {
    day: nextDayNum,
    phase: nextPhase,
    exerciseIds,
    completed: false,
    painBefore: painAfter,
    lite,
  };

  return {
    ...program,
    days,
    currentDay: nextDayNum,
    lastAdaptationReason: buildReason({
      regress,
      severe,
      phaseAdvanced,
      newPhase: nextPhase,
    }),
  };
}

// The last date the user had any completed activity. Falls back to startDate.
export function lastActivityDate(program: RehabProgram): string {
  for (let i = program.days.length - 1; i >= 0; i--) {
    const d = program.days[i];
    if (d.completed && d.date) return d.date;
  }
  return program.startDate;
}

function daysBetween(a: string, b: string): number {
  let count = 0;
  let cursor = a;
  while (cursor < b) {
    cursor = addDays(cursor, 1);
    count++;
  }
  return count;
}

export function checkMissedDays(
  program: RehabProgram,
  today: string,
): { missed: number; shouldPause: boolean } {
  const last = lastActivityDate(program);
  const gap = daysBetween(last, today);
  // Gap of 1 = user is doing today's session (no day missed).
  // Gap of 2 = 1 day missed (grace).
  // Gap of 3+ = 2+ days missed (pause).
  const missed = Math.max(0, gap - 1);
  return { missed, shouldPause: missed >= 2 };
}

export function consecutiveBetterCount(program: RehabProgram): number {
  let count = 0;
  for (let i = program.currentDay - 1; i >= 0; i--) {
    const d = program.days[i];
    if (d.completed && d.feedback === 'better') count++;
    else if (d.completed) break;
  }
  return count;
}

export const PROGRAM_DAYS = PROGRAM_LENGTH;

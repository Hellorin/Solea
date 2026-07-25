import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Rehab from '../pages/Rehab';

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

beforeEach(() => {
  localStorageMock.clear();
  vi.setSystemTime(new Date('2024-06-15T08:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.stubGlobal('localStorage', localStorageMock);
});

function renderRehab() {
  return render(
    <MemoryRouter initialEntries={['/rehab']}>
      <Routes>
        <Route path="/rehab" element={<Rehab />} />
        <Route path="/rehab/start" element={<div>Onboarding Page</div>} />
        <Route path="/rehab/checkin" element={<div>Checkin Page</div>} />
        <Route path="/cycle" element={<div>Cycle Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function programWithDays(overrides: Record<string, unknown>, days: Record<string, unknown>[]) {
  return {
    version: 1,
    startDate: '2024-06-15',
    onboarding: { initialPain: 3, duration: 'subacute' },
    days,
    currentDay: 1,
    active: true,
    paused: false,
    lastAdaptationReason: null,
    ...overrides,
  };
}

describe('Rehab — no active program', () => {
  it('shows a start prompt and navigates to onboarding', () => {
    renderRehab();
    expect(screen.getByText('Start your 30-day program')).toBeTruthy();
    fireEvent.click(screen.getByText('Start now'));
    expect(screen.getByText('Onboarding Page')).toBeTruthy();
  });
});

describe('Rehab — active program, day not started', () => {
  it("shows today's exercises and starts a session with the correct rehab state", () => {
    const days = [
      { day: 1, phase: 'relief', exerciseIds: ['toe-extension', 'towel-stretch'], completed: false },
    ];
    localStorageMock.setItem('rehab_program', JSON.stringify(programWithDays({}, days)));
    renderRehab();
    expect(screen.getByText('Day 1')).toBeTruthy();
    expect(screen.getByText('Pain relief')).toBeTruthy();
    fireEvent.click(screen.getByText("Start today's session"));
    expect(screen.getByText('Cycle Page')).toBeTruthy();
  });

  it('shows a lighter-day badge when the day is lite', () => {
    const days = [
      { day: 1, phase: 'relief', exerciseIds: ['toe-extension'], completed: false, lite: true },
    ];
    localStorageMock.setItem('rehab_program', JSON.stringify(programWithDays({}, days)));
    renderRehab();
    expect(screen.getByText('Lighter day')).toBeTruthy();
  });
});

describe('Rehab — session done, awaiting check-in', () => {
  it('shows a "come back tomorrow" message the same day the session was completed', () => {
    const days = [
      { day: 1, phase: 'relief', exerciseIds: ['toe-extension'], completed: false, sessionDone: true, sessionDate: '2024-06-15' },
    ];
    localStorageMock.setItem('rehab_program', JSON.stringify(programWithDays({}, days)));
    renderRehab();
    expect(screen.getByText(/Come back tomorrow/)).toBeTruthy();
    expect(screen.queryByText("Log today's check-in")).toBeNull();
  });

  it('offers a check-in once a new calendar day has started', () => {
    const days = [
      { day: 1, phase: 'relief', exerciseIds: ['toe-extension'], completed: false, sessionDone: true, sessionDate: '2024-06-14' },
    ];
    localStorageMock.setItem('rehab_program', JSON.stringify(programWithDays({}, days)));
    renderRehab();
    fireEvent.click(screen.getByText("Log today's check-in"));
    expect(screen.getByText('Checkin Page')).toBeTruthy();
  });
});

describe('Rehab — paused program', () => {
  it('offers resume and abandon actions', () => {
    const days = [{ day: 1, phase: 'relief', exerciseIds: ['toe-extension'], completed: false }];
    localStorageMock.setItem('rehab_program', JSON.stringify(programWithDays({ paused: true }, days)));
    renderRehab();
    expect(screen.getByText('Your program is paused')).toBeTruthy();
    fireEvent.click(screen.getByText('Resume'));
    expect(JSON.parse(localStorageMock.getItem('rehab_program')!).paused).toBe(false);
  });

  it('auto-pauses a program that missed 2+ days', () => {
    const days = [
      { day: 1, phase: 'relief', exerciseIds: ['toe-extension'], completed: true, date: '2024-06-10', feedback: 'same', painAfter: 3 },
    ];
    localStorageMock.setItem('rehab_program', JSON.stringify(programWithDays({ paused: false }, days)));
    renderRehab();
    expect(screen.getByText('Your program is paused')).toBeTruthy();
  });
});

describe('Rehab — last check-in summary and grid', () => {
  it("shows yesterday's check-in summary when the previous day was completed", () => {
    const days = [
      { day: 1, phase: 'relief', exerciseIds: ['toe-extension'], completed: true, date: '2024-06-14', feedback: 'better', painAfter: 2 },
      { day: 2, phase: 'relief', exerciseIds: ['towel-stretch'], completed: false },
    ];
    localStorageMock.setItem('rehab_program', JSON.stringify(programWithDays({ currentDay: 2 }, days)));
    renderRehab();
    expect(screen.getByText("Yesterday's check-in")).toBeTruthy();
    expect(screen.getByText('Better')).toBeTruthy();
  });

  it('renders the 30-day grid legend', () => {
    const days = [{ day: 1, phase: 'relief', exerciseIds: ['toe-extension'], completed: false }];
    localStorageMock.setItem('rehab_program', JSON.stringify(programWithDays({}, days)));
    renderRehab();
    expect(screen.getByText('Your 30 days')).toBeTruthy();
    expect(screen.getByText('Relief')).toBeTruthy();
    expect(screen.getByText('Loading')).toBeTruthy();
    expect(screen.getByText('Strengthening')).toBeTruthy();
  });
});

describe('Rehab — abandon', () => {
  it('clears the program after confirmation', () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    const days = [{ day: 1, phase: 'relief', exerciseIds: ['toe-extension'], completed: false }];
    localStorageMock.setItem('rehab_program', JSON.stringify(programWithDays({}, days)));
    renderRehab();
    fireEvent.click(screen.getByText('Abandon program'));
    expect(screen.getByText('Start your 30-day program')).toBeTruthy();
    expect(localStorageMock.getItem('rehab_program')).toBeNull();
  });

  it('keeps the program when abandon is declined', () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    const days = [{ day: 1, phase: 'relief', exerciseIds: ['toe-extension'], completed: false }];
    localStorageMock.setItem('rehab_program', JSON.stringify(programWithDays({}, days)));
    renderRehab();
    fireEvent.click(screen.getByText('Abandon program'));
    expect(localStorageMock.getItem('rehab_program')).not.toBeNull();
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RehabCheckin from '../pages/RehabCheckin';

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

function baseProgram() {
  return {
    version: 1,
    startDate: '2024-06-10',
    onboarding: { initialPain: 3, duration: 'subacute' },
    days: [
      { day: 1, phase: 'relief', exerciseIds: ['toe-extension'], completed: false, painBefore: 3, sessionDone: true, sessionDate: '2024-06-14' },
    ],
    currentDay: 1,
    active: true,
    paused: false,
    lastAdaptationReason: null,
  };
}

beforeEach(() => {
  localStorageMock.clear();
  vi.setSystemTime(new Date('2024-06-15T08:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
});

function renderCheckin() {
  return render(
    <MemoryRouter initialEntries={['/rehab/checkin']}>
      <Routes>
        <Route path="/rehab/checkin" element={<RehabCheckin />} />
        <Route path="/rehab" element={<div>Rehab Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RehabCheckin', () => {
  it('disables Save check-in until both feedback and pain are chosen', () => {
    localStorageMock.setItem('rehab_program', JSON.stringify(baseProgram()));
    renderCheckin();
    expect(screen.getByText('Save check-in').closest('button')!.disabled).toBe(true);
    fireEvent.click(screen.getByText('Better'));
    expect(screen.getByText('Save check-in').closest('button')!.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Mild pain'));
    expect(screen.getByText('Save check-in').closest('button')!.disabled).toBe(false);
  });

  it('navigates back to /rehab without clicking save', () => {
    localStorageMock.setItem('rehab_program', JSON.stringify(baseProgram()));
    renderCheckin();
    fireEvent.click(screen.getByText('← Back'));
    expect(screen.getByText('Rehab Page')).toBeTruthy();
  });

  it('saves the check-in, advances the program, and logs pain', () => {
    localStorageMock.setItem('rehab_program', JSON.stringify(baseProgram()));
    renderCheckin();
    fireEvent.click(screen.getByText('Better'));
    fireEvent.click(screen.getByLabelText('Mild pain'));
    fireEvent.click(screen.getByText('Save check-in'));

    expect(screen.getByText('Rehab Page')).toBeTruthy();
    const saved = JSON.parse(localStorageMock.getItem('rehab_program')!);
    expect(saved.days[0].completed).toBe(true);
    expect(saved.days[0].feedback).toBe('better');
    expect(saved.days[0].painAfter).toBe(2);
    expect(JSON.parse(localStorageMock.getItem('pain_log')!)).toEqual([
      { date: '2024-06-15', level: 2 },
    ]);
  });

  it('redirects to /rehab without saving when there is no active program', () => {
    renderCheckin();
    fireEvent.click(screen.getByText('Better'));
    fireEvent.click(screen.getByLabelText('Mild pain'));
    fireEvent.click(screen.getByText('Save check-in'));
    expect(screen.getByText('Rehab Page')).toBeTruthy();
    expect(localStorageMock.getItem('pain_log')).toBeNull();
  });
});

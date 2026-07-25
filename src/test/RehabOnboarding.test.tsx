import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RehabOnboarding from '../pages/RehabOnboarding';

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

function renderOnboarding() {
  return render(
    <MemoryRouter initialEntries={['/rehab/start']}>
      <Routes>
        <Route path="/rehab/start" element={<RehabOnboarding />} />
        <Route path="/rehab" element={<div>Rehab Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RehabOnboarding — step 1 (pain)', () => {
  it('disables Continue until a pain level is chosen', () => {
    renderOnboarding();
    expect(screen.getByText('Continue').closest('button')!.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Severe pain'));
    expect(screen.getByText('Continue').closest('button')!.disabled).toBe(false);
  });

  it('navigates back to /rehab from step 1', () => {
    renderOnboarding();
    fireEvent.click(screen.getByText('← Back'));
    expect(screen.getByText('Rehab Page')).toBeTruthy();
  });
});

describe('RehabOnboarding — step 2 (duration)', () => {
  function goToStep2() {
    fireEvent.click(screen.getByLabelText('Severe pain'));
    fireEvent.click(screen.getByText('Continue'));
  }

  it('disables the finish button until a duration is chosen', () => {
    renderOnboarding();
    goToStep2();
    expect(screen.getByText('Step 2 of 2')).toBeTruthy();
    expect(screen.getByText('Start my 30-day program').closest('button')!.disabled).toBe(true);
  });

  it('going back returns to step 1', () => {
    renderOnboarding();
    goToStep2();
    fireEvent.click(screen.getByText('← Back'));
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
  });

  it('creates and saves a program, then navigates to /rehab', () => {
    renderOnboarding();
    goToStep2();
    fireEvent.click(screen.getByText('2 to 6 weeks'));
    fireEvent.click(screen.getByText('Start my 30-day program'));

    expect(screen.getByText('Rehab Page')).toBeTruthy();
    const saved = JSON.parse(localStorageMock.getItem('rehab_program')!);
    expect(saved.active).toBe(true);
    expect(saved.currentDay).toBe(1);
    expect(saved.onboarding).toEqual({ initialPain: 5, duration: 'subacute' });
    expect(JSON.parse(localStorageMock.getItem('pain_log')!)).toEqual([
      { date: '2024-06-15', level: 5 },
    ]);
  });

  it('asks for confirmation before replacing an existing active program', () => {
    localStorageMock.setItem('rehab_program', JSON.stringify({
      version: 1, startDate: '2024-06-01', onboarding: { initialPain: 2, duration: 'chronic' },
      days: [], currentDay: 3, active: true, paused: false, lastAdaptationReason: null,
    }));
    const confirmSpy = vi.fn(() => false);
    vi.stubGlobal('confirm', confirmSpy);

    renderOnboarding();
    goToStep2();
    fireEvent.click(screen.getByText('2 to 6 weeks'));
    fireEvent.click(screen.getByText('Start my 30-day program'));

    expect(confirmSpy).toHaveBeenCalled();
    // Declined — still on the onboarding screen, original program untouched.
    expect(screen.getByText('Step 2 of 2')).toBeTruthy();
    expect(JSON.parse(localStorageMock.getItem('rehab_program')!).currentDay).toBe(3);
  });
});

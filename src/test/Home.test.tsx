import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';

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
});

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/guide" element={<div>Guide Page</div>} />
        <Route path="/rehab" element={<div>Rehab Page</div>} />
        <Route path="/cycle" element={<div>Cycle Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Home', () => {
  it('renders a time-appropriate greeting', () => {
    renderHome();
    expect(screen.getByText(/Good morning/)).toBeTruthy();
  });

  it('shows pain-selection emojis when no pain has been logged today', () => {
    renderHome();
    expect(screen.getByLabelText('No pain')).toBeTruthy();
    expect(screen.getByLabelText('Severe pain')).toBeTruthy();
  });

  it('logs pain and switches to the logged view on selection', () => {
    renderHome();
    fireEvent.click(screen.getByLabelText('Moderate pain'));
    expect(screen.getByText('Change')).toBeTruthy();
    expect(localStorageMock.getItem('pain_log')).toContain('"level":3');
  });

  it('shows the pre-existing pain selection from localStorage', () => {
    localStorageMock.setItem('pain_log', JSON.stringify([{ date: '2024-06-15', level: 2 }]));
    renderHome();
    expect(screen.getByText('Change')).toBeTruthy();
    expect(screen.queryByLabelText('No pain')).toBeNull();
  });

  it('returns to the pain picker when "Change" is clicked', () => {
    localStorageMock.setItem('pain_log', JSON.stringify([{ date: '2024-06-15', level: 2 }]));
    renderHome();
    fireEvent.click(screen.getByText('Change'));
    expect(screen.getByLabelText('No pain')).toBeTruthy();
  });

  it('does not show a rehab banner when there is no active program', () => {
    renderHome();
    expect(screen.queryByText(/Rehab program/)).toBeNull();
  });

  it('shows a rehab banner with the current day when a program is active', () => {
    localStorageMock.setItem('rehab_program', JSON.stringify({
      version: 1,
      startDate: '2024-06-01',
      onboarding: { initialPain: 3, duration: 'subacute' },
      days: [],
      currentDay: 4,
      active: true,
      paused: false,
      lastAdaptationReason: null,
    }));
    renderHome();
    expect(screen.getByText(/Day 4 of 30/)).toBeTruthy();
  });

  it('does not show the rehab banner when the program is paused', () => {
    localStorageMock.setItem('rehab_program', JSON.stringify({
      version: 1,
      startDate: '2024-06-01',
      onboarding: { initialPain: 3, duration: 'subacute' },
      days: [],
      currentDay: 4,
      active: true,
      paused: true,
      lastAdaptationReason: null,
    }));
    renderHome();
    expect(screen.queryByText(/Rehab program/)).toBeNull();
  });

  it('recommends the gentlest routine when there is no history and no pain logged', () => {
    renderHome();
    expect(screen.getByText(/Getting back on track/)).toBeTruthy();
    expect(screen.getByText('Morning')).toBeTruthy();
  });

  it('navigates to the guide page from "View Exercises"', () => {
    renderHome();
    fireEvent.click(screen.getByText('View Exercises'));
    expect(screen.getByText('Guide Page')).toBeTruthy();
  });

  it('navigates to the rehab page from the rehab banner', () => {
    localStorageMock.setItem('rehab_program', JSON.stringify({
      version: 1,
      startDate: '2024-06-01',
      onboarding: { initialPain: 3, duration: 'subacute' },
      days: [],
      currentDay: 1,
      active: true,
      paused: false,
      lastAdaptationReason: null,
    }));
    renderHome();
    fireEvent.click(screen.getByText(/Rehab program/));
    expect(screen.getByText('Rehab Page')).toBeTruthy();
  });

  it('navigates to the cycle page from the quick-start "Start" button', () => {
    renderHome();
    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByText('Cycle Page')).toBeTruthy();
  });
});

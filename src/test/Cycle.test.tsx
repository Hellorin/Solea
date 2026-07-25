import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Cycle from '../pages/Cycle';
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

beforeEach(() => {
  localStorageMock.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.stubGlobal('localStorage', localStorageMock);
});

function renderCycle(initialEntries: (string | { pathname: string; state?: unknown })[] = ['/cycle']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/cycle" element={<Cycle />} />
        <Route path="/cycle/new" element={<div>Cycle Builder Page</div>} />
        <Route path="/rehab" element={<div>Rehab Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function completeAllExercises(count: number) {
  for (let i = 0; i < count; i++) {
    fireEvent.click(screen.getByText("I'm Ready"));
    const isLast = i === count - 1;
    fireEvent.click(screen.getByText(isLast ? 'Finish' : 'Next Exercise'));
  }
}

describe('Cycle — pick view', () => {
  it('renders all three presets and the quick-cycle entry', () => {
    renderCycle();
    expect(screen.getByText('Morning')).toBeTruthy();
    expect(screen.getByText('Rehab')).toBeTruthy();
    expect(screen.getByText('Evening')).toBeTruthy();
    expect(screen.getByText('Quick Cycle')).toBeTruthy();
  });

  it('navigates to the cycle builder from "Create your own cycle"', () => {
    renderCycle();
    fireEvent.click(screen.getByText('+ Create your own cycle'));
    expect(screen.getByText('Cycle Builder Page')).toBeTruthy();
  });

  it('shows saved custom cycles under "My Cycles"', () => {
    localStorageMock.setItem('custom_cycles', JSON.stringify([
      { id: '1', label: 'My Custom Mix', emoji: '✨', exerciseIds: ['toe-extension'], createdAt: '2024-01-01T00:00:00.000Z' },
    ]));
    renderCycle();
    expect(screen.getByText('My Cycles')).toBeTruthy();
    expect(screen.getByText('My Custom Mix')).toBeTruthy();
  });

  it('deletes a custom cycle after confirmation', () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    localStorageMock.setItem('custom_cycles', JSON.stringify([
      { id: '1', label: 'My Custom Mix', emoji: '✨', exerciseIds: ['toe-extension'], createdAt: '2024-01-01T00:00:00.000Z' },
    ]));
    renderCycle();
    fireEvent.click(screen.getByLabelText('Delete cycle'));
    expect(screen.queryByText('My Custom Mix')).toBeNull();
    expect(JSON.parse(localStorageMock.getItem('custom_cycles')!)).toEqual([]);
  });

  it('does not delete a custom cycle when confirmation is declined', () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    localStorageMock.setItem('custom_cycles', JSON.stringify([
      { id: '1', label: 'My Custom Mix', emoji: '✨', exerciseIds: ['toe-extension'], createdAt: '2024-01-01T00:00:00.000Z' },
    ]));
    renderCycle();
    fireEvent.click(screen.getByLabelText('Delete cycle'));
    expect(screen.getByText('My Custom Mix')).toBeTruthy();
  });

  it('renames a custom cycle', () => {
    localStorageMock.setItem('custom_cycles', JSON.stringify([
      { id: '1', label: 'My Custom Mix', emoji: '✨', exerciseIds: ['toe-extension'], createdAt: '2024-01-01T00:00:00.000Z' },
    ]));
    renderCycle();
    fireEvent.click(screen.getByLabelText('Rename cycle'));
    const input = screen.getByDisplayValue('My Custom Mix');
    fireEvent.change(input, { target: { value: 'Renamed Mix' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Renamed Mix')).toBeTruthy();
    expect(JSON.parse(localStorageMock.getItem('custom_cycles')!)[0].label).toBe('Renamed Mix');
  });
});

describe('Cycle — equipment gate', () => {
  it('shows an equipment checklist before starting a preset that needs gear', () => {
    renderCycle();
    // Morning preset includes the towel stretch, which needs a towel.
    const morningCard = screen.getByText('Morning').closest('div')!.parentElement!.parentElement!;
    fireEvent.click(morningCard.querySelector('button')!);
    expect(screen.getByText('Grab your equipment')).toBeTruthy();
    expect(screen.getByText('Towel')).toBeTruthy();
  });

  it('proceeds to the running view once equipment is acknowledged', () => {
    renderCycle();
    const morningCard = screen.getByText('Morning').closest('div')!.parentElement!.parentElement!;
    fireEvent.click(morningCard.querySelector('button')!);
    fireEvent.click(screen.getByText("Got it, let's go!"));
    expect(screen.getByText('Exercise 1 of 6')).toBeTruthy();
  });
});

describe('Cycle — running and completion', () => {
  it('runs through an equipment-free quick cycle and completes it', () => {
    renderCycle();
    fireEvent.click(screen.getByText('Quick Cycle'));

    // Select three exercises with no equipment requirement.
    const picks = ['toe-extension', 'calf-straight', 'calf-bent'];
    for (const id of picks) {
      const ex = exercises.find(e => e.id === id)!;
      const label = screen.getByText(ex.name).closest('label')!;
      fireEvent.click(label.querySelector('input')!);
    }

    fireEvent.click(screen.getByText('Start (3)'));
    expect(screen.getByText('Exercise 1 of 3')).toBeTruthy();

    completeAllExercises(3);

    expect(screen.getByText('Cycle complete!')).toBeTruthy();
    expect(screen.getByText('exercises done')).toBeTruthy();

    const saved = JSON.parse(localStorageMock.getItem('plantar_history')!);
    expect(saved).toHaveLength(1);
    expect(saved[0].exerciseCount).toBe(3);
  });

  it('returns to the pick view from the "Choose Cycle" button on the done screen', () => {
    renderCycle();
    fireEvent.click(screen.getByText('Quick Cycle'));
    const ex = exercises.find(e => e.id === 'toe-extension')!;
    fireEvent.click(screen.getByText(ex.name).closest('label')!.querySelector('input')!);
    fireEvent.click(screen.getByText('Start (1)'));
    completeAllExercises(1);
    fireEvent.click(screen.getByText('Choose Cycle'));
    expect(screen.getByText('Quick Cycle')).toBeTruthy();
  });

  it('navigates home from the done screen', () => {
    renderCycle();
    fireEvent.click(screen.getByText('Quick Cycle'));
    const ex = exercises.find(e => e.id === 'toe-extension')!;
    fireEvent.click(screen.getByText(ex.name).closest('label')!.querySelector('input')!);
    fireEvent.click(screen.getByText('Start (1)'));
    completeAllExercises(1);
    fireEvent.click(screen.getByText('Go Home'));
    expect(screen.getByText('Home Page')).toBeTruthy();
  });

  it('disables the quick-cycle start button until an exercise is selected', () => {
    renderCycle();
    fireEvent.click(screen.getByText('Quick Cycle'));
    expect(screen.getByText('Select exercises to start').closest('button')!.disabled).toBe(true);
  });

  it('pauses and resumes the timer, and shows an equipment badge for the current exercise', () => {
    renderCycle();
    fireEvent.click(screen.getByText('Quick Cycle'));
    for (const id of ['toe-extension', 'towel-stretch']) {
      const ex = exercises.find(e => e.id === id)!;
      fireEvent.click(screen.getByText(ex.name).closest('label')!.querySelector('input')!);
    }
    fireEvent.click(screen.getByText('Start (2)'));
    fireEvent.click(screen.getByText("Got it, let's go!"));

    fireEvent.click(screen.getByText("I'm Ready"));
    fireEvent.click(screen.getByText('⏸ Pause'));
    expect(screen.getByText('▶ Resume')).toBeTruthy();
    fireEvent.click(screen.getByText('▶ Resume'));
    expect(screen.getByText('⏸ Pause')).toBeTruthy();

    fireEvent.click(screen.getByText('Skip'));
    expect(screen.getByText('Exercise 2 of 2')).toBeTruthy();
    expect(screen.getByText(/🔧 Towel/)).toBeTruthy();
  });

  it('restarts the same quick cycle from the done screen', () => {
    renderCycle();
    fireEvent.click(screen.getByText('Quick Cycle'));
    const ex = exercises.find(e => e.id === 'toe-extension')!;
    fireEvent.click(screen.getByText(ex.name).closest('label')!.querySelector('input')!);
    fireEvent.click(screen.getByText('Start (1)'));
    completeAllExercises(1);
    fireEvent.click(screen.getByText('Start Again'));
    expect(screen.getByText('Exercise 1 of 1')).toBeTruthy();
  });

  it('lets the user cancel a rename with Escape', () => {
    localStorageMock.setItem('custom_cycles', JSON.stringify([
      { id: '1', label: 'My Custom Mix', emoji: '✨', exerciseIds: ['toe-extension'], createdAt: '2024-01-01T00:00:00.000Z' },
    ]));
    renderCycle();
    fireEvent.click(screen.getByLabelText('Rename cycle'));
    const input = screen.getByDisplayValue('My Custom Mix');
    fireEvent.change(input, { target: { value: 'Discarded' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.getByText('My Custom Mix')).toBeTruthy();
    expect(screen.queryByText('Discarded')).toBeNull();
  });

  it('selects and deselects all exercises in a category via "Select all" / "Deselect all"', () => {
    renderCycle();
    fireEvent.click(screen.getByText('Quick Cycle'));
    const stretchingHeader = screen.getByText(/🧘 Stretching/).closest('div')!;
    const selectAllBtn = stretchingHeader.querySelector('button')!;
    expect(selectAllBtn.textContent).toBe('Select all');

    fireEvent.click(selectAllBtn);
    const stretchingCount = exercises.filter(e => e.category === 'stretching').length;
    expect(screen.getByText(`Start (${stretchingCount})`)).toBeTruthy();
    expect(selectAllBtn.textContent).toBe('Deselect all');

    fireEvent.click(selectAllBtn);
    expect(screen.getByText('Select exercises to start')).toBeTruthy();
  });

  it('returns to the pick view from the quick-pick "Back" button', () => {
    renderCycle();
    fireEvent.click(screen.getByText('Quick Cycle'));
    fireEvent.click(screen.getByText('← Back'));
    expect(screen.getByText('Exercise Cycles')).toBeTruthy();
  });
});

describe('Cycle — rehab-prescribed session', () => {
  it('goes straight to the running view for a prescribed session with no equipment', () => {
    renderCycle([{
      pathname: '/cycle',
      state: { prescribedIds: ['toe-extension'], prescribedLabel: 'Day 1 of 30', fromRehab: true },
    }]);
    expect(screen.getByText('Exercise 1 of 1')).toBeTruthy();
  });

  it('shows the equipment gate for a prescribed session that needs gear', () => {
    renderCycle([{
      pathname: '/cycle',
      state: { prescribedIds: ['towel-stretch'], prescribedLabel: 'Day 1 of 30', fromRehab: true },
    }]);
    expect(screen.getByText('Grab your equipment')).toBeTruthy();
  });

  it('marks the rehab session done and returns to /rehab on finishing', () => {
    localStorageMock.setItem('rehab_program', JSON.stringify({
      version: 1,
      startDate: '2024-06-01',
      onboarding: { initialPain: 3, duration: 'subacute' },
      days: [{ day: 1, phase: 'relief', exerciseIds: ['toe-extension'], completed: false }],
      currentDay: 1,
      active: true,
      paused: false,
      lastAdaptationReason: null,
    }));
    renderCycle([{
      pathname: '/cycle',
      state: { prescribedIds: ['toe-extension'], prescribedLabel: 'Day 1 of 30', fromRehab: true },
    }]);
    completeAllExercises(1);
    expect(screen.getByText('Rehab Page')).toBeTruthy();
    const saved = JSON.parse(localStorageMock.getItem('rehab_program')!);
    expect(saved.days[0].sessionDone).toBe(true);
  });
});

describe('Cycle — quick-start from Home', () => {
  it('starts the matching preset directly when arriving with a quickStart state', () => {
    renderCycle([{ pathname: '/cycle', state: { quickStart: 'anytime' } }]);
    expect(screen.getByText('Grab your equipment')).toBeTruthy();
    expect(screen.getByText(/Rehab/)).toBeTruthy();
  });
});

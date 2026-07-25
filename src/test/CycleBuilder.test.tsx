import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CycleBuilder from '../pages/CycleBuilder';
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

function renderBuilder() {
  return render(
    <MemoryRouter initialEntries={['/cycle/new']}>
      <Routes>
        <Route path="/cycle/new" element={<CycleBuilder />} />
        <Route path="/cycle" element={<div>Cycle Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function getOrderRowNames(): string[] {
  return Array.from(document.querySelectorAll('[class*="orderRowName"]')).map(
    (el) => el.textContent ?? ''
  );
}

function goToStep2() {
  fireEvent.change(screen.getByPlaceholderText('e.g. Quick Morning'), { target: { value: 'My Mix' } });
  fireEvent.click(screen.getByText('Continue'));
}

function goToStep3(ids: string[]) {
  goToStep2();
  for (const id of ids) {
    const ex = exercises.find(e => e.id === id)!;
    fireEvent.click(screen.getByText(ex.name));
  }
  fireEvent.click(screen.getByText('Continue'));
}

describe('CycleBuilder — step 1 (name & emoji)', () => {
  it('disables Continue until a name is entered', () => {
    renderBuilder();
    expect(screen.getByText('Continue').closest('button')!.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText('e.g. Quick Morning'), { target: { value: 'My Mix' } });
    expect(screen.getByText('Continue').closest('button')!.disabled).toBe(false);
  });

  it('navigates back to /cycle from step 1', () => {
    renderBuilder();
    fireEvent.click(screen.getByText('← Back'));
    expect(screen.getByText('Cycle Page')).toBeTruthy();
  });

  it('lets the user pick an emoji', () => {
    renderBuilder();
    const heartEmojiBtn = screen.getByText('🔥');
    fireEvent.click(heartEmojiBtn);
    expect(heartEmojiBtn.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('CycleBuilder — step 2 (select exercises)', () => {
  it('disables Continue until at least one exercise is selected', () => {
    renderBuilder();
    goToStep2();
    expect(screen.getByText('Step 2 of 3')).toBeTruthy();
    expect(screen.getByText('Continue').closest('button')!.disabled).toBe(true);
  });

  it('shows a selection count and enables Continue once exercises are picked', () => {
    renderBuilder();
    goToStep2();
    fireEvent.click(screen.getByText(exercises[0].name));
    expect(screen.getByText('1 selected')).toBeTruthy();
    expect(screen.getByText('Continue').closest('button')!.disabled).toBe(false);
  });

  it('"Add all" selects every exercise, and toggles to "Remove all"', () => {
    renderBuilder();
    goToStep2();
    fireEvent.click(screen.getByText('Add all'));
    expect(screen.getByText(`${exercises.length} selected`)).toBeTruthy();
    expect(screen.getByText('Remove all')).toBeTruthy();
  });

  it('going back to step 1 preserves the entered name', () => {
    renderBuilder();
    goToStep2();
    fireEvent.click(screen.getByText('← Back'));
    expect(screen.getByDisplayValue('My Mix')).toBeTruthy();
  });
});

describe('CycleBuilder — step 3 (order & save)', () => {
  it('lists the selected exercises in selection order', () => {
    renderBuilder();
    goToStep3(['eccentric-heel-drop', 'toe-extension']);
    expect(screen.getByText('Step 3 of 3')).toBeTruthy();
    expect(getOrderRowNames()).toEqual([
      exercises.find(e => e.id === 'eccentric-heel-drop')!.name,
      exercises.find(e => e.id === 'toe-extension')!.name,
    ]);
  });

  it('reorders exercises with the up/down controls', () => {
    renderBuilder();
    goToStep3(['eccentric-heel-drop', 'toe-extension']);
    const downButtons = screen.getAllByLabelText('Move down');
    fireEvent.click(downButtons[0]);
    expect(getOrderRowNames()[0]).toBe(exercises.find(e => e.id === 'toe-extension')!.name);
  });

  it('sorts by PT protocol (stretching before mobility before strengthening)', () => {
    renderBuilder();
    // toe-scrunch = strengthening, ankle-alphabet = mobility, toe-extension = stretching
    goToStep3(['toe-scrunch', 'ankle-alphabet', 'toe-extension']);
    fireEvent.click(screen.getByText('Sort by PT protocol'));
    expect(getOrderRowNames()).toEqual([
      exercises.find(e => e.id === 'toe-extension')!.name,
      exercises.find(e => e.id === 'ankle-alphabet')!.name,
      exercises.find(e => e.id === 'toe-scrunch')!.name,
    ]);
  });

  it('saves the cycle and navigates back to /cycle', () => {
    renderBuilder();
    goToStep3(['toe-extension']);
    fireEvent.click(screen.getByText('Save Cycle'));
    expect(screen.getByText('Cycle Page')).toBeTruthy();

    const saved = JSON.parse(localStorageMock.getItem('custom_cycles')!);
    expect(saved).toHaveLength(1);
    expect(saved[0].label).toBe('My Mix');
    expect(saved[0].exerciseIds).toEqual(['toe-extension']);
  });
});

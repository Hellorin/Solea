import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Guide from '../pages/Guide';
import { exercises } from '../data/exercises';

describe('Guide', () => {
  it('renders the three category sections', () => {
    render(<Guide />);
    expect(screen.getByText(/Stretching/)).toBeTruthy();
    expect(screen.getByText(/Mobility/)).toBeTruthy();
    expect(screen.getByText(/Strengthening/)).toBeTruthy();
  });

  it('renders a card for every exercise', () => {
    render(<Guide />);
    for (const ex of exercises) {
      expect(screen.getByText(ex.name)).toBeTruthy();
    }
  });

  it('shows the acute-phase warning note under strengthening', () => {
    render(<Guide />);
    expect(screen.getAllByText(/Acute phase:/).length).toBeGreaterThan(0);
  });

  it('groups exercises under the correct category heading', () => {
    render(<Guide />);
    const stretchingSection = screen.getByText(/Stretching/).closest('div')!;
    const firstStretch = exercises.find(e => e.category === 'stretching')!;
    const firstStrengthening = exercises.find(e => e.category === 'strengthening')!;
    expect(stretchingSection.textContent).toContain(firstStretch.name);
    expect(stretchingSection.textContent).not.toContain(firstStrengthening.name);
  });
});

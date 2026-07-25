import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav />
    </MemoryRouter>
  );
}

describe('BottomNav', () => {
  it('renders all five tabs', () => {
    renderAt('/');
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Rehab')).toBeTruthy();
    expect(screen.getByText('Cycles')).toBeTruthy();
    expect(screen.getByText('Exercises')).toBeTruthy();
    expect(screen.getByText('Stats')).toBeTruthy();
  });

  it('marks the Home tab active on the root path (exact match)', () => {
    renderAt('/');
    const homeLink = screen.getByText('Home').closest('a')!;
    const cyclesLink = screen.getByText('Cycles').closest('a')!;
    expect(homeLink.className).toMatch(/active/);
    expect(cyclesLink.className).not.toMatch(/active/);
  });

  it('marks the Cycles tab active on /cycle without activating Home', () => {
    renderAt('/cycle');
    const homeLink = screen.getByText('Home').closest('a')!;
    const cyclesLink = screen.getByText('Cycles').closest('a')!;
    expect(cyclesLink.className).toMatch(/active/);
    expect(homeLink.className).not.toMatch(/active/);
  });

  it('links point to the expected routes', () => {
    renderAt('/');
    expect(screen.getByText('Rehab').closest('a')?.getAttribute('href')).toBe('/rehab');
    expect(screen.getByText('Exercises').closest('a')?.getAttribute('href')).toBe('/guide');
    expect(screen.getByText('Stats').closest('a')?.getAttribute('href')).toBe('/stats');
  });
});

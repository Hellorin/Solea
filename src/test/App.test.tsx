import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
  vi.setSystemTime(new Date('2024-06-15T08:00:00'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('App', () => {
  it('renders the Home page by default with the bottom nav', () => {
    render(<App />);
    expect(screen.getByText('Solea')).toBeTruthy();
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Rehab')).toBeTruthy();
    expect(screen.getByText('Cycles')).toBeTruthy();
    expect(screen.getByText('Exercises')).toBeTruthy();
    expect(screen.getByText('Stats')).toBeTruthy();
  });

  it('navigates between pages via the bottom nav', () => {
    render(<App />);

    fireEvent.click(screen.getByText('Exercises'));
    expect(screen.getByText('Exercise Guide')).toBeTruthy();

    fireEvent.click(screen.getByText('Stats'));
    expect(screen.getByText('Progress')).toBeTruthy();

    fireEvent.click(screen.getByText('Rehab'));
    expect(screen.getByText('30-Day Rehab')).toBeTruthy();

    fireEvent.click(screen.getByText('Cycles'));
    expect(screen.getByText('Exercise Cycles')).toBeTruthy();

    fireEvent.click(screen.getByText('Home'));
    expect(screen.getByText('Solea')).toBeTruthy();
  });
});

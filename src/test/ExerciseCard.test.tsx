import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExerciseCard from '../components/ExerciseCard';
import type { Exercise } from '../data/exercises';

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'test-ex',
    name: 'Test Exercise',
    category: 'stretching',
    image: 'https://placehold.co/400x220',
    duration: '10 seconds',
    reps: '3 reps',
    instructions: ['Step one', 'Step two'],
    ...overrides,
  };
}

describe('ExerciseCard', () => {
  it('renders the exercise name and starts collapsed', () => {
    render(<ExerciseCard exercise={makeExercise()} />);
    expect(screen.getByText('Test Exercise')).toBeTruthy();
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('expands to show instructions when the header is clicked', () => {
    render(<ExerciseCard exercise={makeExercise()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Step one')).toBeTruthy();
    expect(screen.getByText('Step two')).toBeTruthy();
  });

  it('collapses again on a second click', () => {
    render(<ExerciseCard exercise={makeExercise()} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders equipment badges when equipment is present', () => {
    render(<ExerciseCard exercise={makeExercise({ equipment: ['Towel', 'Tennis ball'] })} />);
    expect(screen.getByText(/Towel/)).toBeTruthy();
    expect(screen.getByText(/Tennis ball/)).toBeTruthy();
  });

  it('does not render equipment badges when equipment is absent', () => {
    render(<ExerciseCard exercise={makeExercise()} />);
    expect(screen.queryByText(/🔧/)).toBeNull();
  });

  it('renders a tip when provided', () => {
    render(<ExerciseCard exercise={makeExercise({ tip: 'Stay relaxed' })} />);
    expect(screen.getByText(/Stay relaxed/)).toBeTruthy();
  });

  it('does not render a tip section when absent', () => {
    render(<ExerciseCard exercise={makeExercise()} />);
    expect(screen.queryByText('Tip:')).toBeNull();
  });

  it('renders an acute-phase warning when provided', () => {
    render(<ExerciseCard exercise={makeExercise({ acuteWarning: 'Skip if painful' })} />);
    expect(screen.getByText(/Skip if painful/)).toBeTruthy();
  });
});

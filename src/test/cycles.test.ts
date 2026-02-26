import { describe, it, expect } from 'vitest';
import { PRESETS, getPresetExercises } from '../data/cycles';
import { exercises } from '../data/exercises';

describe('getPresetExercises', () => {
  it('all IDs in the morning preset resolve to exercises', () => {
    const morning = PRESETS.find(p => p.id === 'morning')!;
    const resolved = getPresetExercises(morning);
    expect(resolved).toHaveLength(morning.exerciseIds.length);
    resolved.forEach(ex => expect(ex).toBeDefined());
  });

  it('all IDs in the anytime preset resolve to exercises', () => {
    const anytime = PRESETS.find(p => p.id === 'anytime')!;
    const resolved = getPresetExercises(anytime);
    expect(resolved).toHaveLength(anytime.exerciseIds.length);
    resolved.forEach(ex => expect(ex).toBeDefined());
  });

  it('all IDs in the evening preset resolve to exercises', () => {
    const evening = PRESETS.find(p => p.id === 'evening')!;
    const resolved = getPresetExercises(evening);
    expect(resolved).toHaveLength(evening.exerciseIds.length);
    resolved.forEach(ex => expect(ex).toBeDefined());
  });

  it('morning preset contains exactly 6 exercises', () => {
    const morning = PRESETS.find(p => p.id === 'morning')!;
    const resolved = getPresetExercises(morning);
    expect(resolved).toHaveLength(6);
  });

  it('resolved exercise IDs match the preset IDs (no silent drops)', () => {
    for (const preset of PRESETS) {
      const resolved = getPresetExercises(preset);
      const resolvedIds = resolved.map(e => e.id);
      expect(resolvedIds).toEqual(preset.exerciseIds);
    }
  });

  it('all exercise IDs referenced in presets exist in the exercises list', () => {
    const exerciseIds = new Set(exercises.map(e => e.id));
    for (const preset of PRESETS) {
      for (const id of preset.exerciseIds) {
        expect(exerciseIds.has(id), `Exercise ID "${id}" in preset "${preset.id}" not found`).toBe(true);
      }
    }
  });
});

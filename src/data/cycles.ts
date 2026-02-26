import type { Exercise } from './exercises';
import { exercises } from './exercises';

export type PresetId = 'morning' | 'anytime' | 'evening';

export interface CyclePreset {
  id: PresetId;
  label: string;
  emoji: string;
  tagline: string;
  exerciseIds: string[];
}

export const PRESETS: CyclePreset[] = [
  {
    id: 'morning',
    label: 'Morning',
    emoji: '🌅',
    tagline: 'Before your first steps — reduces that sharp morning pain',
    exerciseIds: ['toe-extension', 'towel-stretch', 'calf-straight', 'calf-bent', 'ankle-circles'],
  },
  {
    id: 'anytime',
    label: 'Anytime',
    emoji: '🌿',
    tagline: 'General maintenance — fits into any part of your day',
    exerciseIds: ['calf-straight', 'calf-bent', 'ankle-alphabet', 'toe-spread'],
  },
  {
    id: 'evening',
    label: 'Evening',
    emoji: '🌙',
    tagline: 'Wind down and recover after a day on your feet',
    exerciseIds: ['bottle-roll', 'calf-straight', 'calf-bent', 'toe-scrunch', 'heel-raise', 'short-foot'],
  },
];

export function getPresetExercises(preset: CyclePreset): Exercise[] {
  return preset.exerciseIds
    .map(id => exercises.find(e => e.id === id))
    .filter((e): e is Exercise => e !== undefined);
}

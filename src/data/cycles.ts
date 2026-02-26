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

export interface CustomCycle {
  id: string;
  label: string;
  emoji: string;
  exerciseIds: string[];
  createdAt: string;
}

export const PRESETS: CyclePreset[] = [
  {
    id: 'morning',
    label: 'Morning',
    emoji: '🌅',
    tagline: 'Before your first steps — reduces that sharp morning pain',
    exerciseIds: [
      'toe-extension',    // plantar fascia stretch before standing
      'towel-stretch',    // calf + arch lengthening
      'calf-straight',    // gastrocnemius release
      'calf-bent',        // soleus release
      'ankle-circles',    // gentle warm-up
      'knee-to-wall',     // dorsiflexion mobility — key for morning stiffness
    ],
  },
  {
    id: 'anytime',
    label: 'Rehab',
    emoji: '💪',
    tagline: 'Core strengthening — do this daily to rebuild the foot and hip',
    exerciseIds: [
      'toe-spread',            // neuromuscular control
      'ankle-alphabet',        // joint mobility maintenance
      'eccentric-heel-drop',   // Alfredson protocol — gold standard
      'standing-heel-raise',   // progressive load
      'short-foot',            // intrinsic arch activation
      'clamshell',             // hip abductor — corrects faulty load patterns
    ],
  },
  {
    id: 'evening',
    label: 'Evening',
    emoji: '🌙',
    tagline: 'Wind down and recover after a day on your feet',
    exerciseIds: [
      'calf-straight',     // end-of-day calf release
      'calf-bent',         // soleus release
      'tennis-ball-roll',  // accessible self-massage
      'bottle-roll',       // cold + fascial release
      'toe-scrunch',       // intrinsic muscle activation
      'marble-pickups',    // coordination + intrinsic strength
      'heel-raise',        // seated — gentle close-out
    ],
  },
];

export function getPresetExercises(preset: CyclePreset): Exercise[] {
  return preset.exerciseIds
    .map(id => exercises.find(e => e.id === id))
    .filter((e): e is Exercise => e !== undefined);
}

export function getCustomCycleExercises(cycle: CustomCycle): Exercise[] {
  return cycle.exerciseIds
    .map(id => exercises.find(e => e.id === id))
    .filter((e): e is Exercise => e !== undefined);
}

export function getQuickStartPreset(hour: number): CyclePreset {
  if (hour >= 5 && hour < 10) return PRESETS.find(p => p.id === 'morning')!;
  if (hour >= 10 && hour < 18) return PRESETS.find(p => p.id === 'anytime')!;
  return PRESETS.find(p => p.id === 'evening')!;
}

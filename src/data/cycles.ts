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
      'ankle-circles',    // gentle warm-up
      'towel-stretch',    // calf + arch lengthening
      'calf-straight',    // gastrocnemius release
      'calf-bent',        // soleus release
      'knee-to-wall',     // dorsiflexion mobility — key for morning stiffness
    ],
  },
  {
    id: 'anytime',
    label: 'Rehab',
    emoji: '💪',
    tagline: 'Core strengthening — do this daily to rebuild the foot and hip',
    exerciseIds: [
      'eccentric-heel-drop',   // Alfredson protocol — gold standard
      'standing-heel-raise',   // progressive load
      'short-foot',            // intrinsic arch activation
      'toe-spread',            // neuromuscular control
      'clamshell',             // hip abductor — corrects faulty load patterns
      'ankle-alphabet',        // joint mobility maintenance
    ],
  },
  {
    id: 'evening',
    label: 'Evening',
    emoji: '🌙',
    tagline: 'Wind down and recover after a day on your feet',
    exerciseIds: [
      'tennis-ball-roll',  // accessible self-massage
      'bottle-roll',       // cold + fascial release
      'calf-straight',     // end-of-day calf release
      'calf-bent',         // soleus release
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

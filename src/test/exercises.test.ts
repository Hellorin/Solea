import { describe, it, expect } from 'vitest';
import { exercises } from '../data/exercises';

// Mirror of the helper in Cycle.tsx for testing deduplication
function getUniqueEquipment(exList: typeof exercises): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const ex of exList) {
    for (const item of ex.equipment ?? []) {
      if (!seen.has(item)) { seen.add(item); result.push(item); }
    }
  }
  return result;
}

function findExercise(id: string) {
  const ex = exercises.find(e => e.id === id);
  if (!ex) throw new Error(`Exercise not found: ${id}`);
  return ex;
}

describe('Exercise equipment field', () => {
  it('towel-stretch requires a Towel', () => {
    expect(findExercise('towel-stretch').equipment).toEqual(['Towel']);
  });

  it('bottle-roll requires a Frozen water bottle', () => {
    expect(findExercise('bottle-roll').equipment).toEqual(['Frozen water bottle']);
  });

  it('tennis-ball-roll requires a Tennis ball or golf ball', () => {
    expect(findExercise('tennis-ball-roll').equipment).toEqual(['Tennis ball or golf ball']);
  });

  it('toe-scrunch requires a Towel', () => {
    expect(findExercise('toe-scrunch').equipment).toEqual(['Towel']);
  });

  it('heel-raise requires a Chair', () => {
    expect(findExercise('heel-raise').equipment).toEqual(['Chair']);
  });

  it('eccentric-heel-drop requires a Step or stair edge', () => {
    expect(findExercise('eccentric-heel-drop').equipment).toEqual(['Step or stair edge']);
  });

  it('marble-pickups requires Marbles and Small bowl', () => {
    expect(findExercise('marble-pickups').equipment).toEqual(['Marbles', 'Small bowl']);
  });

  it('exercises with equipment have a non-empty array', () => {
    const withEquipment = exercises.filter(ex => ex.equipment !== undefined);
    for (const ex of withEquipment) {
      expect(ex.equipment!.length).toBeGreaterThan(0);
    }
  });

  it('exercises without equipment field have no equipment', () => {
    const noEquipmentIds = ['toe-extension', 'calf-straight', 'calf-bent', 'ankle-alphabet', 'ankle-circles', 'toe-spread', 'short-foot', 'standing-heel-raise', 'knee-to-wall', 'clamshell'];
    for (const id of noEquipmentIds) {
      const ex = exercises.find(e => e.id === id);
      if (ex) {
        expect(ex.equipment ?? []).toHaveLength(0);
      }
    }
  });
});

describe('getUniqueEquipment', () => {
  it('deduplicates Towel that appears in both towel-stretch and toe-scrunch', () => {
    const towelStretch = findExercise('towel-stretch');
    const toeScrunch = findExercise('toe-scrunch');
    const unique = getUniqueEquipment([towelStretch, toeScrunch]);
    expect(unique).toEqual(['Towel']);
    expect(unique.length).toBe(1);
  });

  it('returns empty array for exercises with no equipment', () => {
    const noEquipmentExercises = exercises.filter(ex => !ex.equipment?.length);
    expect(getUniqueEquipment(noEquipmentExercises)).toEqual([]);
  });

  it('collects multiple unique items across exercises', () => {
    const bottleRoll = findExercise('bottle-roll');
    const marblePickups = findExercise('marble-pickups');
    const unique = getUniqueEquipment([bottleRoll, marblePickups]);
    expect(unique).toContain('Frozen water bottle');
    expect(unique).toContain('Marbles');
    expect(unique).toContain('Small bowl');
    expect(unique.length).toBe(3);
  });
});

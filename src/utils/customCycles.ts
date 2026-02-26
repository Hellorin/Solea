import type { CustomCycle } from '../data/cycles';
import type { Category } from '../data/exercises';
import { exercises } from '../data/exercises';

const KEY = 'custom_cycles';

export function loadCustomCycles(): CustomCycle[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomCycle[];
  } catch {
    return [];
  }
}

export function saveCustomCycle(cycle: CustomCycle): void {
  try {
    const existing = loadCustomCycles();
    const idx = existing.findIndex(c => c.id === cycle.id);
    if (idx >= 0) {
      existing[idx] = cycle;
    } else {
      existing.push(cycle);
    }
    localStorage.setItem(KEY, JSON.stringify(existing));
  } catch {
    // quota exceeded — ignore
  }
}

export function deleteCustomCycle(id: string): void {
  const existing = loadCustomCycles();
  const filtered = existing.filter(c => c.id !== id);
  localStorage.setItem(KEY, JSON.stringify(filtered));
}

const CATEGORY_ORDER: Record<Category, number> = { stretching: 0, mobility: 1, strengthening: 2 };

export function sortByPTProtocol(exerciseIds: string[]): string[] {
  return [...exerciseIds].sort((a, b) =>
    CATEGORY_ORDER[exercises.find(e => e.id === a)!.category] -
    CATEGORY_ORDER[exercises.find(e => e.id === b)!.category]
  );
}

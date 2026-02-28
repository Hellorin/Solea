import type { CustomCycle } from '../data/cycles';
import type { Category } from '../data/exercises';
import { exercises } from '../data/exercises';

const KEY = 'custom_cycles';

export async function loadCustomCycles(): Promise<CustomCycle[]> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomCycle[];
  } catch {
    return [];
  }
}

export async function saveCustomCycle(cycle: CustomCycle): Promise<void> {
  try {
    const existing = await loadCustomCycles();
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

export async function renameCustomCycle(id: string, newLabel: string): Promise<void> {
  const existing = await loadCustomCycles();
  const idx = existing.findIndex(c => c.id === id);
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], label: newLabel };
    localStorage.setItem(KEY, JSON.stringify(existing));
  }
}

export async function deleteCustomCycle(id: string): Promise<void> {
  const existing = await loadCustomCycles();
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

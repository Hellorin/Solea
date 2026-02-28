import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadCustomCycles,
  saveCustomCycle,
  deleteCustomCycle,
  sortByPTProtocol,
} from '../utils/customCycles';
import type { CustomCycle } from '../data/cycles';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

beforeEach(() => localStorageMock.clear());

function makeCycle(id: string, label = 'Test'): CustomCycle {
  return { id, label, emoji: '✨', exerciseIds: [], createdAt: '2024-01-01T00:00:00.000Z' };
}

describe('loadCustomCycles', () => {
  it('returns [] when localStorage key is missing', async () => {
    expect(await loadCustomCycles()).toEqual([]);
  });

  it('returns [] on malformed JSON (does not throw)', async () => {
    localStorageMock.setItem('custom_cycles', 'not-valid{{{');
    expect(await loadCustomCycles()).toEqual([]);
  });

  it('returns parsed array on valid JSON', async () => {
    const cycle = makeCycle('1');
    localStorageMock.setItem('custom_cycles', JSON.stringify([cycle]));
    expect(await loadCustomCycles()).toEqual([cycle]);
  });
});

describe('saveCustomCycle', () => {
  it('saves a new cycle (loadCustomCycles returns it)', async () => {
    const cycle = makeCycle('abc');
    await saveCustomCycle(cycle);
    expect(await loadCustomCycles()).toEqual([cycle]);
  });

  it('upserts an existing cycle by id (replaces, does not duplicate)', async () => {
    const original = makeCycle('x', 'Original');
    const updated = makeCycle('x', 'Updated');
    await saveCustomCycle(original);
    await saveCustomCycle(updated);
    const all = await loadCustomCycles();
    expect(all).toHaveLength(1);
    expect(all[0].label).toBe('Updated');
  });

  it('does not throw on quota exceeded', async () => {
    const spy = vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    await expect(saveCustomCycle(makeCycle('q'))).resolves.not.toThrow();
    spy.mockRestore();
  });
});

describe('deleteCustomCycle', () => {
  it('removes the correct cycle by id, leaves others intact', async () => {
    await saveCustomCycle(makeCycle('1'));
    await saveCustomCycle(makeCycle('2'));
    await deleteCustomCycle('1');
    const remaining = await loadCustomCycles();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('2');
  });

  it('is a no-op when id not found', async () => {
    await saveCustomCycle(makeCycle('1'));
    await deleteCustomCycle('nonexistent');
    expect(await loadCustomCycles()).toHaveLength(1);
  });
});

describe('sortByPTProtocol', () => {
  it('sorts stretching before mobility before strengthening', () => {
    // toe-scrunch=strengthening, ankle-alphabet=mobility, toe-extension=stretching
    const result = sortByPTProtocol(['toe-scrunch', 'ankle-alphabet', 'toe-extension']);
    expect(result).toEqual(['toe-extension', 'ankle-alphabet', 'toe-scrunch']);
  });

  it('preserves relative order within same category (stable sort)', () => {
    // calf-straight and calf-bent are both stretching
    const result = sortByPTProtocol(['calf-straight', 'calf-bent']);
    expect(result).toEqual(['calf-straight', 'calf-bent']);
  });

  it('works with a single id', () => {
    expect(sortByPTProtocol(['heel-raise'])).toEqual(['heel-raise']);
  });

  it('returns a new array (does not mutate input)', () => {
    const input = ['toe-scrunch', 'toe-extension'];
    const result = sortByPTProtocol(input);
    expect(result).not.toBe(input);
    // input should be unchanged
    expect(input).toEqual(['toe-scrunch', 'toe-extension']);
  });
});

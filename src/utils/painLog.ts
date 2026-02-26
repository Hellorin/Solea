export type PainEntry = { date: string; level: number };

const KEY = 'pain_log';

export function loadPainLog(): PainEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getTodayPain(today: string): number | null {
  const log = loadPainLog();
  const entry = log.find((e) => e.date === today);
  return entry ? entry.level : null;
}

export function savePainEntry(date: string, level: number): void {
  const log = loadPainLog();
  const idx = log.findIndex((e) => e.date === date);
  if (idx >= 0) {
    log[idx] = { date, level };
  } else {
    log.push({ date, level });
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch {
    // localStorage unavailable or quota exceeded — silently no-op
  }
}

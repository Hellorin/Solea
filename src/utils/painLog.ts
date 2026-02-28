export type PainEntry = { date: string; level: number };

const KEY = 'pain_log';

export async function loadPainLog(): Promise<PainEntry[]> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getTodayPain(today: string): Promise<number | null> {
  const log = await loadPainLog();
  const entry = log.find((e) => e.date === today);
  return entry ? entry.level : null;
}

export async function savePainEntry(date: string, level: number): Promise<void> {
  const log = await loadPainLog();
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

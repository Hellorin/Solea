const STORAGE_KEY = 'reminder_times';

export function loadTimes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveTimes(times: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(times));
  } catch {
    // localStorage unavailable or quota exceeded — silently no-op
  }
}

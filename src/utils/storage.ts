const STORAGE_KEY = 'reminder_times';

export async function loadTimes(): Promise<string[]> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export async function saveTimes(times: string[]): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(times));
  } catch {
    // localStorage unavailable or quota exceeded — silently no-op
  }
}

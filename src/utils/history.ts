export type Session = { date: string; secs: number; exerciseCount: number; time: string };

const KEY = 'plantar_history';

export async function loadHistory(): Promise<Session[]> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveSession(secs: number, exerciseCount: number): Promise<void> {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  const history = await loadHistory();
  history.push({ date, secs, exerciseCount, time });
  try {
    localStorage.setItem(KEY, JSON.stringify(history));
  } catch {
    // localStorage unavailable or quota exceeded — silently no-op
  }
}

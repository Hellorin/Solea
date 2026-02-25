export type Session = { date: string; secs: number; exerciseCount: number; time: string };

const KEY = 'plantar_history';

export function loadHistory(): Session[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(secs: number, exerciseCount: number): void {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const history = loadHistory();
  history.push({ date, secs, exerciseCount, time });
  localStorage.setItem(KEY, JSON.stringify(history));
}

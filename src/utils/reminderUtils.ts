export function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getNextReminder(times: string[], now: Date = new Date()): string | null {
  if (times.length === 0) return null;
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const sorted = [...times].sort((a, b) => a.localeCompare(b));
  for (const t of sorted) {
    const [h, m] = t.split(':').map(Number);
    const mins = h * 60 + m;
    if (mins > currentMins) return t;
  }
  return sorted[0]; // wrap to first of next day
}

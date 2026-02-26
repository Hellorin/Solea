export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in globalThis)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function supportsScheduledNotifications(): boolean {
  return 'TimestampTrigger' in globalThis;
}

const DAYS_AHEAD = 30;

/**
 * Pre-schedule notifications for every reminder time over the next DAYS_AHEAD days.
 * Uses the Notification Triggers API (Chrome/Chromium) so notifications fire even
 * when the app is fully closed.
 * Clears any previously scheduled notifications before rescheduling.
 */
export async function scheduleNotifications(times: string[]): Promise<void> {
  if (!('serviceWorker' in navigator) || !supportsScheduledNotifications()) return;
  if (Notification.permission !== 'granted') return;

  const reg = await navigator.serviceWorker.ready;

  // Clear all previously scheduled (pending-trigger) notifications.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing: Notification[] = await (reg as any).getNotifications({ includeTriggered: true });
  existing.forEach(n => n.close());

  if (times.length === 0) return;

  const now = Date.now();

  for (const time of times) {
    if (!/^\d{1,2}:\d{2}$/.test(time)) continue;
    const [hours, minutes] = time.split(':').map(Number);
    if (hours > 23 || minutes > 59) continue;

    for (let day = 0; day < DAYS_AHEAD; day++) {
      const trigger = new Date();
      trigger.setDate(trigger.getDate() + day);
      trigger.setHours(hours, minutes, 0, 0);

      if (trigger.getTime() <= now) continue; // already passed, skip

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (reg as any).showNotification('Time to stretch! 🦶', {
        body: 'A quick plantar fascia stretch now can save you pain later.',
        icon: '/icons/icon-192.png',
        tag: `stretch-${time.replace(':', '')}-d${day}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        showTrigger: new (globalThis as any).TimestampTrigger(trigger.getTime()),
      });
    }
  }
}

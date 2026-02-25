export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function checkAndNotify(times: string[]) {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (times.includes(hhmm) && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification('Time to stretch! 🦶', {
        body: 'A quick plantar fascia stretch now can save you pain later.',
        icon: '/icons/icon-192.png',
        tag: 'stretch-reminder',
      });
    });
  }
}

export function startReminderChecker(times: string[]): () => void {
  checkAndNotify(times); // immediate check in case app opened at reminder minute
  const interval = setInterval(() => checkAndNotify(times), 60_000);
  return () => clearInterval(interval);
}

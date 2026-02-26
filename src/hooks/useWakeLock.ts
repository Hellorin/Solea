import { useCallback, useEffect, useRef } from 'react';

export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  const acquire = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    if (sentinelRef.current && !sentinelRef.current.released) return;
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen');
    } catch { /* device rejected or document hidden — silently ignore */ }
  }, []);

  const release = useCallback(async () => {
    if (sentinelRef.current && !sentinelRef.current.released) {
      try { await sentinelRef.current.release(); } catch { /* already released */ }
    }
    sentinelRef.current = null;
  }, []);

  // Acquire/release as `active` toggles (start, pause, resume, done, pick).
  useEffect(() => {
    if (active) { acquire(); } else { release(); }
    return () => { release(); };   // unmount cleanup
  }, [active, acquire, release]);

  // Re-acquire after page returns to foreground (browser auto-releases on hide).
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'visible' && activeRef.current) acquire();
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [acquire]);
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestPermission, supportsScheduledNotifications } from '../utils/notifications';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('requestPermission', () => {
  it('returns false when Notification API is not available', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'Notification');
    Reflect.deleteProperty(window, 'Notification');
    const result = await requestPermission();
    expect(result).toBe(false);
    if (original) Object.defineProperty(window, 'Notification', original);
  });

  it('returns true when permission is granted', async () => {
    vi.stubGlobal('Notification', {
      requestPermission: vi.fn().mockResolvedValue('granted'),
      permission: 'default',
    });
    const result = await requestPermission();
    expect(result).toBe(true);
  });

  it('returns false when permission is denied', async () => {
    vi.stubGlobal('Notification', {
      requestPermission: vi.fn().mockResolvedValue('denied'),
      permission: 'default',
    });
    const result = await requestPermission();
    expect(result).toBe(false);
  });

  it('returns false when permission is default (not granted)', async () => {
    vi.stubGlobal('Notification', {
      requestPermission: vi.fn().mockResolvedValue('default'),
      permission: 'default',
    });
    const result = await requestPermission();
    expect(result).toBe(false);
  });
});

describe('supportsScheduledNotifications', () => {
  it('returns true when TimestampTrigger is in window', () => {
    vi.stubGlobal('TimestampTrigger', class {});
    expect(supportsScheduledNotifications()).toBe(true);
  });

  it('returns false when TimestampTrigger is not in window', () => {
    // ensure it is absent
    const win = (window as unknown) as Record<string, unknown>;
    delete win['TimestampTrigger'];
    expect(supportsScheduledNotifications()).toBe(false);
  });
});

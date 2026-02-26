import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWakeLock } from '../hooks/useWakeLock';

describe('useWakeLock', () => {
  let mockRelease: ReturnType<typeof vi.fn>;
  let mockRequest: ReturnType<typeof vi.fn>;
  let mockSentinel: { released: boolean; release: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockRelease = vi.fn().mockResolvedValue(undefined);
    mockSentinel = { released: false, release: mockRelease };
    mockRequest = vi.fn().mockResolvedValue(mockSentinel);

    Object.defineProperty(navigator, 'wakeLock', {
      value: { request: mockRequest },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock');
    vi.restoreAllMocks();
  });

  it('does nothing when wakeLock API is not supported', async () => {
    Reflect.deleteProperty(navigator, 'wakeLock');

    await act(async () => {
      renderHook(() => useWakeLock(true));
    });

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('acquires wake lock when active is true', async () => {
    await act(async () => {
      renderHook(() => useWakeLock(true));
    });

    expect(mockRequest).toHaveBeenCalledWith('screen');
  });

  it('does not acquire wake lock when active is false', async () => {
    await act(async () => {
      renderHook(() => useWakeLock(false));
    });

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('releases wake lock when active transitions from true to false', async () => {
    let active = true;
    const { rerender } = renderHook(() => useWakeLock(active));

    await act(async () => {});
    expect(mockRequest).toHaveBeenCalledTimes(1);

    active = false;
    await act(async () => { rerender(); });

    expect(mockRelease).toHaveBeenCalled();
  });

  it('releases wake lock on unmount', async () => {
    const { unmount } = renderHook(() => useWakeLock(true));

    await act(async () => {});
    expect(mockRequest).toHaveBeenCalledTimes(1);

    await act(async () => { unmount(); });

    expect(mockRelease).toHaveBeenCalled();
  });

  it('re-acquires wake lock when page returns to foreground while active', async () => {
    renderHook(() => useWakeLock(true));

    await act(async () => {});
    expect(mockRequest).toHaveBeenCalledTimes(1);

    // Simulate browser auto-releasing the sentinel (e.g. on page hide)
    mockSentinel.released = true;

    // Simulate page returning to foreground
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it('does not re-acquire wake lock on visibilitychange when not active', async () => {
    renderHook(() => useWakeLock(false));

    await act(async () => {});

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockRequest).not.toHaveBeenCalled();
  });
});

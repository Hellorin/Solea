import type { PresetId } from '../data/cycles';

export interface Recommendation {
  presetId: PresetId;
  reason: string;
  reasonEmoji: string;
}

export interface RecommendationInput {
  /** Today's logged pain level (1–5), or null if not yet logged */
  painLevel: number | null;
  /** Current consecutive-day streak */
  streak: number;
  /** Number of sessions completed this week */
  weeklyCount: number;
  /** Current hour (0–23), used as time-of-day fallback */
  hour: number;
}

/**
 * Recommends a cycle preset based on the user's pain level, streak,
 * weekly session count, and time of day — in that priority order.
 *
 * Pain level takes highest priority:
 *   4–5 → Morning (gentle stretching, no strengthening)
 *   3   → Evening (stretching + massage, skip heavy load)
 *   1–2 → Rehab   (strengthening — good day to push)
 *
 * If no pain is logged, streak/frequency inform the suggestion:
 *   streak 0 + low weekly count → Morning (ease back in)
 *
 * Falls back to time-of-day preset otherwise.
 */
export function recommendCycle(input: RecommendationInput): Recommendation {
  const { painLevel, streak, weeklyCount, hour } = input;

  if (painLevel !== null) {
    if (painLevel >= 4) {
      return {
        presetId: 'morning',
        reason: 'High pain today — gentle stretching only',
        reasonEmoji: '🤕',
      };
    }
    if (painLevel === 3) {
      return {
        presetId: 'evening',
        reason: 'Moderate pain — stretching and massage will help',
        reasonEmoji: '😬',
      };
    }
    // painLevel 1–2
    return {
      presetId: 'anytime',
      reason: 'Low pain — great day to strengthen your foot',
      reasonEmoji: '💪',
    };
  }

  // No pain logged — use engagement signals
  if (streak === 0 && weeklyCount === 0) {
    return {
      presetId: 'morning',
      reason: 'Getting back on track — start with the gentlest routine',
      reasonEmoji: '🌱',
    };
  }

  // Time-of-day fallback
  return getTimeBasedRecommendation(hour);
}

function getTimeBasedRecommendation(hour: number): Recommendation {
  if (hour >= 5 && hour < 10) {
    return {
      presetId: 'morning',
      reason: 'Morning routine — reduces that sharp first-step pain',
      reasonEmoji: '🌅',
    };
  }
  if (hour >= 10 && hour < 18) {
    return {
      presetId: 'anytime',
      reason: 'Midday rehab — build strength while the day is ahead of you',
      reasonEmoji: '☀️',
    };
  }
  return {
    presetId: 'evening',
    reason: 'Evening wind-down — recover after a day on your feet',
    reasonEmoji: '🌙',
  };
}

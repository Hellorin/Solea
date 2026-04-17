export type PainEmoji = { level: number; emoji: string; label: string };

export const PAIN_EMOJIS: PainEmoji[] = [
  { level: 1, emoji: '😌', label: 'No pain' },
  { level: 2, emoji: '😐', label: 'Mild pain' },
  { level: 3, emoji: '😬', label: 'Moderate pain' },
  { level: 4, emoji: '😣', label: 'Quite painful' },
  { level: 5, emoji: '😭', label: 'Severe pain' },
];

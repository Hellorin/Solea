import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PAIN_EMOJIS } from '../data/pain';
import {
  loadProgram,
  saveProgram,
  computeNextDay,
  type Feedback,
} from '../utils/rehabProgram';
import { savePainEntry } from '../utils/painLog';
import { toLocalDateStr } from '../utils/statsUtils';
import styles from './RehabCheckin.module.css';

const FEEDBACK_OPTIONS: { value: Feedback; emoji: string; label: string; cls: string }[] = [
  { value: 'worse', emoji: '😣', label: 'Worse', cls: 'worse' },
  { value: 'same', emoji: '😐', label: 'Same', cls: 'same' },
  { value: 'better', emoji: '🙂', label: 'Better', cls: 'better' },
];

export default function RehabCheckin() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pain, setPain] = useState<number | null>(null);

  function handleSave() {
    if (feedback === null || pain === null) return;
    const program = loadProgram();
    if (!program || !program.active) {
      navigate('/rehab');
      return;
    }
    const today = toLocalDateStr(new Date());
    const updated = computeNextDay(program, feedback, pain, today);
    saveProgram(updated);
    savePainEntry(today, pain);
    navigate('/rehab');
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/rehab')}>← Back</button>
        <h1 className={styles.title}>How are you feeling?</h1>
        <p className={styles.subtitle}>This picks the right exercises for your next session.</p>
      </div>
      <div className={styles.content}>
        <div>
          <p className={styles.question}>Compared to yesterday, your foot feels:</p>
          <div className={styles.feedbackRow}>
            {FEEDBACK_OPTIONS.map(({ value, emoji, label, cls }) => {
              const selected = feedback === value;
              return (
                <button
                  key={value}
                  className={[
                    styles.feedbackBtn,
                    styles[cls],
                    selected ? styles.selected : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setFeedback(value)}
                  aria-pressed={selected}
                >
                  <span className={styles.feedbackEmoji}>{emoji}</span>
                  <span className={styles.feedbackLabel}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className={styles.question}>Pain level right now:</p>
          <div className={styles.painRow}>
            {PAIN_EMOJIS.map(({ level, emoji, label }) => (
              <button
                key={level}
                className={`${styles.painBtn} ${pain === level ? styles.painBtnSelected : ''}`}
                onClick={() => setPain(level)}
                aria-label={label}
                aria-pressed={pain === level}
              >
                {emoji}
              </button>
            ))}
          </div>
          <p className={styles.painLabel}>
            {pain !== null ? PAIN_EMOJIS[pain - 1].label : ''}
          </p>
        </div>

        <button
          className={styles.btnPrimary}
          onClick={handleSave}
          disabled={feedback === null || pain === null}
        >
          Save check-in
        </button>
      </div>
    </div>
  );
}

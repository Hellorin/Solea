import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PAIN_EMOJIS } from '../data/pain';
import {
  createProgram,
  loadProgram,
  saveProgram,
  hasActiveProgram,
  type Duration,
} from '../utils/rehabProgram';
import { savePainEntry } from '../utils/painLog';
import { toLocalDateStr } from '../utils/statsUtils';
import styles from './RehabOnboarding.module.css';

type Step = 1 | 2;

const DURATION_CHOICES: { value: Duration; label: string; sub: string }[] = [
  { value: 'acute', label: 'Less than 2 weeks', sub: 'Recent or flaring up' },
  { value: 'subacute', label: '2 to 6 weeks', sub: 'Hanging around for a while' },
  { value: 'chronic', label: 'More than 6 weeks', sub: 'Long-standing pain' },
];

export default function RehabOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [pain, setPain] = useState<number | null>(null);
  const [duration, setDuration] = useState<Duration | null>(null);

  function handleBack() {
    if (step === 1) navigate('/rehab');
    else setStep(1);
  }

  function handleFinish() {
    if (pain === null || duration === null) return;
    if (hasActiveProgram()) {
      const existing = loadProgram();
      const msg = existing?.active
        ? 'You already have an active program. Replace it with a new one?'
        : '';
      if (msg && !globalThis.confirm(msg)) return;
    }
    const today = toLocalDateStr(new Date());
    const program = createProgram({ initialPain: pain, duration }, today);
    saveProgram(program);
    savePainEntry(today, pain);
    navigate('/rehab');
  }

  if (step === 1) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={handleBack}>← Back</button>
          <h1 className={styles.title}>Let's plan your recovery</h1>
          <div className={styles.stepIndicator}>Step 1 of 2</div>
        </div>
        <div className={styles.content}>
          <p className={styles.question}>How painful is your foot right now?</p>
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
          <button
            className={styles.btnPrimary}
            onClick={() => setStep(2)}
            disabled={pain === null}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>← Back</button>
        <h1 className={styles.title}>How long has the pain been there?</h1>
        <div className={styles.stepIndicator}>Step 2 of 2</div>
      </div>
      <div className={styles.content}>
        <div className={styles.choiceList}>
          {DURATION_CHOICES.map(({ value, label, sub }) => (
            <button
              key={value}
              className={`${styles.choice} ${duration === value ? styles.choiceSelected : ''}`}
              onClick={() => setDuration(value)}
              aria-pressed={duration === value}
            >
              <span className={styles.choiceLabel}>{label}</span>
              <span className={styles.choiceSub}>{sub}</span>
            </button>
          ))}
        </div>
        <button
          className={styles.btnPrimary}
          onClick={handleFinish}
          disabled={duration === null}
        >
          Start my 30-day program
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { Exercise } from '../data/exercises';
import styles from './ExerciseCard.module.css';

interface Props {
  exercise: Exercise;
}

export default function ExerciseCard({ exercise }: Props) {
  const [open, setOpen] = useState(false);
  const bodyId = `exercise-body-${exercise.id}`;

  return (
    <div className={`${styles.card} ${open ? styles.expanded : ''}`}>
      <button
        className={styles.header}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <span className={styles.name}>{exercise.name}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>›</span>
      </button>

      <div id={bodyId} className={styles.body} style={{ maxHeight: open ? '1000px' : '0' }}>
        <div className={styles.bodyInner}>
          <img
            src={exercise.image}
            alt={exercise.name}
            className={styles.image}
            loading="lazy"
          />

          <div className={styles.meta}>
            <span className={styles.badge}>{exercise.duration}</span>
            <span className={styles.badge}>{exercise.reps}</span>
          </div>

          <ol className={styles.steps}>
            {exercise.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          {exercise.tip && (
            <p className={styles.tip}>
              <strong>Tip:</strong> {exercise.tip}
            </p>
          )}

          {exercise.acuteWarning && (
            <div className={styles.warning}>
              <strong>⚠ Acute phase:</strong> {exercise.acuteWarning}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { exercises } from '../data/exercises';
import type { Category } from '../data/exercises';
import ExerciseCard from '../components/ExerciseCard';
import styles from './Guide.module.css';

interface Section {
  key: Category;
  label: string;
  icon: string;
  note?: string;
}

const sections: Section[] = [
  { key: 'stretching', label: 'Stretching', icon: '🧘' },
  { key: 'mobility', label: 'Mobility', icon: '🔄' },
  {
    key: 'strengthening',
    label: 'Strengthening',
    icon: '💪',
    note: 'Acute phase: These are low-load and non-weight-bearing. Goal is gentle activation only. Skip any exercise that causes increased pain.',
  },
];

export default function Guide() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Exercise Guide</h1>
        <p className={styles.subtitle}>Tap any exercise to expand it</p>
      </div>

      <div className={styles.content}>
        {sections.map(section => (
          <div key={section.key} className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span>{section.icon}</span> {section.label}
            </h2>

            {section.note && (
              <div className={styles.sectionNote}>
                <span>⚠</span> {section.note}
              </div>
            )}

            <div className={styles.cards}>
              {exercises
                .filter(ex => ex.category === section.key)
                .map(ex => (
                  <ExerciseCard key={ex.id} exercise={ex} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

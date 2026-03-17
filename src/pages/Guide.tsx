import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const hasQuery = q.length > 0;
  const anyResults = hasQuery && exercises.some(ex => ex.name.toLowerCase().includes(q));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Exercise Guide</h1>
        <p className={styles.subtitle}>Tap any exercise to expand it</p>
      </div>

      <div className={styles.content}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search exercises…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search exercises"
        />

        <button className={styles.startBtn} onClick={() => navigate('/cycle')}>
          ▶ Start Cycle
        </button>

        {hasQuery && !anyResults && (
          <p className={styles.emptySearch}>No exercises match "{query.trim()}"</p>
        )}

        {sections.map(section => {
          const sectionExercises = exercises.filter(ex =>
            ex.category === section.key &&
            (!hasQuery || ex.name.toLowerCase().includes(q))
          );
          if (sectionExercises.length === 0) return null;
          return (
            <div key={section.key} className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span>{section.icon}</span> {section.label}
              </h2>

              {!hasQuery && section.note && (
                <div className={styles.sectionNote}>
                  <span>⚠</span> {section.note}
                </div>
              )}

              <div className={styles.cards}>
                {sectionExercises.map(ex => (
                  <ExerciseCard key={ex.id} exercise={ex} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

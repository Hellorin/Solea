import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exercises } from '../data/exercises';
import type { Category } from '../data/exercises';
import type { CustomCycle } from '../data/cycles';
import { saveCustomCycle, sortByPTProtocol } from '../utils/customCycles';
import styles from './CycleBuilder.module.css';

type Step = 1 | 2 | 3;

const EMOJIS = ['✨', '🌿', '🔥', '💪', '🧘', '🌅'];
const CATEGORIES: Category[] = ['stretching', 'mobility', 'strengthening'];

const categoryLabel: Record<Category, string> = {
  stretching: 'Stretching',
  mobility: 'Mobility',
  strengthening: 'Strengthening',
};

const categoryClass: Record<Category, string> = {
  stretching: 'catStretching',
  mobility: 'catMobility',
  strengthening: 'catStrengthening',
};

export default function CycleBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  function handleAdvanceToStep3() {
    setOrderedIds([...selectedIds]);
    setStep(3);
  }

  function toggleExercise(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...orderedIds];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setOrderedIds(updated);
  }

  function moveDown(index: number) {
    if (index === orderedIds.length - 1) return;
    const updated = [...orderedIds];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setOrderedIds(updated);
  }

  function handleSortByPT() {
    setOrderedIds(sortByPTProtocol(orderedIds));
  }

  async function handleSave() {
    const cycle: CustomCycle = {
      id: Date.now().toString(),
      label: name.trim(),
      emoji,
      exerciseIds: orderedIds,
      createdAt: new Date().toISOString(),
    };
    await saveCustomCycle(cycle);
    navigate('/cycle');
  }

  // Step 1 — Name & emoji
  if (step === 1) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/cycle')}>← Back</button>
          <h1 className={styles.title}>New Cycle</h1>
          <div className={styles.stepIndicator}>Step 1 of 3</div>
        </div>
        <div className={styles.content}>
          <div className={styles.section}>
            <label className={styles.label} htmlFor="cycle-name">Name your cycle</label>
            <input
              id="cycle-name"
              className={styles.input}
              type="text"
              placeholder="e.g. Quick Morning"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.section}>
            <label className={styles.label}>Choose an emoji</label>
            <div className={styles.emojiRow}>
              {EMOJIS.map(e => (
                <button
                  key={e}
                  className={`${styles.emojiBtn} ${emoji === e ? styles.emojiBtnSelected : ''}`}
                  onClick={() => setEmoji(e)}
                  aria-pressed={emoji === e}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <button
            className={styles.btnPrimary}
            onClick={() => setStep(2)}
            disabled={name.trim().length === 0}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 2 — Select exercises
  if (step === 2) {
    const allSelected = selectedIds.length === exercises.length;

    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setStep(1)}>← Back</button>
          <h1 className={styles.title}>Select exercises</h1>
          <div className={styles.stepIndicator}>
            <span>Step 2 of 3</span>
            {selectedIds.length > 0 && (
              <span className={styles.badge}>{selectedIds.length} selected</span>
            )}
            <button
              className={styles.addAllBtn}
              onClick={() => setSelectedIds(allSelected ? [] : exercises.map(e => e.id))}
            >
              {allSelected ? 'Remove all' : 'Add all'}
            </button>
          </div>
        </div>
        <div className={styles.content}>
          {CATEGORIES.map(cat => {
            const catExercises = exercises.filter(e => e.category === cat);
            return (
              <div key={cat} className={styles.categoryGroup}>
                <div className={styles.categoryHeader}>
                  <span className={`${styles.categoryTag} ${styles[categoryClass[cat]]}`}>
                    {categoryLabel[cat]}
                  </span>
                </div>
                {catExercises.map(ex => (
                  <button
                    key={ex.id}
                    className={`${styles.exerciseRow} ${selectedIds.includes(ex.id) ? styles.exerciseRowSelected : ''}`}
                    onClick={() => toggleExercise(ex.id)}
                  >
                    <span className={`${styles.checkbox} ${selectedIds.includes(ex.id) ? styles.checkboxChecked : ''}`}>
                      {selectedIds.includes(ex.id) ? '✓' : ''}
                    </span>
                    <span className={styles.exerciseRowName}>{ex.name}</span>
                  </button>
                ))}
              </div>
            );
          })}
          <button
            className={styles.btnPrimary}
            onClick={handleAdvanceToStep3}
            disabled={selectedIds.length === 0}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 3 — Order
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => setStep(2)}>← Back</button>
        <h1 className={styles.title}>Order your exercises</h1>
        <p className={styles.subtitle}>Physiotherapy protocol: Stretch → Mobilise → Strengthen</p>
        <div className={styles.stepIndicator}>Step 3 of 3</div>
      </div>
      <div className={styles.content}>
        <button className={styles.btnOutline} onClick={handleSortByPT}>
          Sort by PT protocol
        </button>
        <div className={styles.orderList}>
          {orderedIds.map((id, index) => {
            const ex = exercises.find(e => e.id === id)!;
            return (
              <div key={id} className={styles.orderRow}>
                <div className={styles.orderRowInfo}>
                  <span className={styles.orderRowName}>{ex.name}</span>
                  <span className={`${styles.categoryTag} ${styles[categoryClass[ex.category]]}`}>
                    {ex.category}
                  </span>
                </div>
                <div className={styles.orderBtns}>
                  <button
                    className={styles.orderBtn}
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    aria-label="Move up"
                  >↑</button>
                  <button
                    className={styles.orderBtn}
                    onClick={() => moveDown(index)}
                    disabled={index === orderedIds.length - 1}
                    aria-label="Move down"
                  >↓</button>
                </div>
              </div>
            );
          })}
        </div>
        <button className={styles.btnPrimary} onClick={handleSave}>
          Save Cycle
        </button>
      </div>
    </div>
  );
}

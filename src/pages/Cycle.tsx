import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWakeLock } from '../hooks/useWakeLock';
import { PRESETS, getPresetExercises, getCustomCycleExercises } from '../data/cycles';
import type { CyclePreset, CustomCycle } from '../data/cycles';
import type { Exercise } from '../data/exercises';
import { saveSession } from '../utils/history';
import { loadCustomCycles, deleteCustomCycle, renameCustomCycle } from '../utils/customCycles';
import styles from './Cycle.module.css';

type View = 'pick' | 'equipment' | 'running' | 'done';
type RenameState = { id: string; value: string } | null;

const categoryClass: Record<string, string> = {
  stretching: 'catStretching',
  mobility: 'catMobility',
  strengthening: 'catStrengthening',
};

function fmt(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function resolveList(cycle: CyclePreset | CustomCycle): Exercise[] {
  if ('tagline' in cycle) {
    return getPresetExercises(cycle);
  }
  return getCustomCycleExercises(cycle);
}

function getUniqueEquipment(exercises: Exercise[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const ex of exercises) {
    for (const item of ex.equipment ?? []) {
      if (!seen.has(item)) { seen.add(item); result.push(item); }
    }
  }
  return result;
}

// Step 1: useReadySync — keeps ready state and ref in sync automatically
function useReadySync(initial = false) {
  const [ready, setReady] = useState(initial);
  const readyRef = useRef(initial);
  function syncReady(value: boolean) {
    readyRef.current = value;
    setReady(value);
  }
  return { ready, readyRef, setReady: syncReady };
}

// Step 3: CycleCard — shared card for presets and custom cycles
interface CycleCardProps {
  emoji: string;
  label: string;
  subtitle: string;
  exList: Exercise[];
  expanded: boolean;
  onToggleExpand: () => void;
  onStart: () => void;
  renameControl?: ReactNode;
  onDelete?: () => void;
}

function CycleCard({ emoji, label, subtitle, exList, expanded, onToggleExpand, onStart, renameControl, onDelete }: Readonly<CycleCardProps>) {
  return (
    <div className={styles.presetCard}>
      <div className={styles.presetTop}>
        <span className={styles.presetEmoji}>{emoji}</span>
        <div className={styles.presetInfo}>
          {renameControl ?? <span className={styles.presetLabel}>{label}</span>}
          <span className={styles.presetTagline}>{subtitle}</span>
        </div>
        {onDelete && (
          <button className={styles.deleteBtn} onClick={onDelete} aria-label="Delete cycle">×</button>
        )}
      </div>
      <button className={styles.presetMetaToggle} onClick={onToggleExpand}>
        <span>{exList.length} exercises</span>
        <span className={styles.presetMetaDot}>·</span>
        <span>~{Math.round(exList.length * 1.5)} min</span>
        <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>›</span>
      </button>
      {expanded && (
        <div className={styles.exerciseList}>
          {exList.map(ex => (
            <div key={ex.id} className={styles.exerciseListItem}>
              <span className={styles.exerciseListName}>{ex.name}</span>
              <span className={`${styles.categoryTag} ${styles[categoryClass[ex.category]]}`}>
                {ex.category}
              </span>
            </div>
          ))}
        </div>
      )}
      <button className={styles.btnPrimary} onClick={onStart}>Start</button>
    </div>
  );
}

export default function Cycle() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<View>('pick');
  const [activeCycle, setActiveCycle] = useState<CyclePreset | CustomCycle | null>(null);
  const [customCycles, setCustomCycles] = useState<CustomCycle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSecs, setTotalSecs] = useState(0);
  const [exSecs, setExSecs] = useState(0);
  const [paused, setPaused] = useState(false);
  const { ready, readyRef, setReady } = useReadySync();   // Step 1
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<RenameState>(null); // Step 2
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wakeLockActive = view === 'running' && !paused;
  useWakeLock(wakeLockActive);

  const list = activeCycle ? resolveList(activeCycle) : [];

  function startTick() {
    intervalRef.current = setInterval(() => {
      setTotalSecs(s => s + 1);
      if (readyRef.current) setExSecs(s => s + 1);
    }, 1000);
  }

  function pauseTick() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    return () => pauseTick();
  }, []);

  useEffect(() => {
    loadCustomCycles().then(setCustomCycles);
  }, []);

  useEffect(() => {
    const id = (location.state as { quickStart?: string } | null)?.quickStart;
    if (id) {
      const preset = PRESETS.find(p => p.id === id);
      if (preset) handleStart(preset);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStart(cycle: CyclePreset | CustomCycle) {
    setActiveCycle(cycle);
    setCurrentIndex(0);
    setTotalSecs(0);
    setExSecs(0);
    setReady(false);
    setPaused(false);
    const equipment = getUniqueEquipment(resolveList(cycle));
    if (equipment.length > 0) {
      setView('equipment');
    } else {
      setView('running');
      startTick();
    }
  }

  function handleEquipmentReady() {
    setView('running');
    startTick();
  }

  function handleReady() {
    setReady(true);
  }

  function handlePause() {
    pauseTick();
    setPaused(true);
  }

  function handleResume() {
    startTick();
    setPaused(false);
  }

  // Step 4: Two focused functions instead of one mixed handleNext
  async function finishCycle() {
    pauseTick();
    await saveSession(totalSecs, list.length);
    setView('done');
  }

  function advanceExercise() {
    setCurrentIndex(i => i + 1);
    setExSecs(0);
    setReady(false);
  }

  async function handleNext() {
    if (currentIndex + 1 >= list.length) await finishCycle();
    else advanceExercise();
  }

  function handleRestart() {
    if (activeCycle) handleStart(activeCycle);
  }

  function handlePickCycle() {
    pauseTick();
    setView('pick');
    setCurrentIndex(0);
    setTotalSecs(0);
    setExSecs(0);
    setReady(false);
    setPaused(false);
  }

  async function handleDeleteCustomCycle(id: string) {
    if (globalThis.confirm('Delete this cycle?')) {
      await deleteCustomCycle(id);
      setCustomCycles(await loadCustomCycles());
    }
  }

  // Step 2: Consolidated rename handlers
  function handleRenameStart(cycle: CustomCycle) {
    setRenaming({ id: cycle.id, value: cycle.label });
  }

  async function handleRenameCommit() {
    if (!renaming) return;
    const trimmed = renaming.value.trim();
    if (trimmed && trimmed !== customCycles.find(c => c.id === renaming.id)?.label) {
      await renameCustomCycle(renaming.id, trimmed);
      setCustomCycles(await loadCustomCycles());
    }
    setRenaming(null);
  }

  // Step 6: Named render sub-functions — each view is independently readable

  function renderPickView() {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/guide')}>
            ← Back
          </button>
          <h1 className={styles.title}>Exercise Cycles</h1>
          <p className={styles.subtitle}>Choose a routine for the time of day</p>
        </div>

        <div className={styles.content}>
          {PRESETS.map(preset => {
            const exList = getPresetExercises(preset);
            return (
              <CycleCard
                key={preset.id}
                emoji={preset.emoji}
                label={preset.label}
                subtitle={preset.tagline}
                exList={exList}
                expanded={expandedPreset === preset.id}
                onToggleExpand={() => setExpandedPreset(expandedPreset === preset.id ? null : preset.id)}
                onStart={() => handleStart(preset)}
              />
            );
          })}

          {customCycles.length > 0 && (
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>My Cycles</h2>
            </div>
          )}

          {customCycles.map(cycle => {
            const exList = getCustomCycleExercises(cycle);
            const estMins = Math.round(exList.length * 1.5);
            const renameControl = renaming?.id === cycle.id ? (
              <input
                className={styles.renameInput}
                value={renaming.value}
                autoFocus
                onChange={e => setRenaming({ ...renaming, value: e.target.value })}
                onBlur={handleRenameCommit}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRenameCommit();
                  if (e.key === 'Escape') setRenaming(null);
                }}
              />
            ) : (
              <div className={styles.labelRow}>
                <span className={styles.presetLabel}>{cycle.label}</span>
                <button
                  className={styles.renameBtn}
                  onClick={() => handleRenameStart(cycle)}
                  aria-label="Rename cycle"
                >✏</button>
              </div>
            );
            return (
              <CycleCard
                key={cycle.id}
                emoji={cycle.emoji}
                label={cycle.label}
                subtitle={`${exList.length} exercises · ~${estMins} min`}
                exList={exList}
                expanded={expandedPreset === cycle.id}
                onToggleExpand={() => setExpandedPreset(expandedPreset === cycle.id ? null : cycle.id)}
                onStart={() => handleStart(cycle)}
                renameControl={renameControl}
                onDelete={() => handleDeleteCustomCycle(cycle.id)}
              />
            );
          })}

          <button className={styles.createBtn} onClick={() => navigate('/cycle/new')}>
            + Create your own cycle
          </button>
        </div>
      </div>
    );
  }

  function renderEquipmentView() {
    const equipment = getUniqueEquipment(list);
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={handlePickCycle}>← Back</button>
        </div>
        <div className={styles.content}>
          <div className={styles.equipmentScreen}>
            <span className={styles.equipmentHeroEmoji}>🎒</span>
            <h1 className={styles.equipmentTitle}>Grab your equipment</h1>
            <p className={styles.equipmentCycleName}>{activeCycle?.emoji} {activeCycle?.label}</p>
            <p className={styles.equipmentSub}>
              This cycle needs a few items. Take a moment to gather them before you start.
            </p>
            <ul className={styles.equipmentList}>
              {equipment.map((item) => (
                <li key={item} className={styles.equipmentItem}>
                  <span className={styles.equipmentCheck}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <button className={styles.btnPrimary} onClick={handleEquipmentReady}>
            Got it, let's go!
          </button>
          <button className={styles.btnSecondary} onClick={handlePickCycle}>
            Choose a different cycle
          </button>
        </div>
      </div>
    );
  }

  function renderRunningView() {
    const ex = list[currentIndex];
    // Step 5: Derive labels before JSX — no nested ternaries
    const isLastExercise = currentIndex + 1 >= list.length;
    const pauseLabel = paused ? '▶ Resume' : '⏸ Pause';
    const nextLabel = isLastExercise ? 'Finish' : 'Next Exercise';

    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.progressLine}>
            Exercise {currentIndex + 1} of {list.length}
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${((currentIndex + 1) / list.length) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.content}>
          <img src={ex.image} alt={ex.name} className={styles.exerciseImage} />

          <h2 className={styles.exerciseName}>{ex.name}</h2>

          <div className={styles.badges}>
            <span className={styles.badge}>{ex.duration}</span>
            <span className={styles.badge}>{ex.reps}</span>
          </div>

          {ex.equipment && ex.equipment.length > 0 && (
            <div className={styles.equipmentRow}>
              {ex.equipment.map((item) => (
                <span key={item} className={styles.equipmentBadge}>🔧 {item}</span>
              ))}
            </div>
          )}

          <ol className={styles.steps}>
            {ex.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          {ex.tip && (
            <p className={styles.tip}>
              <strong>Tip:</strong> {ex.tip}
            </p>
          )}

          <div className={styles.timers}>
            <div className={styles.timerBlock}>
              <span className={styles.timerValue}>{ready ? fmt(exSecs) : '--:--'}</span>
              <span className={styles.timerLabel}>this exercise</span>
            </div>
            <div className={styles.timerDivider} />
            <div className={styles.timerBlock}>
              <span className={styles.timerValue}>{fmt(totalSecs)}</span>
              <span className={styles.timerLabel}>total</span>
            </div>
          </div>

          {/* Step 5: Flat conditionals replace nested ternaries */}
          {!ready && (
            <div className={styles.runActions}>
              <button className={styles.btnPrimary} onClick={handleReady}>I'm Ready</button>
            </div>
          )}
          {ready && (
            <div className={styles.runActions}>
              <button className={styles.btnPause} onClick={paused ? handleResume : handlePause}>{pauseLabel}</button>
              <button className={styles.btnPrimary} onClick={handleNext}>{nextLabel}</button>
            </div>
          )}
          {ready && !isLastExercise && (
            <button className={styles.skipBtn} onClick={handleNext}>Skip</button>
          )}
        </div>
      </div>
    );
  }

  function renderDoneView() {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.doneHero}>
            <span className={styles.doneEmoji}>🎉</span>
            <h1 className={styles.doneTitle}>Cycle complete!</h1>
            <p className={styles.doneSub}>Great work — you finished all {list.length} exercises.</p>
          </div>

          <div className={styles.statsCard}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{fmt(totalSecs)}</span>
              <span className={styles.statLabel}>total time</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statValue}>{list.length}</span>
              <span className={styles.statLabel}>exercises done</span>
            </div>
          </div>

          <button className={styles.btnPrimary} onClick={handleRestart}>Start Again</button>
          <button className={styles.btnSecondary} onClick={handlePickCycle}>Choose Cycle</button>
          <button className={styles.btnSecondary} onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  // Step 6: Dispatch
  if (view === 'pick')      return renderPickView();
  if (view === 'equipment') return renderEquipmentView();
  if (view === 'running')   return renderRunningView();
  return renderDoneView();
}

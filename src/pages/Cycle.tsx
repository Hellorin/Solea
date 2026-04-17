import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWakeLock } from '../hooks/useWakeLock';
import { PRESETS, getPresetExercises, getCustomCycleExercises } from '../data/cycles';
import type { CyclePreset, CustomCycle } from '../data/cycles';
import { exercises as allExercises } from '../data/exercises';
import type { Exercise, Category } from '../data/exercises';
import { saveSession } from '../utils/history';
import { loadCustomCycles, deleteCustomCycle, renameCustomCycle } from '../utils/customCycles';
import { loadProgram, saveProgram, markSessionDone } from '../utils/rehabProgram';
import { toLocalDateStr } from '../utils/statsUtils';
import styles from './Cycle.module.css';

type View = 'pick' | 'quick-pick' | 'equipment' | 'running' | 'done';
type RenameState = { id: string; value: string } | null;

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
  onStart: () => void;
  renameControl?: ReactNode;
  onDelete?: () => void;
}

function CycleCard({ emoji, label, subtitle, exList, onStart, renameControl, onDelete }: Readonly<CycleCardProps>) {
  const previewNames = exList.slice(0, 3).map(ex => ex.name).join(', ');
  const preview = exList.length > 3 ? `${previewNames} +${exList.length - 3} more` : previewNames;

  return (
    <div className={styles.presetCard}>
      <div className={styles.presetTop}>
        <span className={styles.presetEmoji}>{emoji}</span>
        <div className={styles.presetInfo}>
          {renameControl ?? <span className={styles.presetLabel}>{label}</span>}
          {subtitle && <span className={styles.presetTagline}>{subtitle}</span>}
        </div>
        {onDelete && (
          <button className={styles.deleteBtn} onClick={onDelete} aria-label="Delete cycle">×</button>
        )}
      </div>
      <div className={styles.presetMeta}>
        <span>{exList.length} exercises</span>
        <span className={styles.presetMetaDot}>·</span>
        <span>~{Math.round(exList.length * 1.5)} min</span>
      </div>
      <p className={styles.presetPreview}>{preview}</p>
      <button className={styles.btnPrimary} onClick={onStart}>Start</button>
    </div>
  );
}

export default function Cycle() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<View>('pick');
  const [activeCycle, setActiveCycle] = useState<CyclePreset | CustomCycle | null>(null);
  const [quickExerciseIds, setQuickExerciseIds] = useState<string[]>([]);
  const [customCycles, setCustomCycles] = useState<CustomCycle[]>(() => loadCustomCycles());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSecs, setTotalSecs] = useState(0);
  const [exSecs, setExSecs] = useState(0);
  const [paused, setPaused] = useState(false);
  const { ready, readyRef, setReady } = useReadySync();   // Step 1
  const [renaming, setRenaming] = useState<RenameState>(null); // Step 2
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wakeLockActive = view === 'running' && !paused;
  useWakeLock(wakeLockActive);

  const list = quickExerciseIds.length > 0
    ? allExercises.filter(e => quickExerciseIds.includes(e.id))
    : (activeCycle ? resolveList(activeCycle) : []);

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
    const state = location.state as {
      quickStart?: string;
      prescribedIds?: string[];
      prescribedLabel?: string;
      prescribedEmoji?: string;
      fromRehab?: boolean;
    } | null;
    if (state?.prescribedIds && state.prescribedIds.length > 0) {
      setQuickExerciseIds(state.prescribedIds);
      setActiveCycle(null);
      setCurrentIndex(0);
      setTotalSecs(0);
      setExSecs(0);
      setReady(false);
      setPaused(false);
      const exList = allExercises.filter(e => state.prescribedIds!.includes(e.id));
      const equipment = getUniqueEquipment(exList);
      if (equipment.length > 0) setView('equipment');
      else {
        setView('running');
        startTick();
      }
      return;
    }
    const id = state?.quickStart;
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
  function finishCycle() {
    pauseTick();
    saveSession(totalSecs, list.map(e => e.name));
    const fromRehab = (location.state as { fromRehab?: boolean } | null)?.fromRehab;
    if (fromRehab) {
      const program = loadProgram();
      if (program && program.active) {
        saveProgram(markSessionDone(program, toLocalDateStr(new Date())));
      }
      navigate('/rehab');
      return;
    }
    setView('done');
  }

  function advanceExercise() {
    setCurrentIndex(i => i + 1);
    setExSecs(0);
    setReady(false);
  }

  function handleNext() {
    if (currentIndex + 1 >= list.length) finishCycle();
    else advanceExercise();
  }

  function handleRestart() {
    if (quickExerciseIds.length > 0) handleStartQuick();
    else if (activeCycle) handleStart(activeCycle);
  }

  function handlePickCycle() {
    pauseTick();
    setView('pick');
    setQuickExerciseIds([]);
    setCurrentIndex(0);
    setTotalSecs(0);
    setExSecs(0);
    setReady(false);
    setPaused(false);
  }

  function handleStartQuick() {
    setActiveCycle(null);
    setCurrentIndex(0);
    setTotalSecs(0);
    setExSecs(0);
    setReady(false);
    setPaused(false);
    const exList = allExercises.filter(e => quickExerciseIds.includes(e.id));
    const equipment = getUniqueEquipment(exList);
    if (equipment.length > 0) {
      setView('equipment');
    } else {
      setView('running');
      startTick();
    }
  }

  function toggleQuickExercise(id: string) {
    setQuickExerciseIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleQuickCategory(key: Category) {
    const catIds = allExercises.filter(e => e.category === key).map(e => e.id);
    const allSelected = catIds.every(id => quickExerciseIds.includes(id));
    if (allSelected) {
      setQuickExerciseIds(prev => prev.filter(id => !catIds.includes(id)));
    } else {
      setQuickExerciseIds(prev => [...new Set([...prev, ...catIds])]);
    }
  }

  function handleDeleteCustomCycle(id: string) {
    if (globalThis.confirm('Delete this cycle?')) {
      deleteCustomCycle(id);
      setCustomCycles(loadCustomCycles());
    }
  }

  // Step 2: Consolidated rename handlers
  function handleRenameStart(cycle: CustomCycle) {
    setRenaming({ id: cycle.id, value: cycle.label });
  }

  function handleRenameCommit() {
    if (!renaming) return;
    const trimmed = renaming.value.trim();
    if (trimmed && trimmed !== customCycles.find(c => c.id === renaming.id)?.label) {
      renameCustomCycle(renaming.id, trimmed);
      setCustomCycles(loadCustomCycles());
    }
    setRenaming(null);
  }

  // Step 6: Named render sub-functions — each view is independently readable

  function renderPickView() {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Exercise Cycles</h1>
          <p className={styles.subtitle}>Choose a routine for your session</p>
        </div>

        <div className={styles.content}>
          <div
            className={styles.quickCycleCard}
            onClick={() => { setQuickExerciseIds([]); setView('quick-pick'); }}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setQuickExerciseIds([]); setView('quick-pick'); } }}
          >
            <div className={styles.quickCycleTop}>
              <span className={styles.quickCycleEmoji}>⚡</span>
              <div>
                <p className={styles.quickCycleLabel}>Quick Cycle</p>
                <p className={styles.quickCycleTagline}>Pick any exercises and start right away</p>
              </div>
            </div>
          </div>

          {PRESETS.map(preset => {
            const exList = getPresetExercises(preset);
            return (
              <CycleCard
                key={preset.id}
                emoji={preset.emoji}
                label={preset.label}
                subtitle={preset.tagline}
                exList={exList}
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
                subtitle=""
                exList={exList}
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

  function renderQuickPickView() {
    const QUICK_CATEGORIES: { key: Category; label: string; emoji: string }[] = [
      { key: 'stretching', label: 'Stretching', emoji: '🧘' },
      { key: 'mobility', label: 'Mobility', emoji: '🔄' },
      { key: 'strengthening', label: 'Strengthening', emoji: '💪' },
    ];
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => { setQuickExerciseIds([]); setView('pick'); }}>← Back</button>
          <h1 className={styles.title}>Quick Cycle</h1>
          <p className={styles.subtitle}>Pick exercises to include</p>
        </div>
        <div className={styles.content}>
          {QUICK_CATEGORIES.map(({ key, label, emoji }) => {
            const catExercises = allExercises.filter(e => e.category === key);
            const allSelected = catExercises.every(e => quickExerciseIds.includes(e.id));
            return (
              <div key={key} className={styles.categorySection}>
                <div className={styles.categoryHeader}>
                  <span>{emoji} {label}</span>
                  <button className={styles.selectAllBtn} onClick={() => toggleQuickCategory(key)}>
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                {catExercises.map(ex => (
                  <label key={ex.id} className={styles.exerciseCheckItem}>
                    <input
                      type="checkbox"
                      checked={quickExerciseIds.includes(ex.id)}
                      onChange={() => toggleQuickExercise(ex.id)}
                    />
                    <span className={styles.exerciseCheckName}>{ex.name}</span>
                    <span className={styles.exerciseCheckMeta}>{ex.duration}</span>
                  </label>
                ))}
              </div>
            );
          })}
          <button
            className={styles.btnPrimary}
            disabled={quickExerciseIds.length === 0}
            onClick={handleStartQuick}
          >
            {quickExerciseIds.length > 0 ? `Start (${quickExerciseIds.length})` : 'Select exercises to start'}
          </button>
        </div>
      </div>
    );
  }

  function renderEquipmentView() {
    const equipment = getUniqueEquipment(list);
    const cycleName = quickExerciseIds.length > 0 ? '⚡ Quick Cycle' : `${activeCycle?.emoji} ${activeCycle?.label}`;
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={handlePickCycle}>← Back</button>
        </div>
        <div className={styles.content}>
          <div className={styles.equipmentScreen}>
            <span className={styles.equipmentHeroEmoji}>🎒</span>
            <h1 className={styles.equipmentTitle}>Grab your equipment</h1>
            <p className={styles.equipmentCycleName}>{cycleName}</p>
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
  if (view === 'pick')       return renderPickView();
  if (view === 'quick-pick') return renderQuickPickView();
  if (view === 'equipment')  return renderEquipmentView();
  if (view === 'running')    return renderRunningView();
  return renderDoneView();
}

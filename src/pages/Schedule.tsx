import { useEffect, useRef, useState } from 'react';
import TimeSlot from '../components/TimeSlot';
import { loadTimes, saveTimes } from '../utils/storage';
import styles from './Schedule.module.css';

export default function Schedule() {
  const [times, setTimes] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'warn' | 'info' } | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimes(loadTimes());
  }, []);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  function showMessage(text: string, type: 'warn' | 'info') {
    setMessage({ text, type });
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), 2500);
  }

  function handleAdd() {
    if (!inputValue) return;
    const [h, m] = inputValue.split(':').map(Number);
    const totalMins = h * 60 + m;

    if (totalMins < 7 * 60 || totalMins > 22 * 60) {
      showMessage('Please pick a time between 07:00 and 22:00.', 'warn');
      return;
    }

    if (times.includes(inputValue)) {
      showMessage('Already saved!', 'info');
      return;
    }

    const newTimes = [...times, inputValue].sort();
    setTimes(newTimes);
    saveTimes(newTimes);
    setInputValue('');
    setShowInput(false);
  }

  function handleDelete(time: string) {
    const newTimes = times.filter(t => t !== time);
    setTimes(newTimes);
    saveTimes(newTimes);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Schedule</h1>
        <p className={styles.subtitle}>Set reminders throughout your day</p>
      </div>

      <div className={styles.content}>
        {times.length === 0 ? (
          <div className={styles.emptyState}>
            <svg className={styles.footSvg} viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="32" cy="82" rx="18" ry="12" stroke="#C8D9CE" strokeWidth="2.5"/>
              <path d="M18 70 Q14 50 16 30 Q18 10 32 8 Q46 6 50 20 Q54 34 50 50 Q46 66 50 70" stroke="#C8D9CE" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <circle cx="20" cy="12" r="4" stroke="#C8D9CE" strokeWidth="2"/>
              <circle cx="28" cy="8" r="4" stroke="#C8D9CE" strokeWidth="2"/>
              <circle cx="36" cy="7" r="4" stroke="#C8D9CE" strokeWidth="2"/>
              <circle cx="44" cy="9" r="3.5" stroke="#C8D9CE" strokeWidth="2"/>
              <circle cx="50" cy="14" r="3" stroke="#C8D9CE" strokeWidth="2"/>
            </svg>
            <p className={styles.emptyText}>No reminders yet.</p>
            <p className={styles.emptyHint}>Add your first one below.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {times.map(time => (
              <TimeSlot key={time} time={time} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {message && (
          <div className={message.type === 'warn' ? styles.msgWarn : styles.msgInfo}>
            {message.text}
          </div>
        )}

        {showInput ? (
          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              type="time"
              className={styles.timeInput}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button className={styles.btnConfirm} onClick={handleAdd}>
              Save
            </button>
            <button className={styles.btnCancel} onClick={() => { setShowInput(false); setInputValue(''); }}>
              Cancel
            </button>
          </div>
        ) : (
          <button className={styles.btnAdd} onClick={() => setShowInput(true)}>
            + Add a time
          </button>
        )}

        <div className={styles.note}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.noteIcon}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>Reminders fire while the app is running in the background. If you fully close it, reminders won't appear until you reopen it.</p>
        </div>
      </div>
    </div>
  );
}

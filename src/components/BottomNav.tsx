import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      <NavLink to="/" end className={({ isActive }) => isActive ? `${styles.tab} ${styles.active}` : styles.tab}>
        <span className={styles.icon}>🏠</span>
        <span className={styles.label}>Home</span>
      </NavLink>
      <NavLink to="/schedule" className={({ isActive }) => isActive ? `${styles.tab} ${styles.active}` : styles.tab}>
        <span className={styles.icon}>🕐</span>
        <span className={styles.label}>Schedule</span>
      </NavLink>
      <NavLink to="/guide" className={({ isActive }) => isActive ? `${styles.tab} ${styles.active}` : styles.tab}>
        <span className={styles.icon}>🧘</span>
        <span className={styles.label}>Exercises</span>
      </NavLink>
      <NavLink to="/stats" className={({ isActive }) => isActive ? `${styles.tab} ${styles.active}` : styles.tab}>
        <span className={styles.icon}>📊</span>
        <span className={styles.label}>Stats</span>
      </NavLink>
    </nav>
  );
}

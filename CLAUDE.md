# Solea

A mobile-first PWA for plantar fasciitis recovery. Helps users stick to their stretching routine through scheduled reminders, a guided exercise library, and session tracking.

## Tech stack

- React 19 + TypeScript, built with Vite
- CSS Modules for styling (no CSS framework)
- React Router v7 (HashRouter, for PWA compatibility)
- `vite-plugin-pwa` with a custom service worker (`src/sw.ts`)
- All state is persisted to `localStorage` — no backend

## Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Home | Greeting, next reminder, quick nav |
| `/schedule` | Schedule | Add/remove daily reminder times |
| `/guide` | Guide | Browse exercises by category |
| `/cycle` | Cycle | Step-through guided exercise session with timer |
| `/stats` | Stats | Streak tracking, heatmap calendar, session history |

## Key files

- `src/data/exercises.ts` — exercise definitions (stretching / mobility / strengthening)
- `src/utils/storage.ts` — reminder times in localStorage (`reminder_times`)
- `src/utils/history.ts` — session history in localStorage (`plantar_history`)
- `src/utils/notifications.ts` — Web Notifications API, reminder scheduling
- `src/components/BottomNav.tsx` — persistent tab bar
- `vite.config.ts` — PWA manifest config

## Design tokens

- Brand green: `#7BAF8E`
- Background: `#F9F6F1` (warm off-white)
- Font: system stack

## Development

```bash
npm run dev      # dev server at localhost:5173
npm run build    # TypeScript check + Vite build → dist/
npm run preview  # serve the built dist/
```

## Verification after code generation

Verify by opening a browser that all features are actually well implemented and as expected.

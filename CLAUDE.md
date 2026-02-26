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
| `/cycle` | Cycle | Pick preset or custom cycle, step-through guided session with timer |
| `/cycle/new` | CycleBuilder | 3-step wizard to create and save a custom cycle |
| `/stats` | Stats | Streak tracking, heatmap calendar, session history |

## Key files

- `src/data/exercises.ts` — exercise definitions (stretching / mobility / strengthening)
- `src/data/cycles.ts` — preset cycle definitions + `CyclePreset` / `CustomCycle` types
- `src/utils/storage.ts` — reminder times in localStorage (`reminder_times`)
- `src/utils/history.ts` — session history in localStorage (`plantar_history`)
- `src/utils/customCycles.ts` — custom cycle CRUD in localStorage (`custom_cycles`) + `sortByPTProtocol`
- `src/utils/notifications.ts` — Web Notifications API, reminder scheduling
- `src/components/BottomNav.tsx` — persistent tab bar
- `vite.config.ts` — PWA manifest config

## Design tokens

- Brand green: `#7BAF8E`
- Background: `#F9F6F1` (warm off-white)
- Font: system stack

## Development

```bash
npm run dev       # dev server at localhost:5173
npm test          # launch vite tests
npm run build     # TypeScript check + Vite build → dist/
npm run preview   # serve the built dist/
```

## Verification after code generation
1. Write unit tests to validate the code generated
2. Verify by opening a browser that all features are actually well implemented and as expected.

# Preview and Prod environment
```bash
npx vercel        # deploy to preview environment on vercel
npx vercel --prod # deploy to prod environment on vercel
```

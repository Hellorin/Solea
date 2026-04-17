# Solea — Plantar Fasciitis Recovery App

> A free, no-nonsense PWA for daily plantar fascia stretching. No subscriptions. No ads. No bloat. Just the exercises you need.

---

## The problem with existing apps

Search for "plantar fasciitis" in any app store and you'll find a graveyard of apps that share the same sins:

- **$9.99/month** for what is essentially a static PDF of exercises
- Aggressive upsell screens before you can even see the content
- Generic stock-photo UI that hasn't been touched since 2019
- Notification spam that trains you to ignore them
- No offline support — crashes the moment you're at the gym without signal
- Half the features behind a "Pro" paywall that barely works

You're in pain. You just want to stretch. You shouldn't need to fight your recovery app to do it.

---

## A different approach: build it yourself with AI

This app exists because of a simple realisation: **with AI-assisted coding, building a focused personal tool is now faster than finding a good one.**

Instead of spending an afternoon trialling mediocre apps, you can spend the same time describing exactly what you want to an AI coding assistant and end up with something that:

- Does precisely what you need and nothing else
- Has no monetisation layer between you and your recovery
- Runs offline, installs to your home screen, and respects your phone's storage
- Can be changed or extended any time you want

Solea was built this way. The entire app — exercise library, reminders, guided cycles, streak tracking, pain logging — was coded with AI assistance. The result is cleaner, faster, and more useful than anything available on the app stores.

---

## What Solea does

**Exercise guide** — 18 evidence-based exercises across three categories: stretching, mobility, and strengthening. Each has step-by-step instructions, timing guidance, and clinical tips. No account required to read them.

**Guided cycles** — step through exercises in sequence with a built-in timer. Three presets (morning, anytime, evening), a quick-pick mode to run any combination of individual exercises, and a custom cycle builder. Toggle strengthening exercises on/off depending on where you are in your recovery.

**Daily pain check-in** — log how your foot feels each day using a 1–5 emoji scale, right from the home screen. Feeds into a trend chart on the Progress page so you can see whether the routine is actually helping.

**30-day rehab program** — an adaptive structured program that builds through three phases (pain relief → loading → strengthening). Answer two questions to start, then do a brief daily check-in after each session so the app can pick the right exercises for the next day. The program pauses automatically if you miss two or more days in a row and resumes where you left off.

**Progress tracking** — streak counter, a 30-day activity heatmap, and a session history log that shows which exercises you did each time. Motivation without gamification nonsense.

**Installable PWA** — add it to your phone's home screen. Works offline. Screen stays awake during active sessions. No app store, no install size, no permissions you didn't ask for.

---

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, and start your recovery.

---

## Built with

- React 19 + TypeScript
- Vite + vite-plugin-pwa
- CSS Modules — no UI framework, no design-system dependency
- Zero backend — all data stays on your device

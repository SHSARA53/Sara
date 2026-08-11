# 🐰 החוקר הקטן שלי — Little Explorer

A playful, safe, offline-first educational app for toddlers ages 2–3. A parent
picks what to learn today (colors, animals, shapes, numbers, and more); the
child plays through large, voice-guided activities with a friendly bunny
mascot and earns stars, hearts, rainbows, balloons and stickers along the
way. Hebrew (RTL) is the default language, with a full English (LTR)
translation built in.

Built with React 19 + TypeScript + Vite, Tailwind CSS v4, Framer Motion,
React Router, and IndexedDB for local persistence. Ships as an installable
PWA.

## Product highlights

- **Two modes.** Child Mode is icon-first, text-light, and has only 2–4 big
  tappable choices per activity. Parent Mode is hidden behind a 3-second
  press-and-hold gate (a small leaf icon in a corner — never an obvious
  "Parent Mode" button a toddler could tap into).
- **Never punishes.** Wrong taps get a gentle shake, a soft sound, and a
  progressively stronger hint (repeat the question → highlight the answer →
  reveal it) — never "Wrong!" or a fail state.
- **Adaptive difficulty & spaced repetition.** Each topic tracks a 0–100
  mastery score per vocabulary item. Three correct answers in a row nudge
  the number of choices up (2→3→4); two misses ease it back down, one level
  at a time. Weaker vocabulary is weighted to reappear more often.
- **Data-driven content.** Every topic, activity, and piece of vocabulary is
  data (see `src/data/topics/topics.ts`), rendered by a reusable Activity
  Engine — no per-topic screens to build.
- **Offline-first.** All educational content, audio, and progress work with
  no network connection; state persists locally via IndexedDB.
- **Bilingual & RTL-correct.** Hebrew is the default UI/content language,
  fully right-to-left; English is a first-class second language. Adding a
  third language means adding one more key to each `LocalizedText`.

## Project structure

```
src/
  components/
    common/       BigButton, TopicCard, VocabTile, ProgressBar, Confetti,
                   ParentGateButton, RewardCounters
    child/        ChildLayout (bottom nav), QuietModeScreen
    parent/       ParentLayout (tabbed nav)
    games/        ActivityEngine + one component per activity type
                   (FindActivity, CountActivity, MatchActivity,
                   MemoryActivity, SortActivity) and the shared
                   useChoiceActivity hook (hint ladder)
    mascot/       Mascot.tsx — Bunny, drawn as inline SVG, mood-reactive
  pages/
    child/        HomePage, TopicsPage, SessionPage, RewardsPage,
                   OnboardingPage, FirstRunPage
    parent/       DashboardPage, TopicsConfigPage, LearningPlanPage,
                   SettingsPage
  data/
    topics/       topics.ts — every Topic + its vocabulary (the content DB)
    stickers.ts    the sticker collection
  services/
    audio/         audioService.ts — speak() (TTS abstraction) +
                    playEffect() (WebAudio-synthesized sound effects)
    storage/       storageAdapter.ts (IndexedDB via idb-keyval) + defaults.ts
    learning/       activityGenerator.ts (the Activity Engine's data layer),
                    sessionGenerator.ts, dailyAdventure.ts, mastery.ts
                    (mastery score + adaptive difficulty), rewardEngine.ts,
                    streak.ts, dashboardStats.ts
  state/           appReducer.ts + AppStateContext.tsx (global app state)
  models/          types.ts — every TypeScript interface in the app
  locales/         ui.ts (interface strings), phrases.ts (mascot lines)
  hooks/           useLang.ts, usePwaInstall.ts
  utils/           rng.ts (seedable RNG + weighted sampling), quietMode.ts
```

### The Activity Engine

Every game is one of five reusable activity **types** — `FIND`, `COUNT`,
`MATCH`, `MEMORY`, `SORT` — implemented once in `src/components/games/` and
fed by `generateActivity(topic, type, difficulty, options)`
(`src/services/learning/activityGenerator.ts`). A topic just declares its
vocabulary and which activity types apply to it; the generator combinatorially
produces fresh, varied questions from that vocabulary (weighted toward
weaker items when progress data is available) instead of hand-authored
question banks. This is what makes adding a new topic — e.g. "Dinosaur
World" — a content-only change: add a `Topic` object to
`src/data/topics/topics.ts` and it immediately gets FIND/MEMORY/etc. games
for free.

### Audio abstraction

`src/services/audio/audioService.ts` exposes `speak(text, lang)` for voice
instructions and `playEffect(key)` for short UI sounds. Today `speak()` uses
the browser's SpeechSynthesis API and `playEffect()` synthesizes tones via
WebAudio (so the app ships with **zero binary audio assets** and stays fully
offline-capable). Both are single choke points — swapping in professionally
recorded voice clips or sound files later means changing the inside of these
two functions, not every call site.

## Getting started

```bash
npm install
npm run dev       # start the dev server (http://localhost:5173)
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build locally
npm run test      # run the vitest suite once
npm run test:watch
npm run lint       # oxlint
```

## Installing as a PWA

The app is configured with `vite-plugin-pwa` (manifest + service worker +
offline caching, `display: standalone`).

- **Desktop Chrome/Edge:** open the built/deployed app, click the install
  icon in the address bar (or menu → "Install Little Explorer").
- **Android Chrome:** menu → "Add to Home screen". A settings toggle in
  Parent Mode → Settings triggers the native install prompt directly when
  the browser supports it.
- **iOS Safari:** Share → "Add to Home Screen" (Apple doesn't expose the
  install-prompt API, so this is the manual path).

`npm run build && npm run preview` serves the production build (with the
service worker active) locally if you want to test the installed/offline
experience before deploying.

## Packaging for desktop/mobile

The app is a standard web build, so it's straightforward to wrap with
**Capacitor** for native Android/iOS, or **Tauri/Electron** for
Windows/macOS, without changing app code:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npm run build
npx cap add android   # and/or: npx cap add ios
npx cap sync
npx cap open android  # opens Android Studio
```

This wasn't wired into the repo (it needs platform SDKs — Xcode, Android
Studio — not present in this environment), but no app-side changes are
needed first: local storage, audio, and navigation are all plain web APIs.

## Adding a topic

1. Add a `Topic` object to `src/data/topics/topics.ts` (id, title, icon,
   theme, `ageRange`, `vocabulary`, `activityTypes`). Use the `t()`/`v()`
   helpers in `src/data/topics/helpers.ts`.
2. Push it into the `topics` array at the bottom of that file.
3. That's it — it appears in the Topics grid, Learning Plan builder, and
   Parent Mode topic toggles automatically, and the Activity Engine
   generates FIND/COUNT/MATCH/MEMORY/SORT games from its vocabulary based on
   the `activityTypes` you listed.

## Adding an activity type

1. Add the new key to `ActivityType` in `src/models/types.ts`.
2. Write a `genX(topic, difficulty, opts)` function in
   `activityGenerator.ts` that returns a `GeneratedActivity`.
3. Write a `<XActivity>` component in `src/components/games/` (see
   `FindActivity.tsx` for the simplest example) and register it in
   `ActivityEngine.tsx`'s switch.

## Adding a language

`LocalizedText` (`src/models/types.ts`) is `Record<Lang, string>`. To add a
third language: widen `Lang`, add the new key to every `LocalizedText` value
in `src/data/topics/topics.ts`, `src/data/stickers.ts`, and
`src/locales/ui.ts` / `phrases.ts`, and add a `dir` mapping if the language
is RTL (only Hebrew is RTL today; see `AppStateContext.tsx`'s
`document.documentElement.dir` effect).

## Adding audio

Voice: nothing to add — every `LocalizedText` passed to `speak()` is spoken
via TTS automatically. To swap in a professionally recorded clip for a
specific phrase, extend `speak()` to check an `audioClipMap[key]` before
falling back to TTS. Sound effects: add a new key to `SoundEffectKey` and
its note sequence to `EFFECT_NOTES` in `audioService.ts`.

## Modifying educational content

All vocabulary, sticker definitions, and UI copy live in `src/data/` and
`src/locales/` as plain data — no component code needs to change to add a
color, an animal, or a sticker.

## What's implemented in this first version

- 10 topics: Colors, Shapes, Numbers & Counting, Animals, Fruits & Food,
  Vehicles, My Body, Emotions, Opposites, and a mixed Games topic
  (memory/matching/sorting across all vocabulary).
- Full Activity Engine (FIND / COUNT / MATCH / MEMORY / SORT) with a
  progressive hint ladder and no-punishment feedback.
- Child Mode: mascot home screen, Today's Adventure (7-day repetition
  rotation), Topics grid, full session flow (welcome → activities →
  mid-session break → celebration + sticker), Rewards/sticker collection.
- First-run mini demo activity + a 5-step Parent onboarding wizard.
- Parent Mode behind a real 3-second press-and-hold gate: Dashboard
  (today's minutes, accuracy, per-topic progress bars, recommendations,
  today/yesterday/this-week session history, gentle streak), Topics
  enable/disable, Learning Plan builder (topics + duration + difficulty +
  "Surprise Me"), Settings (profile, language, sound/voice/volume, quiet
  mode window, reset progress, install prompt).
- Adaptive difficulty and a spaced-repetition-flavored mastery model
  (0–100 score per vocabulary item, weighted resampling of weak items).
- Hebrew (RTL) default + English (LTR), fully data-driven.
- Offline-first via IndexedDB persistence + service worker precaching.
- 60 automated tests (Vitest) covering mastery/difficulty math, the
  activity generator, reward/streak logic, the app reducer, storage
  round-tripping, RTL/language switching, and dashboard stats.

## Sensible next steps

- **True drag-and-drop for SORT**, with forgiving snap-to-target — the
  current build uses "tap the item, then tap the basket" instead, which is
  more reliable for 2-year-old fine motor control but is a simplification
  of the spec's drag-and-drop request.
- **Recorded voice clips** instead of/alongside browser TTS for a warmer,
  more consistent voice (the abstraction in `audioService.ts` is ready for
  this).
- **Interactive body-part tapping directly on the mascot** (today Body
  Parts uses the same FIND-tile format as every other topic).
- **Multiple child profiles** (the data model has one `ChildProfile`, but
  `AppState` could hold an array with minimal reducer changes).
- **Puzzle and Trace activity types** (2–3 piece puzzles, finger tracing)
  as two more entries in the Activity Engine.
- **Capacitor packaging** for real Android/iOS builds (see above).

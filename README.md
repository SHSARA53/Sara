# 🐰 החוקר הקטן שלי — Little Explorer

A playful, safe, offline-first educational app for toddlers ages 2–3. The
child explores a storybook **World Map** — Rainbow Garden, Animal Forest,
Number Town, and more — guided by a friendly bunny mascot, earning stars,
hearts, rainbows, balloons, treasure-chest rewards and world-themed stickers
along the way. A parent can always pick exactly what to practice; the world
map is a presentation layer over the same content, never a gate. Hebrew
(RTL) is the default language, with a full English (LTR) translation built
in.

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
    common/       BigButton, TopicCard, VocabTile, ProgressBar,
                   CircularProgress, AmbientDecorations, Confetti,
                   ParentGateButton, RewardCounters, ErrorBoundary
    child/        ChildLayout (bottom nav), QuietModeScreen
    parent/       ParentLayout (tabbed nav)
    games/        ActivityEngine + one component per activity type
                   (FindActivity, CountActivity, MatchActivity,
                   MemoryActivity, SortActivity) and the shared
                   useChoiceActivity hook (hint ladder)
    mascot/       Mascot.tsx — Bunny, drawn as inline SVG, mood-reactive
                   (idle/happy/excited/celebrating/thinking/sleepy/encouraging)
  pages/
    child/        HomePage (adventure hub), WorldMapPage, WorldDetailPage,
                   StoryPage, SessionPage, RewardsPage (sticker book),
                   TopicsPage (flat grid, kept for direct topic access),
                   OnboardingPage, FirstRunPage
    parent/       DashboardPage (world-framed progress + skills),
                   TopicsConfigPage, LearningPlanPage, SettingsPage
  data/
    topics/       topics.ts — every Topic + its vocabulary (the content DB)
    worlds/       worlds.ts — the storybook map skin over topics
    stories/      stories.ts — mini interactive stories
    stickers.ts    the sticker collection, grouped by world
  services/
    audio/         audioService.ts — speak() (TTS abstraction) +
                    playEffect() (WebAudio-synthesized sound effects),
                    both Calm-Mode aware
    storage/       storageAdapter.ts (IndexedDB via idb-keyval) + defaults.ts
    learning/       activityGenerator.ts (the Activity Engine's data layer),
                    sessionGenerator.ts, dailyAdventure.ts, mastery.ts
                    (mastery score + adaptive difficulty), rewardEngine.ts,
                    streak.ts, dashboardStats.ts, worldGrowth.ts
  state/           appReducer.ts + AppStateContext.tsx (global app state)
  models/          types.ts — every TypeScript interface in the app
  locales/         ui.ts (interface strings), phrases.ts (mascot lines)
  hooks/           useLang.ts, usePwaInstall.ts
  utils/           rng.ts (seedable RNG + weighted sampling), quietMode.ts,
                   theme.ts (shared theme→color mapping)
```

### The World layer

A **World** (`src/data/worlds/worlds.ts`) is a storybook skin, not a content
system: it just points a `topicId` at an existing `Topic` and adds theming
(icon, tagline, ambient decorations, an exploration target for the "world
grows as you learn" visuals, and a skills list for the parent dashboard). The
world map, Today's Adventure, a parent-built Learning Plan, and a Story scene
all generate activities through the exact same
`generateActivity(topic, type, difficulty)` call — there's no duplicated
educational logic anywhere. Adding a new place (e.g. "Dinosaur Island") that
already has a topic is a ~15-line data object; a genuinely new subject also
needs a `Topic` in `topics.ts` first (see "Adding a topic" below).

Progression is deliberately non-blocking: every world is tappable from the
very first launch, and Parent Mode can always select any topic regardless of
how much the child has "explored." The only gating is cosmetic — more
background decorations and a one-time "you discovered this world!"
celebration once an exploration target is crossed.

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

## Adding a world

1. Add a `World` object to `src/data/worlds/worlds.ts` pointing `topicId` at
   an existing (or newly-added) topic, with an icon, tagline, theme,
   `ambientEmojis`, an `explorationTarget`, and a `skills` list.
2. Push it into the `worlds` array. It appears on the map, in the parent
   dashboard's world-framed progress view, and becomes selectable from
   `WorldDetailPage` — no other code changes needed.
3. Optional: add a few `StickerDef`s with that `worldId` to `stickers.ts` so
   the world has its own sticker-book page.

## Adding a story

Add a `Story` to `src/data/stories/stories.ts`: a `worldId`, a title, and a
`scenes` array alternating `kind: "narration"` (mascot mood + line + emoji,
tap to continue) and `kind: "activity"` (an `activityTopicId` +
`activityType`, generated live through the same engine as everything else —
optionally pinned to a specific vocab item via `forcedVocabId` so the
narration and the activity always agree, e.g. "help Bunny find his red
balloon" must generate a find-*red* activity). `StoryPage` handles playback;
`WorldDetailPage` automatically shows a "Story Time" button for any world
that has one.

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

## What's implemented

- 12 topics: Colors, Shapes, Numbers & Counting, Animals, Fruits & Food,
  Vehicles, My Body, Emotions, Opposites, Nature, Sounds & Music, and a
  mixed Games topic (memory/matching/sorting across all vocabulary).
- 10 storybook **worlds** on an interactive map (Rainbow Garden, Animal
  Forest, Number Town, Shape Mountain, Happy Kitchen, Little City, Feelings
  House, My Body House, Nature Park, Music Meadow) with ambient decorations
  that visually grow denser as the child explores more of that world, plus a
  one-time "you discovered this world!" celebration.
- Full Activity Engine (FIND / COUNT / MATCH / MEMORY / SORT) with a
  progressive hint ladder and no-punishment feedback, reused identically by
  the world map, Today's Adventure, parent-built sessions, and stories.
- 2 mini interactive stories ("Bunny's Red Balloon", "Bunny Visits the
  Farm") on a small reusable story engine that narrates around a real,
  engine-generated activity.
- Child Mode home screen (no statistics): Continue Adventure (resumes an
  interrupted session exactly where it left off), Today's Adventure,
  Explore World, Surprise Me, Sticker Book — plus a warm "I missed you!"
  greeting instead of streak-shaming after a multi-day gap.
- Session flow: welcome → activities → mid-session break → a tappable
  **treasure chest** reveal (predetermined, meaningful rewards — never a
  random gacha draw) → sticker, with the sticker biased toward the world
  just played.
- Mascot with 7 moods (idle/happy/excited/celebrating/thinking/sleepy/
  encouraging) and a warm, never-judgmental phrase bank.
- Sticker Book grouped by world with a friendly "✨ coming on our next
  adventure!" placeholder for uncollected stickers.
- First-run mini demo activity + a 5-step Parent onboarding wizard.
- Parent Mode behind a real 3-second press-and-hold gate: Dashboard framed
  around worlds (skills taught, favorite world, per-world progress,
  recommendations, today/yesterday/this-week session history, gentle
  streak), Topics enable/disable, Learning Plan builder (topics + duration +
  difficulty + "Surprise Me"), Settings (profile, language, sound/voice/
  volume, reduced motion, **Calm Mode** — softer sound and no confetti
  bursts, independent of reduced motion, quiet-hours window, reset
  progress, install prompt).
- Adaptive difficulty and a spaced-repetition-flavored mastery model
  (0–100 score per vocabulary item, weighted resampling of weak items).
- Hebrew (RTL) default + English (LTR), fully data-driven; RTL-aware
  progress bars and direction-aware icons throughout.
- Offline-first via IndexedDB persistence + service worker precaching.
- A top-level error boundary so a render crash shows a friendly "let's try
  again" screen instead of a blank page.
- 94 automated tests (Vitest) covering mastery/difficulty math, the
  activity generator (including the world/sticker/story data-integrity
  checks), reward/streak logic, the app reducer, storage round-tripping,
  RTL/language switching, and dashboard stats.

## Sensible next steps

- **True drag-and-drop for SORT**, with forgiving snap-to-target — the
  current build uses "tap the item, then tap the basket" instead, which is
  more reliable for 2-year-old fine motor control but is a simplification
  of the spec's drag-and-drop request.
- **A literal rhythm/tap-along mini-game for Music Meadow** — today it
  reuses FIND/MATCH (identify an instrument, match it to its sound) rather
  than a true "tap-tap, repeat the rhythm" mechanic, which would need a new
  activity type.
- **Recorded voice clips** instead of/alongside browser TTS for a warmer,
  more consistent voice (the abstraction in `audioService.ts` is ready for
  this).
- **Interactive body-part tapping directly on the mascot** (today Body
  Parts uses the same FIND-tile format as every other topic).
- **More mini stories** — the engine supports any number; only 2 are
  authored so far, one each for Rainbow Garden and Animal Forest.
- **Multiple child profiles** (the data model has one `ChildProfile`, but
  `AppState` could hold an array with minimal reducer changes).
- **Puzzle and Trace activity types** (2–3 piece puzzles, finger tracing)
  as two more entries in the Activity Engine.
- **Capacitor packaging** for real Android/iOS builds (see above).

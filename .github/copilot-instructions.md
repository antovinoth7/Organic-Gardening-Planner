# Organic Gardening Planner - Copilot Instructions

Use this file as the working source of guidance for AI contributors. If any markdown docs conflict with the TypeScript code, prefer the live code in `App.tsx`, `src/services/*`, `src/lib/*`, and `src/types/database.types.ts`.

## Current Stack
- Expo SDK 54, React 19, React Native 0.81, TypeScript.
- App entry is `App.tsx`. Navigation is defined in `src/navigation/AppNavigator.tsx`.
- Providers wrap the app in this order: `ErrorBoundary` -> `SafeAreaProvider` -> `ThemeProvider`.
- Navigation is auth-gated with Firebase Auth.
- Main tabs are `Home`, `Plants`, `Care Plan`, `Journal`, and `More`.
- Nested stacks exist for Plants, Journal, and More. Keep existing route names unchanged unless you update all callers.

## Critical Rules
1. **No Firebase Storage** — images are device-local only (MediaLibrary). See `docs/IMAGE_STORAGE.md`.
2. **No `any`** — extend or wrap missing third-party types.
3. **No inline styles** — all styles in `src/styles/*Styles.ts` via `createStyles(theme)`.
4. **No hardcoded colors** — use `useTheme()` tokens only.
5. **No `console.log`** — use `src/utils/logger.ts`.
6. **Never call `terminate()`** on the Firestore instance.
7. **Never mock Firestore** in tests — use emulator.
8. **Imports use `@/` path alias** — not `../../` relative paths.

## Architecture Rules
- Firebase is used for Auth and Firestore only.
- Firestore is initialized with `memoryLocalCache()` in `src/lib/firebase.ts`.
- `refreshAuthToken()` is exported from `src/lib/firebase.ts` and used by services before important reads.
- AsyncStorage is the app-managed cache layer and is accessed through `src/lib/storage.ts`.
- `clearAllData()` should clear only local cached data, not Firestore internals.
- `src/lib/dataCache.ts` is an in-memory freshness cache (30-second TTL). Use `getCached()`/`setCached()` for short-lived reads and `invalidate()`/`invalidateAll()` after mutations.
- **Service pattern**: cache check → `refreshAuthToken()` → `withTimeoutAndRetry()` → update cache → AsyncStorage fallback.
- **Separation**: screens orchestrate UI; services own data; hooks own derived state.
- **Tamil language strategy**: Full-app English ↔ Tamil toggle in Settings (Phase G). No mixing of languages in any screen. Tamil plant names (`tamilName`) ship as data in Phase A2 but are never rendered until Phase G. All UI text is English-only until then.

## Directory Structure
```
src/
  components/   — Reusable UI (.tsx, PascalCase)
  config/zones/ — Agro-climatic zone definitions
  hooks/        — Custom hooks (use*.ts)
  lib/          — Firebase init, storage, imageStorage, dataCache
  migrations/   — Schema migration runner + numbered files
  navigation/   — AppNavigator.tsx
  screens/      — *Screen.tsx
  services/     — Data layer (camelCase .ts, one per domain)
  styles/       — *Styles.ts (createStyles factory)
  theme/        — Color tokens (light/dark)
  types/        — database.types.ts, navigation.types.ts
  utils/        — Pure utilities
```

## Key Patterns
- **Naming**: Components=PascalCase, Screens=`*Screen`, Hooks=`use*`, Services=camelCase, Styles=`*Styles.ts`, Constants=`UPPER_SNAKE_CASE`
- **Components**: functional only (except ErrorBoundary). `Props` interface at top. `useMemo(() => createStyles(theme), [theme])`. `useCallback` for prop functions.
- **Hooks**: one concern each. Cleanup subscriptions. `useFocusEffect` for screen data refresh. Explicit return types.
- **State**: `useState` local, Context cross-screen, no Redux. After mutations call `invalidate()`.
- **Performance**: `FlatList` for 20+ items. No anon functions in JSX. `expo-image` with `cachePolicy="memory-disk"`.
- **Navigation**: defined in `AppNavigator.tsx`. Types in `navigation.types.ts`. Typed hooks only. Primitive route params.
- **Commits**: `type(scope): description` — Conventional Commits. `commitlint` enforced.

## Quick Start
```bash
npm start          # Expo dev server
npm run android    # Android
npm run ios        # iOS
npm run lint       # ESLint (zero errors required)
npm test           # Jest
```

## New Feature Implementation Order
1. Define types in `src/types/database.types.ts` first
2. Create service functions (cache → auth → Firestore → AsyncStorage pattern)
3. Create custom hook wrapping the service calls with `loading` / `error` states
4. Create screen component calling the hook — screens never call services directly
5. Create components with colocated styles files
6. Write unit tests for new service functions and utilities
7. Run `npm run lint` and `npm test` — both must pass
8. Commit with conventional commit format

## Schema Changes
- Required field or data reshape → write migration in `src/migrations/`, bump `LATEST_SCHEMA_VERSION`
- Optional field → no migration, handle `undefined` via `?? fallback`
- Full details: `docs/SCHEMA_MIGRATIONS.md`

## Reference Docs
Read these on demand when working in specific areas:
- **`docs/CONVENTIONS.md`** — TypeScript, naming, component/hook/styling standards, code quality, AI checklist, commit format
- **`docs/SERVICES.md`** — service layer, Firestore shape, specific service behaviors, caching, utilities
- **`docs/COMPONENTS.md`** — component/styles inventory, reusable UI, custom hooks, UI conventions
- **`docs/SCHEMA_MIGRATIONS.md`** — migration runner, schema change workflow
- **`docs/DOMAIN_LOGIC.md`** — agro-climatic zones, seasons, plant/care helpers
- **`docs/TESTING.md`** — test standards, fixture factories, coverage targets
- **`docs/IMAGE_STORAGE.md`** — image storage rules, platform behavior, migration flow

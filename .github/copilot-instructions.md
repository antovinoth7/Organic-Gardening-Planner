# Organic Gardening Planner - Copilot Instructions

Use this file as the working source of guidance for AI contributors. If any markdown docs conflict with the TypeScript code, prefer the live code in `App.tsx`, `src/services/*`, `src/lib/*`, and `src/types/database.types.ts`.

## Current Stack
- Expo SDK 54, React 19, React Native 0.81, TypeScript.
- App entry is `App.tsx`. Navigation is defined in `src/navigation/AppNavigator.tsx`.
- Providers wrap the app in this order: `ErrorBoundary` -> `SafeAreaProvider` -> `ThemeProvider`.
- Navigation is auth-gated with Firebase Auth.
- Main tabs are `Home`, `Plants`, `Care Plan`, `Journal`, and `More`.
- Nested stacks exist for Plants, Journal, and More. Keep existing route names unchanged unless you update all callers.

## Architecture Rules
- Firebase is used for Auth and Firestore only.
- Do not add Firebase Storage. Images are intentionally device-local.
- Firestore is initialized with `memoryLocalCache()` in `src/lib/firebase.ts`.
- `refreshAuthToken()` is exported from `src/lib/firebase.ts` and used by services before important reads.
- Never call `terminate()` on the Firestore instance.
- AsyncStorage is the app-managed cache layer and is accessed through `src/lib/storage.ts`.
- `clearAllData()` should clear only local cached data, not Firestore internals.
- `src/lib/dataCache.ts` is an in-memory freshness cache (30-second TTL) that sits between screens and service calls. It avoids redundant Firestore reads on tab switches. Use `getCached()`/`setCached()` for short-lived reads and `invalidate()`/`invalidateAll()` after mutations. This does not replace AsyncStorage (offline fallback).

## Active Firestore Shape
- `plants`: plant metadata and stored image filename.
- `task_templates`: recurring care schedule records.
- `task_logs`: completion history.
- `journal_entries`: journal text and stored image filenames.
- `user_settings/{uid}`: per-user settings payloads for:
  - `locations`
  - `plantCatalog`
  - `plantCareProfiles`

All app data is scoped by `user_id` or the authenticated user's settings document.

## Image Storage Rules
- Images never go to Firestore or cloud storage.
- Store only filenames in Firestore and backups:
  - Plant photos: `photo_filename`
  - Journal photos: `photo_filenames`
- Treat local URIs as derived values:
  - Plant UI field: `photo_url`
  - Journal UI field: `photo_urls`
- Use `saveImageLocallyWithFilename()` from `src/lib/imageStorage.ts` before saving plant or journal records.
- Use `resolveLocalImageUri()` or `resolveLocalImageUris()` before rendering images.

Platform behavior:
- Android dev builds: prefer `expo-media-library` storage in `Pictures/GardenPlanner`.
- Android Expo Go: fall back to `FileSystem.documentDirectory/garden_images/`.
- iOS: use `FileSystem.documentDirectory/garden_images/`.
- Web: use blob URLs.

Migration behavior:
- `App.tsx` runs `migrateImagesToMediaLibrary()` after authentication on Android.
- `src/services/backup.ts` also runs Android migration after image import.
- Preserve this flow when changing image storage.

## Service Layer Conventions
- Keep Firestore and cache logic inside `src/services/*`.
- Typical service flow is:
  1. Check `auth.currentUser`.
  2. Refresh auth with `refreshAuthToken()` before important reads.
  3. Wrap Firestore operations with `withTimeoutAndRetry()` where practical.
  4. Convert Firestore `Timestamp` values to ISO strings for app models.
  5. Update AsyncStorage caches through `getData()` and `setData()`.
  6. Fall back to cached data for read failures.
- Prefer existing service modules over duplicating Firestore access from screens.

Specific current behavior to preserve:
- `src/services/plants.ts`
  - Uses paginated reads.
  - Soft-deletes plants with `is_deleted` and `deleted_at`.
  - Resolves image filenames to local URIs before returning plants.
  - Cascades plant deletion into tasks via `deleteTasksForPlantIds()`.
- `src/services/tasks.ts`
  - Avoids extra Firestore composite index requirements by filtering and sorting in memory in some queries.
  - `markTaskDone()` writes a task log, updates `next_due_at`, and also updates plant last-care fields.
  - Recurring task due times are normalized to 6:00 PM.
  - `syncCareTasksForPlant()` auto-generates water, fertilise, prune, and coconut harvest (age-derived) tasks from plant settings.
  - The full `TaskType` union is `water | fertilise | prune | repot | spray | mulch | harvest`. Repot, spray, and mulch are user-created; sync does not auto-generate them.
- `src/services/journal.ts`
  - Supports multiple images through `photo_filenames` and `photo_urls`.
  - Still carries the legacy single `photo_url` field for backward compatibility.
  - `getJournalMetadata()` fetches entries without resolving images, used by `CalendarScreen` for lightweight reads.
- `src/services/backup.ts`
  - Supports images-only ZIP export/import.
  - Does not currently support data-only or full data-plus-images backups.

## Domain Logic
- The app is intentionally tailored to Kanyakumari / South Tamil Nadu gardening conditions.
- `src/utils/seasonHelpers.ts` defines a four-season model:
  - `summer`
  - `sw_monsoon`
  - `ne_monsoon`
  - `cool_dry`
- Watering frequencies and reminders are season-aware.
- `src/utils/plantHelpers.ts` contains important domain behavior for:
  - expected harvest dates
  - companion planting
  - pest and disease suggestions
  - coconut age-based care guidance
  - coconut nutrient deficiency guidance
- `src/utils/plantCareDefaults.ts` provides plant care profiles, pruning techniques, and static pruning defaults.
- Preserve this regional logic unless a change is explicitly requested.

## Plant and Settings Data
- Core types live in `src/types/database.types.ts`. Update types first when changing schema.
- `Plant` includes:
  - care frequencies
  - health status
  - growth stage
  - pest and disease history
  - soft-delete fields
  - coconut-specific metrics
  - `care_schedule` metadata
- Plant catalog defaults and aliases live in `src/services/plantCatalog.ts`.
- Care profile overrides live in `src/services/plantCareProfiles.ts`.
- Location defaults and normalization live in `src/services/locations.ts`.
- These settings are cached locally and synced through `user_settings`.

## Styles Architecture
- All styles live in `src/styles/` as separate files. No screen or component has inline `StyleSheet.create`.
- Style files export a `createStyles(theme)` factory function that takes the theme object and returns a `StyleSheet`.
- Exception: `errorBoundaryStyles.ts` exports a static `styles` object (class component, no theme).
- Exception: `floatingTabBarStyles.ts` exports both `createStyles` (tab bar) and `fabStyles` (FAB button).
- Exception: `calendarStyles.ts` also exports the `getStartOfWeek()` helper alongside styles.
- Naming convention: `src/styles/<camelCaseName>Styles.ts` matching the screen or component name.
- When adding a new screen or component, create its style file in `src/styles/` following this pattern.
- In screens/components, import and call `createStyles(theme)` — use `useMemo(() => createStyles(theme), [theme])` for larger screens.

Current style files (25 total):
- **Screens (13):** `authStyles`, `moreStyles`, `settingsStyles`, `archivedPlantsStyles`, `journalFormStyles`, `manageLocationsStyles`, `journalStyles`, `plantsStyles`, `managePlantCatalogStyles`, `todayStyles`, `calendarStyles`, `plantFormStyles`, `plantDetailStyles`
- **Components (12):** `collapsibleSectionStyles`, `errorBoundaryStyles`, `floatingLabelInputStyles`, `floatingTabBarStyles`, `harvestHistorySectionStyles`, `pestDiseaseHistorySectionStyles`, `photoSourceModalStyles`, `plantAddWizardStyles`, `plantCardStyles`, `plantEditFormStyles`, `taskCardStyles`, `themedDropdownStyles`

## Extracted Components
Larger screens have been decomposed into focused sub-components organized in `src/components/`:
- **`calendar/`:** `MonthCalendarView`, `WeekCalendarView`, `SwipeableTaskCard`
- **`forms/`:** `PlantEditForm`, `PlantAddWizard`, `EditBasicInfoSection`, `EditLocationSection`, `EditCareScheduleSection`, `EditCoconutSection`, `WizardStep1`, `WizardStep2`, `WizardStep3`
- **`modals/`:** `DiscardChangesModal`, `TaskCompletionModal`, `CreateTaskModal`, `PestDiseaseModal`, `PhotoSourceModal`
- **Root:** `PestDiseaseHistorySection`, `HarvestHistorySection`, `LocationProfileEditor`, `PlantFilterSheet`

Prefer reusing these over rebuilding similar UI in new screens.

## Custom Hooks
- `src/hooks/useCalendarData.ts` — data fetching, filtering, and state logic for `CalendarScreen`.
- `src/hooks/usePlantFormData.ts` — catalog/location/profile loading for `PlantFormScreen`.

When adding complex data logic to a screen, consider extracting it into a custom hook in `src/hooks/`.

## UI Conventions
- Use `useTheme()` for colors and shared tokens.
- Use `useThemeMode()` for theme mode changes.
- Prefer existing themed styles over new hardcoded colors, unless matching an already hardcoded local accent in that screen.
- Most screens use safe area insets and refresh on focus; preserve those patterns when modifying screens.
- Reuse existing shared components where possible:
  - `PlantCard`
  - `TaskCard`
  - `PhotoSourceModal`
  - `CollapsibleSection`
  - `ErrorBoundary`
  - `FloatingLabelInput`
  - `FloatingTabBar` (includes `AnimatedFAB` and `FloatingTabBarProvider`)
  - `ThemedDropdown`

## Reliability and Logging
- Sentry is initialized in `App.tsx` when a DSN is configured.
- Global error and unhandled promise rejection handlers are already wired up in `App.tsx`.
- Use `logError()`, `logAuthError()`, `logStorageError()`, and `setErrorLogUserId()` from `src/utils/errorLogging.ts` instead of ad hoc error handling when touching existing flows.
- `safeStorage` in `src/utils/safeStorage.ts` is the defensive wrapper for AsyncStorage access.
- `src/utils/logger.ts` provides production-safe console logging.

## Backup Guidance
- Current user-facing backup in Settings is images only.
- Do not reintroduce `exportBackup`, `importBackup`, or full ZIP flows unless the feature is intentionally rebuilt across services, UI, and docs.
- When importing images, matching is filename-based and should continue to work for both plants and journal entries.

## Additional Utilities
- `src/utils/appLifecycle.ts` — app lifecycle management, used in `App.tsx`.
- `src/utils/dateHelpers.ts` — date parsing, formatting helpers, and Firestore timestamp conversion used across services.
- `src/utils/errorTracker.ts` — error tracking service.
- `src/utils/networkState.ts` — network connectivity state, used by `firestoreTimeout.ts`.
- `src/utils/textSanitizer.ts` — text sanitization for user input.
- `src/utils/zipHelper.ts` — ZIP utilities used by backup.
- `src/utils/firestoreTimeout.ts` — `withTimeoutAndRetry()` wrapper for Firestore operations.

## Development Commands
```bash
npm start
npm run android
npm run ios
npm run web
npm run lint
```

## Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Components | PascalCase `.tsx` | `PlantCard.tsx` |
| Screens | PascalCase + `Screen` suffix | `PlantDetailScreen.tsx` |
| Hooks | `use` prefix, camelCase | `useCalendarData.ts` |
| Services | camelCase `.ts` | `plants.ts`, `tasks.ts` |
| Style files | `*Styles.ts` in `src/styles/` | `plantCardStyles.ts` |
| Constants | `UPPER_SNAKE_CASE` | `DONUT_SIZE`, `ANIMATION_DURATION` |
| Functions | camelCase | `getTasksByDate`, `createPlantEntry` |
| Types / Interfaces | PascalCase | `Plant`, `TaskTemplate` |

## TypeScript Standards

- `strict: true` is enforced. Never add `// @ts-ignore` or `// @ts-expect-error` without an explanatory comment.
- Prefer `interface` for object shapes, `type` for unions/aliases.
- Use enums for closed stable sets (e.g. `JournalEntryType`). Use union string literals for flexible sets (e.g. `TaskType`).
- Never use `any`. If a third-party type is missing, extend or wrap it.
- Use `Partial<T>`, `Pick<T, K>`, `Record<K, V>` generics rather than duplicating shapes.
- Type all hook return values explicitly; don't rely on inference for public-facing hook contracts.
- Avoid `as` casts; use type guards instead.
- Update `src/types/database.types.ts` first whenever the Firestore schema changes.

## Component Standards

- Functional components only. No class components except `ErrorBoundary`.
- Define a `Props` interface at the top of each component file and destructure props in the function signature.
- Keep components focused — split at ~300 lines.
- Styles live in `src/styles/<name>Styles.ts` via `createStyles(theme)`. Never use inline `StyleSheet.create` inside a component file.
- Access theme via `useTheme()`. Never hardcode colors.
- Use `useCallback` and `useMemo` for values passed to child components.
- Add `accessible`, `accessibilityLabel`, and `accessibilityRole` where relevant.

### Component Template

```tsx
import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { createStyles } from '../styles/myComponentStyles';

interface Props {
  value: string;
  onPress: () => void;
}

export function MyComponent({ value, onPress }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Text style={styles.label}>{value}</Text>
    </TouchableOpacity>
  );
}
```

## Hook Standards

- One concern per hook. Compose small hooks rather than building monolithic ones.
- Always clean up subscriptions, intervals, and async operations:
  - Use an `isMounted` ref to guard `setState` after unmount.
  - Return a cleanup function from `useEffect`.
- Use `useFocusEffect` (React Navigation) instead of `useEffect` when data must refresh on screen re-focus.
- Memoize expensive derived data with `useMemo`. Use `Map` for O(1) lookups over arrays.
- Export hook return types explicitly.
- When adding complex data logic to a screen, extract it into a custom hook in `src/hooks/`.

## State Management Rules

- `useState` for local UI state.
- React Context API for cross-screen state (theme, tab bar scroll). No Redux or external store.
- Server/async state lives inside custom hooks with explicit loading/error states.
- After any mutation, call the relevant service's `invalidate()` to mark the in-memory cache stale.

## Performance Standards

- Use `FlatList` / `SectionList` for any list that may exceed ~20 items. Never `ScrollView` + `.map()` for dynamic lists.
- Memoize `renderItem` and `keyExtractor` with `useCallback`.
- Render images with `expo-image` and `cachePolicy="memory-disk"`.
- Avoid anonymous functions in JSX props — extract to `useCallback`.
- Add `removeClippedSubviews` on long flat lists.
- Debounce user search input (minimum 300 ms).

## Navigation Standards

- Navigator definitions live in `src/navigation/AppNavigator.tsx`. Do not define navigators inside screen files.
- Screen components access navigation via `useNavigation()` and `useRoute()` hooks only.
- Pass only primitives or serialisable values via route params. Load full objects inside the screen.
- Coordinate scroll-hide behaviour through `TabBarScrollContext`; do not reimplement scroll detection in individual screens.
- Keep existing route names unchanged unless all callers are updated in the same change.

## Code Quality Rules

- No `console.log` in committed code. Use `src/utils/logger.ts` or remove debug statements.
- No commented-out code blocks. Delete dead code; git history preserves it.
- No TODO comments without an associated issue number.
- ESLint must pass with zero errors before committing (`npm run lint`).
- Keep functions ≤ 50 lines; extract helpers when exceeded.
- Magic numbers must be named constants.
- No docstrings, comments, or type annotations added to code that was not changed.
- No error handling for impossible scenarios; no abstractions for one-off operations.

## File Creation Checklist

Before creating a new file:
1. Does an existing file already handle this concern?
2. Is the file in the correct `src/` subdirectory?
3. Does it follow the naming convention above?
4. For a new component or screen: is there a matching `*Styles.ts` in `src/styles/`?
5. For a new service: does it implement the cache → auth refresh → Firestore → AsyncStorage fallback pattern?

## When You Change Behavior
- Update this file if contributor guidance changes.
- Keep `README.md` as the primary architecture and usage document, and update any remaining docs only if you also bring them in line with the code.

## Commit Message Standards

Follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): description`

| Type | When to use |
|---|---|
| `feat` | New user-visible feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behaviour change |
| `chore` | Tooling, deps, config |
| `test` | Adding or fixing tests |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `perf` | Performance improvement |

**Scope** = affected module: `plants`, `tasks`, `journal`, `auth`, `calendar`, `theme`, `nav`

`commitlint` enforces this on every commit. Do not bypass with `--no-verify`.

## Testing Standards

- Test files live in `src/__tests__/` with `*.test.ts` or `*.test.tsx` extensions.
- Every new service function must have a unit test. Every new utility function must have a unit test.
- Do NOT mock Firestore — use the Firebase emulator for integration tests.
- Test fixtures live in `src/__tests__/fixtures/` as exported factory functions.
- Coverage target: 30% minimum, growing to 70% over sprints.
- Run `npm test` before pushing.

## AI Code Generation Checklist

Before generating any code for this project, verify each item:

**Architecture**

- New code is in the correct `src/` subdirectory
- File follows the naming convention for its type (see Naming Conventions table)
- New component has a colocated `*Styles.ts` in `src/styles/`
- New service implements cache → auth → Firestore → AsyncStorage fallback
- Reuses existing utilities: `withTimeoutAndRetry`, `dataCache`, `refreshAuthToken`, `logger`

**TypeScript**

- No `any` types without an inline justifying comment
- `Props` interface defined at the top of every component file
- Hook return type is explicitly typed as a named interface
- No `as` casts — use type guards

**Styling**

- No inline style objects in JSX
- All colors reference `theme.*` — zero hardcoded hex values
- Spacing is a multiple of 4 or 8
- Components use `styles = useMemo(() => createStyles(theme), [theme])`

**State & Performance**

- Every function passed as a prop is wrapped in `useCallback`
- Derived data passed as props is wrapped in `useMemo`
- Lists >20 items use `FlatList`, not `ScrollView + .map()`

**Quality**

- Zero `console.log` calls — use `src/utils/logger.ts` or remove
- No TODO comments without an issue number
- Functions are ≤ 50 lines; helpers extracted if exceeded
- Magic numbers are named `UPPER_SNAKE_CASE` constants
- `npm run lint` passes with zero errors after code generation

## New Feature Implementation Order

1. Define new TypeScript interfaces/types in `src/types/database.types.ts` first
2. Create service functions (cache → auth → Firestore → AsyncStorage pattern)
3. Create custom hook wrapping the service calls with `loading` / `error` states
4. Create screen component calling the hook — screens never call services directly
5. Create components with colocated styles files
6. Write unit tests for new service functions and utilities
7. Run `npm run lint` and `npm test` — both must pass
8. Commit with conventional commit format

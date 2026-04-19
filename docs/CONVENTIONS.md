# Coding Conventions

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

---

## TypeScript Standards

- `strict: true` and `noUncheckedIndexedAccess: true` are enforced. Array/object index access returns `T | undefined` — use `!` when provably valid, or `?? fallback`.
- Never add `// @ts-ignore` or `// @ts-expect-error` unless unavoidable, and always document why.
- Prefer `interface` for object shapes, `type` for unions/aliases.
- Use enums for closed, stable sets (e.g. `JournalEntryType`). Use union string literals for flexible sets (e.g. `TaskType`).
- Never use `any`. If a third-party type is missing, extend or wrap it. If ESLint `no-explicit-any` is suppressed, it is intentional for interop only.
- Use `Partial<T>`, `Pick<T, K>`, `Record<K, V>` generics rather than duplicating shapes.
- Type all hook return values explicitly; don't rely on inference for public-facing hook contracts.
- Avoid `as` casts; use type guards instead.
- Path alias `@/` maps to `src/` — use `import { Foo } from '@/components/Foo'` instead of relative `../../` imports.
- Update `src/types/database.types.ts` first whenever the Firestore schema changes.

---

## Component Standards

- Functional components only. No class components except `ErrorBoundary`.
- Define `Props` interface at the top of each component file and destructure props in the function signature.
- Keep components focused — split at ~300 lines.
- Styles live in `src/styles/<name>Styles.ts` via `createStyles(theme)`. Never inline `StyleSheet.create` inside a component file.
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

---

## Hook Standards

- One concern per hook. Compose small hooks rather than building monolithic ones.
- Always clean up subscriptions, intervals, and async operations:
  - Use `isMounted` ref pattern to guard `setState` after unmount.
  - Return cleanup from `useEffect`.
- Use `useFocusEffect` (React Navigation) instead of `useEffect` when data must refresh on screen re-focus.
- Memoize expensive derived data with `useMemo`. Use `Map` for O(1) lookups over arrays.
- Export hook return type explicitly (named interface or inline type).
- When adding complex data logic to a screen, extract it into a custom hook in `src/hooks/`.

---

## State Management

- `useState` for local UI state.
- React Context API for cross-screen state (theme, tab bar scroll). No Redux or external store.
- Server/async state lives inside custom hooks with explicit loading/error states.
- After any mutation, call the service's `invalidate()` helper to mark in-memory cache stale.

---

## Styling Standards

- Use React Native `StyleSheet` exclusively. No inline style objects in JSX.
- Every component has a colocated `*Styles.ts` file that exports `createStyles(theme: Theme)`.
- Spacing values: multiples of 4 or 8 (`4, 8, 12, 16, 20, 24`).
- Border radius: `8` for cards/inputs, `12` for modals/large surfaces, `999` for pills/badges.
- Typography: define font sizes from the theme (`theme.typography` or explicit values: `12, 14, 16, 18, 20, 24`).
- Never use platform-specific style hacks unless required; prefer cross-platform abstractions.

---

## Navigation Standards

- Navigation lives in `src/navigation/AppNavigator.tsx`. Do not define navigators inside screen files.
- All param lists are defined in `src/types/navigation.types.ts` — add new screens there first.
- Use typed hooks: `useNavigation<ScreenNavigationProp>()` and `useRoute<ScreenRouteProp>()`.
- Never use `useNavigation()` untyped.
- For cross-stack navigation, use `CompositeNavigationProp`.
- Pass only primitive or serialisable params via route params. Load full objects inside the screen.
- Use `refresh?: number` (set to `Date.now()`) to trigger re-fetch when navigating back.
- `FloatingTabBar` hides on scroll — coordinate via `TabBarScrollContext`; do not re-implement scroll detection.
- Keep existing route names unchanged unless all callers are updated in the same change.

---

## Performance Standards

- Use `FlatList` / `SectionList` for any list that may exceed ~20 items. Never `ScrollView` + `.map()` for dynamic lists.
- Memoize `renderItem` and `keyExtractor` with `useCallback`.
- Image rendering: use `expo-image` with `cachePolicy="memory-disk"`.
- Avoid anonymous functions in JSX props — extract to `useCallback`.
- Add `removeClippedSubviews` on long flat lists.
- Debounce user search input (minimum 300ms).

---

## Error Handling

- Use `ErrorBoundary` component around screen trees.
- Never swallow errors silently. At minimum, log to Sentry.
- User-facing errors: use a toast or modal — never `console.error` alone.
- Network errors: show offline indicator; retry from cache.
- Auth errors: trigger re-auth flow, do not expose raw Firebase error messages.

---

## Code Quality Rules

- No `console.log` in committed code. Use `src/utils/logger.ts` or remove.
- No commented-out code blocks. Delete dead code; git history preserves it.
- No TODO comments without an associated issue number.
- ESLint must pass with zero errors (`npm run lint`).
- Keep functions ≤ 50 lines; extract helpers when exceeded.
- Magic numbers must be named constants.
- No docstrings, comments, or type annotations added to code that was not changed.
- No error handling for impossible scenarios; no abstractions for one-off operations.

---

## What NOT to Do

- Do not add features, refactor code, or make "improvements" beyond what was asked.
- Do not add feature flags or backwards-compat shims.
- Do not hardcode colours, spacing, or font sizes outside the theme/styles system.
- Do not use Firebase Storage (images go to MediaLibrary).
- Do not mock the database in tests.

---

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

---

## AI Code Generation Checklist

Before generating any code for this project, verify:

**Architecture**
- New code is in the correct `src/` subdirectory
- File follows the naming convention for its type
- New component has a colocated `*Styles.ts` in `src/styles/`
- New service implements cache → auth → Firestore → AsyncStorage fallback
- Reuses existing utilities: `withTimeoutAndRetry`, `dataCache`, `refreshAuthToken`, `logger`

**TypeScript**
- No `any` types without an inline justifying comment
- `Props` interface defined at the top of every component file
- Hook return type is explicitly typed as a named interface
- No `as` casts — use type guards
- Index access guarded with `!` (when provably non-null) or `?? fallback`
- Imports use `@/` path alias, not `../../` relative paths

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

---

## File Creation Checklist

Before creating a new file:
1. Does an existing file already handle this concern?
2. Is the file in the correct `src/` subdirectory?
3. Does it follow the naming convention?
4. For a new component or screen: is there a matching `*Styles.ts` in `src/styles/`?
5. For a new service: does it implement the cache → auth refresh → Firestore → AsyncStorage fallback pattern?

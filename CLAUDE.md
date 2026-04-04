# Organic Gardening Planner — Claude Code Standards

## Project Overview

React Native + Expo application for personal organic garden management. Targets Android/iOS. Uses Firebase (Auth + Firestore) with a local-first, offline-capable architecture. No Firebase Storage — images are stored in device MediaLibrary. Tamil Nadu climate and context as the default domain locale.

---

## Architecture Principles

- **Offline-first**: Always read from in-memory cache → AsyncStorage → Firestore, in that order.
- **Separation of concerns**: Screens orchestrate UI; services own data; hooks own derived state.
- **Free-tier sustainability**: Avoid Firestore reads that can be served from cache. Batch writes where possible.
- **No over-engineering**: Match complexity to the actual requirement. No speculative abstractions.

---

## Directory Structure

```
src/
├── components/     # Reusable UI components (.tsx, PascalCase filenames)
├── hooks/          # Custom React hooks (use*.ts)
├── screens/        # Screen-level components (*Screen.tsx)
├── services/       # Data access layer (camelCase .ts, one file per domain)
├── lib/            # Firebase init, storage helpers, image handling, caching
├── styles/         # StyleSheet files colocated per component (*Styles.ts)
├── theme/          # Colors and theme tokens (light/dark)
├── types/          # Shared TypeScript types and database types
└── utils/          # Pure utility functions, grouped by domain
```

---

## Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Components | PascalCase `.tsx` | `PlantCard.tsx` |
| Screens | PascalCase + `Screen` suffix | `PlantDetailScreen.tsx` |
| Hooks | `use` prefix, camelCase | `useCalendarData.ts` |
| Services | camelCase `.ts` | `plants.ts`, `tasks.ts` |
| Style files | `*Styles.ts`, colocated | `plantCardStyles.ts` |
| Constants | `UPPER_SNAKE_CASE` | `DONUT_SIZE`, `ANIMATION_DURATION` |
| Functions | camelCase | `getTasksByDate`, `createPlantEntry` |
| Types / Interfaces | PascalCase | `Plant`, `TaskTemplate` |

---

## TypeScript Standards

- `strict: true` is enforced. Never add `// @ts-ignore` or `// @ts-expect-error` unless unavoidable, and always document why.
- Prefer `interface` for object shapes, `type` for unions/aliases.
- Use enums for closed, stable sets (e.g. `JournalEntryType`). Use union string literals for flexible/open sets (e.g. `TaskType`).
- Never use `any`. If a third-party type is missing, extend or wrap it. If ESLint `no-explicit-any` is suppressed, it is intentional for interop only.
- Use `Partial<T>`, `Pick<T, K>`, `Record<K, V>` generics rather than duplicating shapes.
- Type all hook return values explicitly; don't rely on inference for public-facing hook contracts.
- Avoid `as` casts; use type guards instead.

---

## Component Standards

- Functional components only. No class components except `ErrorBoundary`.
- Define `Props` interface at the top of each component file.
- Destructure props in the function signature.
- Keep components focused — if a component needs more than ~300 lines, split it.
- Styles live in a sibling `*Styles.ts` file created via `createStyles(theme)` factory. Never inline style objects.
- Access theme via `useTheme()` hook. Never hardcode colors.
- Use `useCallback` and `useMemo` for values passed as props to child components to prevent unnecessary re-renders.
- Accessibility: add `accessible`, `accessibilityLabel`, `accessibilityRole` where relevant.

### Component Template

```tsx
import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { createStyles } from './myComponentStyles';

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

- One concern per hook. Compose small hooks to build complex ones.
- Always clean up subscriptions, intervals, and async operations:
  - Use `isMounted` ref pattern to guard `setState` after unmount.
  - Return cleanup from `useEffect`.
- Use `useFocusEffect` (React Navigation) instead of `useEffect` when data must refresh on screen re-focus.
- Memoize expensive derived data with `useMemo`. Use `Map` for O(1) lookups over arrays.
- Export hook return type explicitly (named interface or inline type).

---

## State Management

- **Component state**: `useState` for local UI state.
- **Cross-screen state**: React Context API (theme, tab bar scroll coordination). No Redux or external store.
- **Server/async state**: Managed inside custom hooks with loading/error states. Services return typed data; hooks transform it.
- **Cache invalidation**: After any mutation, call the service's `invalidate()` helper to mark in-memory cache stale.

---

## Styling Standards

- Use React Native `StyleSheet` exclusively. No inline style objects in JSX.
- Every component has a colocated `*Styles.ts` file that exports `createStyles(theme: Theme)`.
- Spacing values: use multiples of 4 or 8 (`4, 8, 12, 16, 20, 24`).
- Border radius: `8` for cards/inputs, `12` for modals/large surfaces, `999` for pills/badges.
- Typography: define font sizes from the theme (`theme.typography` or explicit values: `12, 14, 16, 18, 20, 24`).
- Never use platform-specific style hacks unless required; prefer cross-platform abstractions.

---

## Service Layer Standards

- One service file per Firestore collection/domain (e.g. `plants.ts`, `tasks.ts`).
- Every public service function must:
  1. Check in-memory cache (return if fresh, <30s).
  2. Refresh auth token before Firestore calls.
  3. Apply 15s timeout + 2 retries for network requests.
  4. Update AsyncStorage and in-memory cache on success.
  5. Fall back to AsyncStorage on network failure.
- Return typed data; never return `any`.
- Log errors to Sentry with context (user ID, function name, sanitised params). Mask PII (email → `us**@domain.com`).

---

## Firebase Rules

- **Auth**: Email/password only. Token refresh every 50 minutes (tokens expire at 60 min).
- **Firestore**: Text data only (no binary blobs). Images stored in device MediaLibrary.
- **No Firebase Storage**: Keeps the app within the free tier.
- Prefer batch writes for multi-document mutations.

---

## Error Handling

- Wrap all async operations in the `asyncWrapper` utility.
- Use `ErrorBoundary` component around screen trees.
- Never swallow errors silently. At minimum, log to Sentry.
- User-facing errors: use a toast or modal — never `console.error` alone.
- Network errors: show offline indicator; retry from cache.
- Auth errors: trigger re-auth flow, do not expose raw Firebase error messages to the user.

---

## Performance Standards

- Use `FlatList` / `SectionList` for any list that may exceed ~20 items. Never `ScrollView` + `.map()` for dynamic lists.
- Memoize list `renderItem` and `keyExtractor` with `useCallback`.
- Image rendering: use `expo-image` with `cachePolicy="memory-disk"`.
- Avoid anonymous functions in JSX props — extract to `useCallback`.
- Add `removeClippedSubviews` on long flat lists.
- Debounce user search input (minimum 300ms).

---

## Navigation Standards

- Navigation lives in the root `App.tsx` navigator definitions.
- Screen components do not import navigation types directly — use `useNavigation()` and `useRoute()` hooks.
- Pass only primitive or serialisable params via route params. Load full objects inside the screen.
- `FloatingTabBar` hides on scroll — coordinate via `TabBarScrollContext`; do not re-implement scroll detection in individual screens.

---

## Code Quality Rules

- No `console.log` in committed code. Use the Sentry logger or remove debug logs before committing.
- No commented-out code blocks. Delete dead code; git history preserves it.
- No TODO comments without an associated issue number.
- ESLint must pass with zero errors before committing (`eslint src/`).
- Keep functions ≤ 50 lines; extract helpers when exceeded.
- Magic numbers must be named constants.

---

## File Creation Checklist

Before creating a new file, verify:
1. Does an existing file already handle this concern?
2. Is the file in the correct directory per the structure above?
3. Does it follow the naming convention?
4. For a new component: is there a colocated `*Styles.ts` file?
5. For a new service: does it implement the cache → network → fallback pattern?

---

## What NOT to Do

- Do not add docstrings, comments, or type annotations to code that was not changed.
- Do not add error handling for impossible scenarios.
- Do not create abstractions for one-off operations.
- Do not add feature flags or backwards-compat shims.
- Do not hardcode colours, spacing, or font sizes outside the theme/styles system.
- Do not use Firebase Storage (images go to MediaLibrary).
- Do not mock the database in tests — integration tests must hit a real or emulated backend.

# Components & Styles Inventory

## Styles Architecture

- All styles live in `src/styles/` as separate files. No screen or component has inline `StyleSheet.create`.
- Style files export a `createStyles(theme)` factory function that takes the theme object and returns a `StyleSheet`.
- Exception: `errorBoundaryStyles.ts` exports a static `styles` object (class component, no theme).
- Exception: `floatingTabBarStyles.ts` exports both `createStyles` (tab bar) and `fabStyles` (FAB button).
- Exception: `calendarStyles.ts` also exports the `getStartOfWeek()` helper alongside styles.
- Naming convention: `src/styles/<camelCaseName>Styles.ts` matching the screen or component name.
- When adding a new screen or component, create its style file in `src/styles/` following this pattern.
- In screens/components, import and call `createStyles(theme)` — use `useMemo(() => createStyles(theme), [theme])` for larger screens.

### Current Style Files (25 total)

**Screens (13):** `authStyles`, `moreStyles`, `settingsStyles`, `archivedPlantsStyles`, `journalFormStyles`, `manageLocationsStyles`, `journalStyles`, `plantsStyles`, `managePlantCatalogStyles`, `todayStyles`, `calendarStyles`, `plantFormStyles`, `plantDetailStyles`

**Components (12):** `collapsibleSectionStyles`, `errorBoundaryStyles`, `floatingLabelInputStyles`, `floatingTabBarStyles`, `harvestHistorySectionStyles`, `pestDiseaseHistorySectionStyles`, `photoSourceModalStyles`, `plantAddWizardStyles`, `plantCardStyles`, `plantEditFormStyles`, `taskCardStyles`, `themedDropdownStyles`

---

## Extracted Components

Larger screens have been decomposed into focused sub-components organized in `src/components/`:

### `calendar/`
- `MonthCalendarView`, `WeekCalendarView`, `SwipeableTaskCard`

### `forms/`
- `PlantEditForm`, `PlantAddWizard`
- `EditBasicInfoSection`, `EditLocationSection`, `EditCareScheduleSection`, `EditCoconutSection`
- `WizardStep1`, `WizardStep2`, `WizardStep3`

### `modals/`
- `DiscardChangesModal`, `TaskCompletionModal`, `CreateTaskModal`, `PestDiseaseModal`, `PhotoSourceModal`

### Root components
- `PestDiseaseHistorySection`, `HarvestHistorySection`, `LocationProfileEditor`, `PlantFilterSheet`

Prefer reusing these over rebuilding similar UI in new screens.

---

## Reusable Shared Components

- `PlantCard` — plant list item
- `TaskCard` — task list item
- `PhotoSourceModal` — camera/gallery picker
- `CollapsibleSection` — expandable section wrapper
- `ErrorBoundary` — class component error boundary
- `FloatingLabelInput` — animated label text input
- `FloatingTabBar` (includes `AnimatedFAB` and `FloatingTabBarProvider`) — tab bar with scroll-hide
- `ThemedDropdown` — themed dropdown picker

---

## Custom Hooks

- `src/hooks/useCalendarData.ts` — data fetching, filtering, and state logic for `CalendarScreen`.
- `src/hooks/usePlantFormData.ts` — catalog/location/profile loading for `PlantFormScreen`.
- `src/hooks/usePlantFormState.ts` — form state management for plant forms.

When adding complex data logic to a screen, extract it into a custom hook in `src/hooks/`.

---

## UI Conventions

- Use `useTheme()` for colors and shared tokens.
- Use `useThemeMode()` for theme mode changes.
- Prefer existing themed styles over new hardcoded colors.
- Most screens use safe area insets and refresh on focus; preserve those patterns.
- Main tabs: `Home`, `Plants`, `Care Plan`, `Journal`, `More`.
- Nested stacks exist for Plants, Journal, and More. Keep existing route names unchanged unless you update all callers.
- Providers wrap the app: `ErrorBoundary` → `SafeAreaProvider` → `ThemeProvider`.

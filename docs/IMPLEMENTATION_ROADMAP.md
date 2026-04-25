# Organic Gardening Planner — Implementation Roadmap

> Generated: April 12, 2026
> Last updated: April 25, 2026 — Phase A3 deferred to after Phase H; F6 expanded to auto-computation + annual cycling for fruit trees; Phase B2 Bed Management added (generic farm layout, 12 sub-phases, cross-cuts 16 existing files); B.9 care task enable/disable toggles added (watering/fertilising/pruning per-plant ON/OFF, no migration required)
> Previous: April 18, 2026 — Phase A2 shipped; roadmap restructured from priority-based to screen-by-screen approach; F2/F3 expanded + F9 Planter-style form enrichment (2.10–2.13) + F10 Garden Reference Guide (2.14–2.16) + hybrid configurability for pests/diseases/beneficials; F11 Pest & Disease Reference Screens (2.17–2.18) added
> Status: Phase 0 shipped; Phase A shipped; Phase A2 shipped
> Scope: Solo developer, iterative build, Firebase free-tier

---

## Progress Tracker

| Phase                                        | Status      | Shipped    |
| -------------------------------------------- | ----------- | ---------- |
| Phase 0 — Stabilization                      | ✅ Complete | 2026-04-16 |
| Phase A — Config: Pest & Disease Reference   | ✅ Complete | 2026-04-18 |
| Phase A2 — Config: Catalog Enrichment        | ✅ Complete | 2026-04-18 |
| Phase B — Plants                             | ⚪ Planned  | —          |
| Phase B2 — Bed Management                    | ⚪ Planned  | —          |
| Phase C — Home                               | ⚪ Planned  | —          |
| Phase D — Calendar                           | ⚪ Planned  | —          |
| Phase E — Journal                            | ⚪ Planned  | —          |
| Phase F — Settings & Cross-Cutting           | ⚪ Planned  | —          |
| Phase G — Tamil i18n                         | ⚪ Planned  | —          |
| Phase H — Advanced                           | ⚪ Planned  | —          |
| Phase A3 — Config: Beneficials + Custom CRUD | ⏭ Deferred | —          |

**Phase 0 delivered:**

- Schema migration runner (`src/migrations/`) + `schema_version` tracking on `user_settings`
- First migration: `001_backfill_district` (Kanyakumari / high_rainfall zone)
- Agro-climatic zone config extracted from `seasonHelpers.ts` into `src/config/zones/`
- `seasonHelpers.ts` functions now accept optional `zone?` param, default to `HIGH_RAINFALL_ZONE`
- Journal `tags?: string[]` field + predefined tag chips + tag filter in list view
- Fixed pre-existing broken `jest.config.js` (removed problematic setup, added `@/` path alias)
- Added tests: `seasonHelpers.test.ts` (23 tests including custom zone support)

**Phase A delivered:**

- Types: `PestEntry`, `DiseaseEntry`, `OrganicControlItem`, `PestCategory`, `DiseaseCategory`, `RiskLevel`, `TreatmentEffort`, `ControlMethod` in `database.types.ts`
- Config data: `src/config/pests/` (36 entries across 5 categories), `src/config/diseases/` (36 entries across 4 categories) with registry lookup functions
- Asset scaffolding: `src/config/referenceAssets.ts` with `getPestImage()`/`getDiseaseImage()` + `assets/reference/pests/` and `assets/reference/diseases/` directories ready for bundled WebP images
- Navigation: 4 new routes in `MoreStackParamList`, 4 screens in `AppNavigator.tsx` MoreStack, 2 new menu items in `MoreScreen.tsx`
- Styles: `referenceListStyles.ts` (search + grouped SectionList), `referenceDetailStyles.ts` (hero image, sections, treatment cards, risk badges, plant tags)
- Screens: `PestListScreen`, `PestDetailScreen`, `DiseaseListScreen`, `DiseaseDetailScreen` — grouped by category, search filter, 5 detail sections (Identification, Damage, Organic Prevention, Organic Treatment, Seasonal Risk, Plants Affected), hero image with emoji fallback
- Tests: `pests.test.ts` (13 tests), `diseases.test.ts` (12 tests) — registry shape, lookups, field completeness, treatment validation

**Phase A2 delivered:**

- Types: `Lifecycle`, `ToleranceLevel`, `FeedingIntensity`, `NumericRange` in `database.types.ts`; `PlantCareProfile` extended with 22+ optional fields (botanical identity, growing params, tolerances, nutrition/safety, user-extendable lists); `PlantCatalogCategory` extended with `tamilNames`/`descriptions`
- Data enrichment: All 100 plant varieties in `plantCareDefaults.ts` backfilled with scientific names, Tamil names (data-only), descriptions, daysToHarvest, heightCm, spacingCm, plantingDepthCm, growingSeason, germinationDays, germinationTempC, soilPhRange, tolerances, vitamins, minerals, petToxicity, feedingIntensity; fruit trees additionally have yearsToFirstHarvest
- Catalog enrichment: `tamilNames` and `descriptions` added to all 7 categories in `DEFAULT_PLANT_CATALOG`; `normalizeCategory()` updated to merge tamilNames/descriptions from defaults
- Consumer refactor: Removed standalone `DAYS_TO_HARVEST`, `YEARS_TO_FIRST_HARVEST`, `HARVEST_SEASON_BY_VARIETY` tables from `plantHelpers.ts`; `calculateExpectedHarvestDate()` and `getDefaultHarvestSeason()` now read from enriched care profiles
- Service layer: `normalizeOverride()` in `plantCareProfiles.ts` validates all new A2 fields; `normalizeCatalog()` exported from `plantCatalog.ts`
- Migration: `002_seed_catalog_enrichment.ts` — re-normalises existing user catalogs to merge enriched defaults; `LATEST_SCHEMA_VERSION` bumped to 2
- UI: Known Pests and Known Diseases `CollapsibleSection`s with emoji chips in ManagePlantCatalog care modal
- Tests: `plantCareDefaultsA2.test.ts` + `plantHelpersA2.test.ts` (22 tests) — field completeness, NumericRange validation, harvest date calculation, season lookup, pest/disease retrieval

---

## 1. Current System Summary

### What's Fully Built (Production-Ready)

| Feature                        | Key Files                                           | Status                                                                    |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------- |
| Firebase Auth (email/password) | `AuthScreen`, `firebase.ts`                         | ✅ Rate limiting, token refresh, error handling                           |
| Plant CRUD                     | `plants.ts`, `PlantFormScreen`, `PlantDetailScreen` | ✅ 40+ fields, soft-delete, pagination, image support                     |
| Recurring Task System          | `tasks.ts`, `CalendarScreen`                        | ✅ Auto-sync from plant settings, season-aware watering, batch completion |
| Journal (Multi-Image)          | `journal.ts`, `JournalFormScreen`                   | ✅ 5 entry types incl. harvest, legacy photo compat                       |
| Calendar Views                 | `CalendarScreen`, `useCalendarData`                 | ✅ Week/month, grouping, filtering, swipeable task cards                  |
| Location Management            | `locations.ts`, `ManageLocationsScreen`             | ✅ Parent/child hierarchy, soil profiles (pH, NPK, drainage)              |
| Plant Catalog                  | `plantCatalog.ts`, `ManagePlantCatalogScreen`       | ✅ Type→variety mapping, variety aliases, user customization              |
| Care Profiles                  | `plantCareProfiles.ts`, `plantCareDefaults.ts`      | ✅ 160+ variety defaults, frequency/soil/fertiliser overrides             |
| Image Storage                  | `imageStorage.ts`                                   | ✅ MediaLibrary (Android), documentDirectory (iOS), migration             |
| Images-Only Backup             | `backup.ts`, `SettingsScreen`                       | ✅ ZIP export/import, filename-based matching                             |
| Theme System                   | `theme/`, 25 style files                            | ✅ Light/dark/system, comprehensive tokens                                |
| Error Infrastructure           | Sentry, `errorLogging.ts`, `ErrorBoundary`          | ✅ Global handlers, structured logging, PII sanitization                  |

### Domain Logic Already Built

| Domain Area                | File                                      | Depth                                                                                                  |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 4-Season Kanyakumari Model | `seasonHelpers.ts`                        | Month ranges, watering multipliers per space type, 120+ pest alerts                                    |
| Companion Planting         | `plantHelpers.ts`                         | 130+ varieties, 770+ companion pairs, 30+ incompatibilities                                            |
| Pest/Disease Intelligence  | `plantHelpers.ts`                         | Type-specific + 23 crop-specific profiles, 160+ organic treatments                                     |
| Coconut Age-Based Care     | `plantHelpers.ts`                         | 6 age stages, nutrient deficiencies, yield expectations                                                |
| Pruning Techniques         | `plantCareDefaults.ts`                    | 40+ variety-specific guides with seasonal timing                                                       |
| Harvest Date Estimates     | `plantCareDefaults.ts`, `plantHelpers.ts` | 100 vegetables/herbs (daysToHarvest range), 23+ trees (yearsToFirstHarvest), growingSeason per variety |

### What's Partially Built

| Feature               | Existing Foundation                                                                                                                 | Gap                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Harvest Tracking      | `JournalEntry` has `harvest_quantity`, `harvest_unit`, `harvest_quality`, `harvest_notes`; `HarvestHistorySection` component exists | No yield analysis, no income tracking, no per-tree harvest logging                             |
| Companion Planting UI | Functions in `plantHelpers.ts`, surfaces on `PlantDetailScreen`                                                                     | No zone-aware warnings, no intercropping planner                                               |
| Soil Profiles         | `LocationProfile` has pH/NPK/drainage/soil_type fields                                                                              | Data stored but no recommendation engine, no amendment suggestions                             |
| Growth Stages         | Static `growth_stage` field on `Plant`, 6 stages defined; `getCoconutAgeInfo()` computes coconut age stages from planting date         | No auto-progression, no stage history, no per-variety stage durations, no annual cycling for fruit trees |
| Default Catalog       | `DEFAULT_PLANT_CATALOG` exists with ~100 Kanyakumari crops                                                                          | ✅ Tamil names, descriptions, spacing/yield data enriched (Phase A2). No planting windows yet. |

---

## 2. Key Problems / Risks

### Critical

1. **No Schema Migration System**: Schema evolves by changing `database.types.ts` with no mechanism to transform existing data. Journal's legacy `photo_url` → `photo_filenames` migration is handled in application code. Every future schema change (harvest_logs, growth_stage_history, planting_windows) will compound this debt.
2. **Empty Catalog on First Login**: `plantCatalog` in `user_settings` starts empty until the user manually configures it, OR the normalization code merges defaults. The current `getPlantCatalog()` does merge with `DEFAULT_PLANT_CATALOG` on read — so the catalog is technically not empty, but users don't see pre-loaded variety-level data with local context.
3. **No Onboarding**: Users land on an empty TodayScreen after signup with no guidance.

### High

1. **Hardcoded Kanyakumari Constants**: Season boundaries, location defaults ("Mangarai", "Velliavilai"), pest alerts all embedded directly in code. Expanding to other districts requires parameterization.
2. **No i18n Infrastructure**: All 13 screens and 12+ components have hardcoded English strings. Tamil support requires extracting every string first.
3. **Minimal Test Coverage**: Only 2 utility test files (`dateHelpers.test.ts`, `locations.test.ts`). Zero service tests. Zero component tests. Risk when refactoring.
4. **No Offline Mutation Queue**: Write failures during poor connectivity silently fail. `withTimeoutAndRetry()` retries but if all retries fail, the user's action is lost.

### Medium

1. **Direct Firestore Coupling**: Every service imports from `firebase/firestore`. Not a problem now but increases cost of backend migration.
2. **Large Hook**: `usePlantFormState` returns 120+ properties. Works but difficult to maintain.
3. **No Data Export**: Can export images but not plant/journal/task data. Users can't back up their actual records.

---

## 3. Gap Analysis Table

| #   | Feature                                               | Current State                                                  | Gap Category         | Effort | Impact    | Priority   |
| --- | ----------------------------------------------------- | -------------------------------------------------------------- | -------------------- | ------ | --------- | ---------- |
| G1  | Schema Migration System                               | None                                                           | Critical             | M      | High      | Phase 0 ✅ |
| G2  | Default Catalog Seeding (Tamil names, spacing, yield) | Partial defaults exist                                         | High-Value           | M      | High      | Phase A2   |
| G3  | Season-Aware Planting Calendar ("What to Plant Now")  | Season model exists, no planting windows                       | High-Value           | S      | High      | Phase C    |
| G4  | Weather Integration (Open-Meteo)                      | None                                                           | High-Value           | S      | Medium    | Phase C    |
| G5  | Enhanced Harvest Tracking & Yield Dashboard           | Journal has harvest fields, no analysis                        | High-Value           | M      | High      | Phase B    |
| G6  | Growth Stage Progression (Auto + Annual Cycling)      | Static field, no history, no auto-computation                  | High-Value           | M      | High      | Phase B    |
| G7  | Multi-Layer / Zone-Based Planting                     | No zone concept                                                | High-Value           | L      | High      | Phase B2   |
| G8  | Organic Pest & Disease Advisor (enriched)             | 160+ treatments exist, no recipes/calendar                     | High-Value           | M      | Medium    | Phase A (done) / A3 (deferred) |
| G9  | Coconut Individual Tree Tracking                      | Coconut fields exist, per-tree not streamlined                 | High-Value           | M      | High      | Phase B    |
| G10 | Voice-to-Text (Tamil)                                 | None (expo-speech available)                                   | High-Value           | S      | Medium    | Phase E    |
| G11 | Journal Tags                                          | No structured tags                                             | Nice-to-Have         | S      | Medium    | Phase 0 ✅ |
| G12 | Crop Rotation Planner                                 | No rotation logic                                              | High-Value           | M      | Medium    | Phase B2 (subsumed) |
| G13 | Organic Input Recipes (static reference)              | FertiliserType enum exists                                     | High-Value           | S      | Medium    | Phase A3 (deferred) |
| G14 | Seed Source & Variety Log                             | `plant_variety` exists, no `seed_source`                       | Nice-to-Have         | S      | Low       | Phase B    |
| G15 | Seasonal Labour Calendar (Farmer's Almanac)           | None                                                           | Nice-to-Have         | S      | Medium    | Phase C    |
| G16 | Tamil i18n                                            | None                                                           | Critical (for scale) | L      | High      | Phase G    |
| G17 | Onboarding Flow                                       | None                                                           | High-Value           | M      | High      | Phase F    |
| G18 | Data Backup (full export/import)                      | Images-only backup exists                                      | High-Value           | M      | Medium    | Phase F    |
| G19 | Data Abstraction Layer                                | Direct Firestore coupling                                      | Nice-to-Have         | L      | Low       | Defer      |
| G20 | Multi-User / RBAC                                     | Single-user `user_id` scoping                                  | Nice-to-Have         | XL     | Low       | Defer      |
| G21 | Financial Ledger                                      | None                                                           | Nice-to-Have         | L      | Medium    | Defer      |
| G22 | Land & Plot Mapping                                   | Locations are string labels                                    | Nice-to-Have         | L      | Medium    | Phase H (partially addressed by B2) |
| G23 | Soil Health Recommendations                           | Profile stored, no engine                                      | Nice-to-Have         | M      | Medium    | Phase H    |
| G24 | Labour Tracking                                       | None                                                           | Nice-to-Have         | M      | Low       | Defer      |
| G25 | Water Management                                      | None                                                           | Nice-to-Have         | M      | Low       | Defer      |
| G26 | Lifecycle Economics                                   | Age calc exists, no ROI projection                             | Nice-to-Have         | M      | Medium    | Phase H    |
| G27 | Zone-Aware Config (State-Level Expansion)             | Hardcoded Kanyakumari                                          | Nice-to-Have         | XL     | Low (now) | Defer      |
| G28 | Test Coverage (30% minimum)                           | ~2%                                                            | Critical             | L      | High      | Ongoing    |
| G29 | Pest/Disease/Beneficial Reference (detail pages)      | 160+ treatments exist, no detail pages or browseable reference | High-Value           | M      | High      | Phase A (done) / A3 (deferred) |
| G30 | Per-Variety Custom Pests/Diseases/Beneficials         | Static lists only, no user customisation per variety           | High-Value           | S      | Medium    | Phase A3 (deferred) |
| G31 | Bed Management                                        | Free-text `bed_name` on Plant, no bed entity or rotation       | High-Value           | XL     | High      | Phase B2   |

---

## 4. Recommended Architecture Adjustments

### 4.1 Build: Schema Migration System (G1) — ✅ Done (Phase 0)

**What**: A `src/migrations/` directory with numbered migration functions that run on app startup after auth.

**Structure**:

```text
src/migrations/
  index.ts          -- migration runner
  types.ts          -- Migration interface
  001_baseline.ts   -- no-op, establishes version 1
  002_seedCatalog.ts
  ...
```

**How it works**:

- Store `schema_version: number` in `user_settings/{uid}`
- On app launch (after auth), compare stored version vs. latest
- Run pending migrations sequentially
- Each migration transforms user's Firestore documents
- Record completed version

**Key Design Decisions**:

- Migrations run client-side (no Cloud Functions needed, stays free-tier)
- Idempotent — safe to re-run
- Batched Firestore writes (500-doc limit per batch)
- Timeout protection via existing `withTimeoutAndRetry()`

### 4.2 Build: Extract Season Config Interface — ✅ Done (Phase 0)

**What**: Move hardcoded Kanyakumari constants from `seasonHelpers.ts` into a config object, but keep Kanyakumari as the only implementation for now.

**Why now**: Every new feature (planting windows, pest calendar, weather) will embed more Kanyakumari-specific data. Extracting the config interface now prevents deeper coupling. Costs ~2 hours and pays off immediately.

**Pattern**:

- Define `SeasonConfig` interface in `database.types.ts`
- Create `src/config/kanyakumariZone.ts` exporting the current hardcoded values
- `seasonHelpers.ts` reads from the config instead of inline constants
- Add `district` field to user settings (default: "Kanyakumari")

### 4.3 Do NOT Build: Data Abstraction Layer (G19)

**Why defer**: The app has 5 service files. Each is ~200-400 lines. The Firestore SDK coupling is manageable. The abstraction would add complexity without solving a real problem today. The existing `withTimeoutAndRetry()` wrapper already centralizes retry/timeout logic. Only build this when a backend migration is actually planned.

### 4.4 Do NOT Build: Multi-User / RBAC (G20)

**Why defer**: This requires redesigning every Firestore query, security rule, and cache key. It's a fundamental architecture change, not a feature addition. Current single-farmer scope is correct for a personal app. Only revisit if actual multi-farm demand materializes.

### 4.5 Implementation Approach: Screen-by-Screen

This roadmap is organized **screen-by-screen** rather than by feature priority. Each phase targets a specific screen group, bringing it to a "done" state before moving to the next. This approach reduces context-switching for a solo developer and ensures each screen ships polished.

**Order**: Config (More tab) → Plants → Home → Calendar → Journal → Settings → Tamil i18n → Advanced

Shared foundations (types, services, config files) are built in the phase that first needs them. Each phase follows: define types → build/extend services → build/extend hooks → polish screen → write tests.

**Tamil language strategy**: Full-app English ↔ Tamil toggle in Settings (Phase G). No mixing of languages in any screen. Tamil plant names (`tamilName` on care profiles) are DATA and ship with catalog enrichment (Phase A2), but are **only displayed when the user switches to Tamil in Settings (Phase G)**. Until Phase G ships, the UI is English-only.

---

## 5. Phased Roadmap

### Phase 0: Stabilization (Fix Fundamentals)

**Goal**: Establish migration system and minimal test coverage so all future phases can safely change the schema and refactor code.

| Step | Feature                                       | Effort | Risk | Dependencies             |
| ---- | --------------------------------------------- | ------ | ---- | ------------------------ |
| 0.1  | Schema Migration System                       | M      | Low  | None                     |
| 0.2  | Extract Season Config Interface               | S      | Low  | None — parallel with 0.1 |
| 0.3  | Add `schema_version` to `user_settings`       | S      | Low  | 0.1                      |
| 0.4  | Service test fixtures + first 5 service tests | M      | Low  | None — parallel          |

> **Note**: Step 0.5 (Full data backup) was originally planned for Phase 0 but moved to Phase F (Settings & Cross-Cutting).

**Verification**:

- Migration runner executes on app launch, processes pending migrations
- `npx tsc --noEmit` passes, `npm run lint` passes
- Service tests pass with Firebase emulator

---

### Phase A: Config — Pest & Disease Reference (F11)

**Goal**: Standalone browseable Pest and Disease reference screens under More tab. Pure static config, no Firestore. Simplest starting point — builds confidence and patterns for later phases.
**Screens**: PestListScreen (NEW), PestDetailScreen (NEW), DiseaseListScreen (NEW), DiseaseDetailScreen (NEW)

| Step | Feature                                                                                                         | Effort | Risk | Dependencies               |
| ---- | --------------------------------------------------------------------------------------------------------------- | ------ | ---- | -------------------------- |
| A.1  | Define `PestEntry`, `DiseaseEntry`, `OrganicControlItem`, category types in `database.types.ts`                 | S      | Low  | None                       |
| A.2  | Create `src/config/pests/` — kanyakumari.ts (36 entries), index.ts (registry + lookups)                         | M      | Low  | A.1                        |
| A.3  | Create `src/config/diseases/` — kanyakumari.ts (31 entries), index.ts (registry + lookups)                      | M      | Low  | A.1                        |
| A.4  | Navigation: extend `MoreStackParamList`, add 4 routes to `AppNavigator.tsx`, add menu items to `MoreScreen.tsx` | S      | Low  | A.1                        |
| A.5  | Shared styles: `referenceListStyles.ts`, `referenceDetailStyles.ts`                                             | S      | Low  | None                       |
| A.6  | PestListScreen + PestDetailScreen                                                                               | M      | Low  | A.2, A.4, A.5              |
| A.7  | DiseaseListScreen + DiseaseDetailScreen                                                                         | S      | Low  | A.3, A.6 (reuses patterns) |
| A.8  | Tests: `pests.test.ts`, `diseases.test.ts`, fixture factories                                                   | S      | Low  | A.2, A.3                   |

**Verification**:

- More tab shows Pest/Disease menu items
- 36 pests + 31 diseases browseable with search filter
- Detail pages show all 5 sections (Identification, Damage Prevention, Physical Control, Organic Control, Related Plants)
- Light/dark mode correct

---

### Phase A2: Config — Catalog Enrichment (F2)

**Goal**: Enrich the plant catalog and care profiles as the data foundation for all downstream screens.
**Screens**: ManagePlantCatalogScreen (existing), ManagePlantCatalog care modal (existing)

| Step | Feature                                                                                                                                                                                                                                                                                                                              | Effort | Risk | Dependencies     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ---- | ---------------- |
| A2.1 | Define F2 types in `database.types.ts` — `Lifecycle`, `ToleranceLevel`, `FeedingIntensity` unions; `PlantCareProfile` extensions (~22 optional fields: botanical identity, growing params, tolerances, nutrition/safety, user-extendable lists); `PlantCatalogCategory` extensions (`tamilNames`, `descriptions`)                    | S      | Low  | None             |
| A2.2 | Backfill `plantCareDefaults.ts` — full enrichment for all ~100 varieties (scientific names, Tamil names as data-only, growing params, tolerances, nutrition/safety). Absorb `DAYS_TO_HARVEST`, `YEARS_TO_FIRST_HARVEST`, `HARVEST_SEASON_BY_VARIETY` from `plantHelpers.ts`. Add type-level fallbacks in `DEFAULT_PROFILES_BY_TYPE`. | L      | Low  | A2.1             |
| A2.3 | Expand `DEFAULT_PLANT_CATALOG` in `plantCatalog.ts` — `tamilNames` and `descriptions` records for all ~100 entries (data only, not rendered until Phase G)                                                                                                                                                                           | M      | Low  | A2.1             |
| A2.4 | Consumer refactor in `plantHelpers.ts` — update `calculateExpectedHarvestDate()` and `getDefaultHarvestSeason()` to read from enriched profile first, fall back to old lookup tables. Deprecate old constants.                                                                                                                       | S      | Low  | A2.2             |
| A2.5 | Service layer — extend `normalizeOverride()` in `plantCareProfiles.ts` for ~20 new field validations; update `normalizeCategory()` in `plantCatalog.ts` for `tamilNames`/`descriptions` merge                                                                                                                                        | S      | Low  | A2.1             |
| A2.6 | Migration `002_seedCatalog.ts` — merge-seed enriched catalog data for existing users. Bump `LATEST_SCHEMA_VERSION` to 2.                                                                                                                                                                                                             | S      | Low  | A2.1, A2.5       |
| A2.7 | ManagePlantCatalog care modal — 3 new `CollapsibleSection`s (Known Pests, Known Diseases, Beneficial Critters placeholder). Pest/disease chips read-only from `getCommonPests()`/`getCommonDiseases()`, deep-link to Phase A detail screens. No custom chip input (deferred to A3).                                                  | S      | Low  | A2.2, Phase A    |
| A2.8 | Tests: `plantCareDefaults.test.ts` (field completeness for all ~100 entries), `002_seedCatalog.test.ts` (idempotent migration), consumer backward-compat tests                                                                                                                                                                       | S      | Low  | A2.2, A2.4, A2.6 |

**Verification**:

- `npx tsc --noEmit` + `npm run lint` + `npm test` pass
- Enriched care data accessible via `getPlantCareProfile()` (Tamil names stored as data, not rendered until Phase G)
- ManagePlantCatalog care modal shows pests/diseases/beneficials sections with chip display
- Pest/disease chips tap through to PestDetailScreen/DiseaseDetailScreen

---

### Phase A3: Config — Beneficials + Custom Entry CRUD (F10) — ⏭ DEFERRED (after Phase H)

**Goal**: Beneficials reference as separate More menu item. Custom entry CRUD for pests/diseases/beneficials. Organic input recipes reference. No unified hub screen.

> **Deferred**: Skipping A3 now — Beneficials and custom CRUD are not blocking for Phase B/B2. Will revisit after Phase H.
**Screens**: BeneficialListScreen (NEW), BeneficialDetailScreen (NEW)

| Step | Feature                                                                                          | Effort | Risk | Dependencies    |
| ---- | ------------------------------------------------------------------------------------------------ | ------ | ---- | --------------- |
| A3.1 | Create `src/config/beneficials/` — kanyakumari.ts (~20 entries), index.ts                        | S      | Low  | None            |
| A3.2 | Define `BeneficialReference` type in `database.types.ts`                                         | S      | Low  | None            |
| A3.3 | Navigation: add Beneficials route to More stack, add menu item to MoreScreen                     | S      | Low  | A3.2            |
| A3.4 | BeneficialListScreen + BeneficialDetailScreen                                                    | M      | Low  | A3.1, A3.3      |
| A3.5 | `customReferences.ts` service — custom entry CRUD in user_settings                               | S      | Low  | A3.2            |
| A3.6 | Custom Entry CRUD UX — add/edit/delete from reference list screens + ManagePlantCatalog modal    | S      | Low  | A3.4, A3.5      |
| A3.7 | Organic Input Recipes reference — static `organicInputs.ts` (Jeevamrutha, Panchagavya, neem oil) | S      | Low  | None — parallel |
| A3.8 | Styles: `beneficialListStyles.ts`, `beneficialDetailStyles.ts`                                   | S      | Low  | A3.4            |
| A3.9 | Tests: `beneficials.test.ts`, `customReferences.test.ts`                                         | S      | Low  | A3.1, A3.5      |

**Verification**:

- More tab shows Beneficials menu item
- ~20 entries browseable with search filter
- Tap "Ladybird Beetle" → BeneficialDetailScreen with Common Species, Why Helpful, How To Attract, Plants To Grow, Pests Controlled
- Custom pest "Snail" can be added, appears in list + available in ManagePlantCatalog care modal

---

### Phase B: Plants (F9, F5, F6, F7, 2.5, 2.8, 2.15)

**Goal**: Enrich plant form with Planter-style depth, add harvest tracking, growth stage progression, zone-based planting, deep-links to reference screens.
**Screens**: PlantFormScreen, PlantDetailScreen, PlantsScreen

| Step | Feature                                                                                                                                                                                     | Effort | Risk   | Dependencies                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ----------------------------- |
| B.1  | F9 form components — EditBotanicalIdentitySection, EditQuickInfoSection, EditRelationshipsSection, EditBeneficialsSection, EditNutritionSection, EditCareGuidanceSection, EditSafetySection | M      | Low    | Phase A2 (catalog data)       |
| B.2  | Deep-links (2.15) — pest/disease/beneficial chips navigate to reference detail screens                                                                                                      | S      | Low    | Phase A/A3 + B.1              |
| B.3  | F5 harvest tracking — HarvestLog type, `harvests.ts` service, migration 003, yield chart on PlantDetailScreen                                                                               | M      | Medium | Phase 0                       |
| B.4  | F6 growth stage auto-progression — computed on-the-fly from `planting_date` + per-variety `growthStageDurations` on `PlantCareProfile`. New fields: `growthStageDurations`, `annualCycleDurations`, `floweringStartMonth` on profile; `growth_stage_pinned`, `growth_stage_history` on Plant. Functions: `computeExpectedGrowthStage()`, `computeAnnualCycleStage()`, `getEffectiveGrowthStage()`. Pin/unpin override. Fruit tree annual cycling after `yearsToFirstHarvest`. Coconut exempt (existing `getCoconutAgeInfo()`). Timeline UI on PlantDetailScreen. Migration 004 seeds history from existing data. | M      | Medium | Phase 0, Phase A2 (durations data) |
| B.5  | F7 zone-based planting — `planting_zone` field, `zoneCompanionRules.ts`, zone picker on form, companion warnings. **Note: Subsumed by Phase B2 bed light zones + guild layers — implement B2 instead.**                                                                                | M      | Medium | Phase 0                       |
| B.6  | Coconut per-tree tracking (2.5) — `tree_number` on HarvestLog, per-tree yield trend                                                                                                         | M      | Medium | B.3                           |
| B.7  | Seed source (2.8) — `seed_source` field on Plant                                                                                                                                            | S      | Low    | Phase 0                       |
| B.8  | PlantNowBanner component (F3) — "Plant now ✅ / Wait until X" badge on plant form (shared with Phase C)                                                                                     | S      | Low    | Phase A2 (growingSeason data) |
B.9  | Care task enable/disable toggles — add `watering_enabled`, `fertilising_enabled`, `pruning_enabled` (optional boolean, default true) to `Plant` type. Expose as state in `usePlantFormState` (load from plant data; auto-set from `PlantCareProfile.wateringEnabled`/`fertilisingEnabled`/`pruningEnabled` when smart defaults fire). Inline ON/OFF toggle in each stepper card header in `EditCareScheduleSection` (all 3) and `WizardStep3` (watering + fertilising only). When OFF: hide frequency stepper, show "No task · rain-fed or manual" helper text, force frequency to null on save. `syncCareTasksForPlant` in `tasks.ts` checks `plant.watering_enabled !== false` (etc.) before adding each task type to `desiredFrequencies`. No migration needed — optional fields, treated as `true` when absent. Reuse existing `settingSwitchTrack`/`settingSwitchThumb` styles. | S      | Low    | Phase 0                       |
| B.10 | Tests for new services + components                                                                                                                                                         | M      | Low    | B.1–B.9     
**Verification**:

- Plant form shows 7 new sections (botanical identity, quick info, relationships, beneficials, nutrition, care guidance, safety)
- Pest chip "Fruit Borer" → navigates to PestDetailScreen
- Harvest log entries accumulate, PlantDetailScreen shows yield-per-season chart
- Growth stage auto-computed from `planting_date` + variety durations (tomato planted 30 days ago shows "Vegetative")
- Manual pin overrides computed stage; unpin reverts to computed
- Fruit tree (mango) past `yearsToFirstHarvest` shows annual cycle: Flowering → Fruiting → Harvest → Dormancy
- Coconut shows age stage from `getCoconutAgeInfo()`, not growth stage engine
- `growth_stage_history` records each transition with timestamp
- Timeline visualization on PlantDetailScreen shows all stage transitions
- Adding sun-loving plant under coconut canopy zone shows warning
- Plant form shows Beneficial Critters chip row (e.g. moringa → honeybees, parakeets)
- Plant form shows Nutrition section with vitamins/minerals chips
- Plant form shows expandable Growing / Feeding / Harvesting / Storage / Pruning narrative blocks
- Plant form shows red "Toxic to pets" warning for chives/onions; hidden for pet-safe plants
Watering toggle OFF in wizard or edit → no water task created after save; ON → water task created as normal
- Fertilising toggle OFF → no fertilise task; saved state persists across edit / reload
- Pruning toggle OFF for a fruit_tree → no prune task template generated
- Smart defaults: selecting a variety whose `PlantCareProfile` has `wateringEnabled: false` auto-sets toggle to OFF
- Existing plants without the new fields continue to behave as fully enabled (no data change required)
---

### Phase B2: Bed Management (F12, G7, G12, G31)

**Goal**: First-class bed entities with crop rotation engine, companion/guild validation, and cross-cutting integration across all existing screens. Generic farm layout — not locked to coconut intercrop. `has_coconut_canopy` is an optional boolean property on any bed, not a bed type.
**Screens**: BedListScreen (NEW), BedDetailScreen (NEW), BedFormScreen (NEW), BedPlantPickerScreen (NEW) + modifications to 10 existing screens/components.

| Step | Feature                                                                                                                                                                                             | Effort | Risk   | Dependencies                  |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ----------------------------- |
| B2.1  | Schema + Types — `Bed`, `BedType`, `LightZone`, `CropFamily`, `BedLayer`, `BedStatus`, `BedPosition`, `CropFamilyEntry` types; extend `Plant` with optional bed fields (`bed_id`, `bed_layer`, `sow_date`, `crop_family`, `spacing_cm`, `position_in_bed`, `light_requirement`, `season_suitability`); extend `JournalEntry` with optional `bed_id` | S      | Low    | None                          |
| B2.2  | Bed Config Data — `src/config/beds/` (6 files): `bedRecommendations.ts` (land area → bed count), `guildDefaults.ts` (4-layer defaults), `companionRules.ts` (beneficial/harmful pairs + guild validation), `bedPlantCatalog.ts` (25+ KK bed plants), `rotationRules.ts` (Leafy→Fruiting→Legume→Root, Solanaceae 730d rule, 40% legume buffer), `index.ts` | M      | Low    | B2.1                          |
| B2.3  | Service + Domain Helpers — `beds.ts` (10 CRUD functions: `getBeds`, `getBedById`, `createBed`, `updateBed`, `deleteBed`, `assignPlantToBed`, `removePlantFromBed`, `getRotationSuggestion`, `markBedResting`, `getLegumeCoveragePercent`); `bedHelpers.ts` (10 pure functions: rotation, companion, validation, guild warnings); extend `plants.ts` with `getPlantsByBed(bedId)`; extend `storage.ts`, `dataCache.ts`, `firestore.rules` | M-L    | Medium | B2.1, B2.2                    |
| B2.4  | Hooks — `useBedData.ts` (beds list + legume coverage + `useFocusEffect`), `useBedDetail.ts` (single bed + plants + rotation suggestion)                                                            | S      | Low    | B2.3                          |
| B2.5  | Navigation + Screens — `BedsStackParamList` in `navigation.types.ts`, `BedStack` navigator, new Beds tab (6th tab, icon: `grid-outline`); `BedListScreen` (FlatList + legume banner + FAB), `BedFormScreen` (create/edit with width ≤ 1.2m validation, coconut distance ≥ 2.0m), `BedCard` component + style files                                  | M      | Medium | B2.3, B2.4                    |
| B2.6  | Plant Form Integration — modify `usePlantFormState` (`bedId`/`bedLayer` state, bed picker dropdown); `EditLocationSection` bed dropdown replacing free-text `bedName`; `WizardStep2` bed picker; `BedPlantPickerScreen` (multi-step: filter → layer → spacing → rotation guard → confirm)                                                               | M      | Medium | B2.3, B2.5                    |
| B2.7  | Plant Display Cross-Cutting — `PlantCard` shows bed tag from `bed_id`; `PlantDetailScreen` adds Bed Context section (bed name, dimensions, layer, bed-mates, companion indicators); `TaskCard` shows bed subtitle                                                                                                                                      | S-M    | Low    | B2.3, B2.5                    |
| B2.8  | Filtering + Grouping Cross-Cutting — `PlantFilterSheet` adds bed filter chips; `PlantsScreen` adds "Group by bed" option; `CalendarScreen` adds `"bed"` to `GROUP_OPTIONS`                                                                                                                                                                             | S      | Low    | B2.5, B2.7                    |
| B2.9  | Home + Journal Cross-Cutting — `TodayScreen` bed overview card (count, occupancy %, legume coverage, beds needing rotation); `JournalFormScreen` bed picker; `JournalScreen` bed filter chip                                                                                                                                                           | S-M    | Low    | B2.5                          |
| B2.10 | Rotation Engine — wire rotation advisor into `BedDetailScreen` (next family, top 3 crops, Solanaceae violation); legume coverage banner on `BedListScreen`; L1/L2 stagger warnings; "Mark as resting" creates 45-day chop-and-drop task via `tasks.ts`                                                                                                  | M      | Medium | B2.5, B2.6                    |
| B2.11 | SVG Top-View Diagram *(DEFERRED)* — `BedDiagram.tsx` using `react-native-svg`, plant positions at grid by `position_in_bed` + `spacing_cm`, color-coded by layer. Implement only after B2.1–B2.10 stable.                                                                                                                                             | M-L    | High   | B2.5                          |
| B2.12 | Tests + PGS Export — `bedHelpers.test.ts` (rotation, companion, validation), `beds.test.ts` (service CRUD); extend `backup.ts` for beds collection                                                                                                                                                                                                    | M      | Low    | B2.3                          |

**Verification**:

- `npx tsc --noEmit` passes after B2.1 type additions
- Beds tab visible in navigation, all 4 screens accessible, back navigation works
- Create bed → list shows it → edit → delete → verify cascade nulls plant `bed_id`
- BedFormScreen rejects width > 1.2m on save; warns when `distance_from_trunk_m` < 2.0 with `has_coconut_canopy`
- Plant form shows bed picker dropdown (replaces free-text `bedName`); selecting bed auto-fills light zone
- `PlantCard` shows bed tag badge; `PlantDetailScreen` shows Bed Context section with bed-mates
- `PlantFilterSheet` shows bed filter chips; `PlantsScreen` groups by bed correctly
- `CalendarScreen` groups tasks by bed when selected
- `TodayScreen` shows bed overview card with legume coverage %
- `JournalFormScreen` offers bed picker; `JournalScreen` filters by bed
- Rotation guard blocks Solanaceae reassignment within 730 days (with user override)
- Light mismatch shows hard warning for full_sun plant in low_light bed
- Legume coverage % visible; warning banner appears when < 40%
- "Mark as resting" sets bed status, creates 45-day task template
- Firestore rules block unauthenticated access to `beds` collection
- `npm run lint` + `npm test` pass with zero errors

---

### Phase C: Home (F3, F4, 2.9)

**Goal**: Transform TodayScreen into the daily dashboard with planting advice, weather, and seasonal almanac.
**Screens**: TodayScreen

| Step | Feature                                                                                             | Effort | Risk | Dependencies            |
| ---- | --------------------------------------------------------------------------------------------------- | ------ | ---- | ----------------------- |
| C.1  | F3 "What to Plant Now" section — uses `growingSeason` from enriched profiles + `getCurrentSeason()` | S      | Low  | Phase A2 (catalog data) |
| C.2  | F4 weather service — `weather.ts`, Open-Meteo API, 3h cache, `WeatherForecast` type                 | S      | Low  | None                    |
| C.3  | F4 weather card on TodayScreen — 7-day forecast, rain alert                                         | S      | Low  | C.2                     |
| C.4  | Seasonal Almanac (2.9) — monthly highlight on TodayScreen + "View full almanac" link                | S      | Low  | None                    |
| C.5  | TodayScreen styles update (`todayStyles.ts`)                                                        | S      | Low  | C.1–C.4                 |

**Verification**:

- TodayScreen shows "What to Plant Now" section for current season
- Weather card shows 7-day forecast, rain alert visible
- Almanac section populated with monthly highlights
- Rain alert suppresses watering reminder

---

### Phase D: Calendar

**Goal**: Weather-aware refinements to CalendarScreen.
**Screens**: CalendarScreen

| Step | Feature                                                                                                       | Effort | Risk | Dependencies              |
| ---- | ------------------------------------------------------------------------------------------------------------- | ------ | ---- | ------------------------- |
| D.1  | Weather-aware task suppression — suppress watering reminder if rain predicted (uses weather service from C.2) | S      | Low  | Phase C (weather service) |
| D.2  | Any enriched-data display refinements                                                                         | S      | Low  | Phase A/B                 |

**Verification**:

- Rainy day suppresses watering tasks
- Calendar reflects enriched plant data

---

### Phase E: Journal (F8)

**Goal**: Add voice-to-text Tamil input to JournalFormScreen.
**Screens**: JournalFormScreen

| Step | Feature                                                   | Effort | Risk | Dependencies |
| ---- | --------------------------------------------------------- | ------ | ---- | ------------ |
| E.1  | Install `@react-native-voice/voice`, configure dev client | S      | Low  | None         |
| E.2  | Mic button on JournalFormScreen content input             | S      | Low  | E.1          |
| E.3  | `journalFormStyles.ts` update                             | S      | Low  | E.2          |

**Verification**:

- Mic button captures Tamil speech, transcribes to text in journal content field

---

### Phase F: Settings & Cross-Cutting (G18, G17)

**Goal**: Full data backup and onboarding flow.
**Screens**: SettingsScreen, OnboardingScreen (NEW)

| Step | Feature                                                                                              | Effort | Risk   | Dependencies                                |
| ---- | ---------------------------------------------------------------------------------------------------- | ------ | ------ | ------------------------------------------- |
| F.1  | G18 full data backup — extend `backup.ts` for plants + tasks + journal + settings as JSON+images ZIP | M      | Medium | Phase 0 (migration compat)                  |
| F.2  | G17 onboarding flow — district selection (Kanyakumari default), guided first-plant wizard            | M      | Low    | Phase A2 (catalog), Phase 0 (season config) |

**Verification**:

- Export creates complete backup. Import restores all data
- New user sees onboarding flow with district selection and guided first-plant wizard

---

### Phase G: Tamil i18n (G16)

**Goal**: Full-app language toggle (English ↔ Tamil) via Settings. No mixing.
**Screens**: All screens

| Step | Feature                                                        | Effort | Risk   | Dependencies                    |
| ---- | -------------------------------------------------------------- | ------ | ------ | ------------------------------- |
| G.1  | i18next + react-i18next + expo-localization setup              | S      | Low    | None                            |
| G.2  | Extract all hardcoded strings from 13 screens + 12+ components | L      | Medium | All Phase A–F features complete |
| G.3  | Tamil translation file                                         | L      | Medium | G.2                             |
| G.4  | Language toggle in SettingsScreen                              | S      | Low    | G.1                             |

**Verification**:

- Toggle to Tamil → all UI strings switch. Toggle back → English. No mixing

---

### Phase H: Advanced (Later)

**Goal**: Deepen domain intelligence, prepare for scale.

| Step | Feature                                                                                           | Effort | Risk   | Dependencies                                        |
| ---- | ------------------------------------------------------------------------------------------------- | ------ | ------ | --------------------------------------------------- |
| H.1  | Crop Rotation Planner (G12) — **Subsumed by Phase B2.10** (rotation engine). Remainder: advanced multi-season rotation planning UI, rotation history analytics | M      | Low    | Phase B2                                             |
| H.2  | Farm Zone Mapping (G22) — **Partially addressed by Phase B2** (beds with dimensions + location_id). Remainder: inter-bed spatial layout, full farm SVG map     | L      | Medium | Phase B2                                             |
| H.3  | Soil Health Recommendations (G23) — pH-based liming/amendment suggestions from LocationProfile    | M      | Low    | None                                                |
| H.4  | Lifecycle Economics (G26) — maintenance cost vs. yield projection for perennials, replacement ROI | M      | Medium | Phase B (harvest data, coconut tracking)            |
| H.5  | Zone-Aware Config System (G27) — full parameterization for 7 TN agro-climatic zones               | XL     | High   | Phase 0, Phase G                                    |

---

## 6. Feature-Level Breakdown

### F1: Schema Migration System (Phase 0.1)

**Data Model Changes** (`database.types.ts`):

- Add `schema_version: number` to a new `UserSettings` base interface
- Add `MigrationRecord` interface: `{ version: number; ran_at: string; status: 'success' | 'failed' }`

**New Files**:

- `src/migrations/index.ts` — migration runner with `runPendingMigrations(uid)`, reads `schema_version` from `user_settings/{uid}`, executes pending migrations
- `src/migrations/types.ts` — `Migration` interface: `{ version: number; name: string; up: (uid: string) => Promise<void> }`
- `src/migrations/001_baseline.ts` — no-op, establishes version 1

**Integration Point** (`App.tsx`):

- Call `runPendingMigrations(user.uid)` after `onAuthStateChanged` confirms user, before rendering main app
- Show migration progress indicator if migrations are running

**Service Changes**: None for baseline. Future features add migration files.

**Risks**: Migration failures mid-batch could leave partial data. Mitigation: each migration is idempotent, records progress per-document if needed.

---

### F2: Curated Default Catalog (Phase A2) — Planter-Inspired

**Scope expanded (2026-04-18)**: Extend beyond Tamil names + spacing to the full Planter-style plant-reference schema, Kanyakumari-adapted.

**Data Model Changes** (`database.types.ts`):

- Extend `PlantCatalogCategory` with per-variety fields:

  ```typescript
  tamil_names?: Record<string, string>
  descriptions?: Record<string, string>         // per-variety prose (e.g. "Garlic chives: midway between garlic and onion")
  aliases?: Record<string, string[]>             // already exists — retained
  certifications?: Record<string, string[]>      // e.g. ['organic']
  ```

- Extend `PlantCareProfile` with **Botanical Identity**:

  ```typescript
  scientificNames?: string[];                    // ["Allium schoenoprasum", "Allium tuberosum"]
  taxonomicFamily?: string;                      // "Alliaceae" — enables Phase 3.2 crop rotation
  lifecycle?: 'annual' | 'biennial' | 'perennial';
  description?: string;                          // long-form, ~300–800 chars
  tamilName?: string;
  tamilDescription?: string;
  ```

- Extend `PlantCareProfile` with **Quick Information (all ranges, metric + °C)**:

  ```typescript
  spacing?: { valuePerSqM?: number; cmBetweenPlants?: number };
  plantingDepthCm?: { min: number; max: number };
  waterPerWeekMm?: { min: number; max: number };
  sunRange?: { min: SunlightLevel; max: SunlightLevel };
  growingSeason?: KKSeason[];                    // zone season IDs — feeds F3
  heatTolerance?: 'low' | 'medium' | 'high';     // replaces Planter's frostTolerance
  droughtTolerance?: 'low' | 'medium' | 'high';  // new for TN summer
  waterloggingTolerance?: 'low' | 'medium' | 'high'; // critical for SW/NE monsoons
  germinationDays?: { min: number; max: number };
  germinationTempC?: { min: number; max: number };
  heightCm?: { min: number; max: number };
  daysToHarvest?: { min: number; max: number };
  soilPhRange?: { min: number; max: number; label?: string };
  ```

- Extend `PlantCareProfile` with **Nutrition**, **Safety**, **Feeding intensity**:

  ```typescript
  vitamins?: string[];                           // ["A", "B9", "C", "K"]
  minerals?: string[];                           // ["calcium", "iron", "choline", "sulfur"]
  macronutrients?: string[];                     // ["fibre", "protein"]
  nutritionSource?: string;                      // "ICMR-NIN" | "USDA"
  petToxicity?: { dogs?: 'safe' | 'mild' | 'toxic'; cats?: 'safe' | 'mild' | 'toxic'; notes?: string };
  feedingIntensity?: 'light' | 'medium' | 'heavy';
  ```

- Extend `PlantCareProfile` with **User-Extendable Lists** (hybrid configurability — static base + user custom additions per variety):

  ```typescript
  customPests?: string[];                      // user-added pest names not in reference data
  customDiseases?: string[];                   // user-added disease names not in reference data
  customBeneficials?: string[];                // user-added beneficial critter names not in reference config
  ```

  These fields are user-additions only. Static base lists come from `getCommonPests()`/`getCommonDiseases()` in `plantHelpers.ts` and `getBeneficialsForPlant()` in `config/beneficials/`. Display merges both: `[...staticList, ...customList]`. The existing shallow spread `{ ...base, ...override }` works because custom fields don’t exist on the static base profile.

**Files Modified**:

- `src/services/plantCatalog.ts` — expand `DEFAULT_PLANT_CATALOG` with 30–40 Kanyakumari crops, Tamil names, per-variety descriptions, TNAU-recommended varieties (Nendran, G9, ASD16, ADT37, PKM1, PLR1, East Coast Tall, TxD)
- `src/utils/plantCareDefaults.ts` — backfill the 40+ variety defaults with the full Planter-style field set above
- `src/migrations/002_seedCatalog.ts` — seeds Quick-Info, nutrition, safety, and botanical identity fields; merges with user overrides rather than overwriting

**Reuse**: Existing `getPlantCatalog()` normalization already merges defaults with user data. Existing `getPlantCareProfile()` hook auto-fills the new fields onto the form.

**Enables**: F3 (growingSeason), F9 (form sections), Phase 3.2 crop rotation (taxonomicFamily).

---

### F3: Season-Aware Planting Calendar (Phase C)

**Data Model Changes** (`database.types.ts`):

- Add `PlantingWindow` interface:

  ```typescript
  {
    canSow: boolean;
    canTransplant: boolean;
    notes: string;
  }
  ```

- Extend `PlantCareProfile` with:

  ```typescript
  planting_windows?: Record<KKSeason, PlantingWindow>
  ```

- **Note (2026-04-18)**: `PlantingWindow` derivation now reads from the new `PlantCareProfile.growingSeason: KKSeason[]` field introduced in F2 rather than ad-hoc logic. For profiles without explicit `planting_windows`, infer `canSow = currentSeason ∈ growingSeason`.

**Files Modified**:

- `src/utils/plantCareDefaults.ts` — add `planting_windows` to variety-level defaults
- `src/screens/TodayScreen.tsx` — add "What to Plant Now" section using current season + care profile planting windows
- `src/styles/todayStyles.ts` — styles for new section
- `src/components/PlantNowBanner.tsx` — **NEW** zone-aware "Plant now ✅ / Wait until X" badge rendered at top of the plant edit form (replaces Planter's "Set Frost Dates" flow — Kanyakumari has no frost)

**Reuse**: `getCurrentSeason()` from `seasonHelpers.ts`, `getPlantCareProfile()` from `plantCareDefaults.ts`, zone season labels from `src/config/zones/`.

---

### F4: Weather Integration (Phase C)

**New Files**:

- `src/services/weather.ts` — `getWeatherForecast(lat, lng): WeatherForecast` with Open-Meteo API call, 3h cache via `dataCache`

**Data Model Changes** (`database.types.ts`):

- `WeatherForecast`, `DailyWeather` interfaces

**Files Modified**:

- `src/screens/TodayScreen.tsx` — weather card showing 7-day forecast, rain alert
- `src/styles/todayStyles.ts` — weather card styles
- `src/services/tasks.ts` — optional: suppress watering reminder if rain predicted

**API**: Open-Meteo free API (no key needed):

```text
https://api.open-meteo.com/v1/forecast?latitude=8.08&longitude=77.57&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia/Kolkata
```

**Kanyakumari Default Coordinates**: 8.0883°N, 77.5385°E (configurable per user later via district field)

---

### F5: Enhanced Harvest Tracking (Phase B)

**Data Model Changes** (`database.types.ts`):

```typescript
interface HarvestLog {
  id: string;
  user_id: string;
  plant_id: string;
  harvested_at: string; // ISO date
  quantity: number;
  unit: 'kg' | 'count' | 'bunch' | 'litre';
  quality_grade?: 'good' | 'average' | 'poor';
  destination: 'consumed' | 'sold' | 'given_away';
  sale_price?: number; // INR
  buyer_market?: string; // "Nagercoil Uzhavar Sandhai"
  photo_filename?: string;
  notes?: string;
  created_at: string;
}
```

**New Files**:

- `src/services/harvests.ts` — CRUD following cache → auth → Firestore → fallback pattern
- `src/migrations/003_harvestLogs.ts` — migrate existing `JournalEntry` harvest data to `harvest_logs`
- `src/styles/harvestDashboardStyles.ts` — yield chart styles

**Files Modified**:

- `firestore.rules` — add `harvest_logs/{logId}` rules
- `src/lib/storage.ts` — add `KEYS.HARVEST_LOGS`
- `src/lib/dataCache.ts` — add `CACHE_KEYS.HARVEST_LOGS`
- `src/components/HarvestHistorySection.tsx` — read from `harvest_logs` instead of journal
- `src/screens/PlantDetailScreen.tsx` — add yield trend mini-chart (`react-native-svg` already in deps)

**Reuse**: Existing `HarvestHistorySection` component, `react-native-svg` for charts.

---

### F6: Growth Stage Auto-Progression + Annual Cycling (Phase B)

**Approach**: Computed on-the-fly from `planting_date` + per-variety stage durations stored on `PlantCareProfile`. No background jobs, no timers. The function `getEffectiveGrowthStage(plant, careProfile)` is called at render time on `PlantDetailScreen` and `PlantCard`. Manual pin/unpin allows the user to override the computed stage (e.g. "I see flowers" → pin to Flowering).

**Design Decisions**:
- **Computed, not stored**: The "current" growth stage is derived from elapsed days since `planting_date` + profile durations. Only explicit manual overrides (`growth_stage_pinned`) and historical transitions (`growth_stage_history`) are persisted to Firestore.
- **Pin/unpin**: When a user manually selects a stage, `growth_stage_pinned` is set to that stage. `getEffectiveGrowthStage()` returns pinned stage if set, otherwise computes. User can "Clear override" to unpin.
- **Annual cycling for fruit trees**: After `yearsToFirstHarvest` elapses, fruit trees enter a repeating annual cycle: Flowering → Fruiting → Harvest → Dormancy. The cycle start month varies by species (mango: Dec, jackfruit: Dec, lemon: Feb, guava: continuous).
- **Coconut exempt**: Coconut trees use the existing `getCoconutAgeInfo()` function which computes 6 age stages. They are excluded from the growth stage engine.
- **Timber trees**: Progress through Seedling → Vegetative → Mature, then stay at Mature permanently.

**Data Model Changes** (`database.types.ts`):

```typescript
// Extend PlantCareProfile
growthStageDurations?: Partial<Record<GrowthStage, number>>;  // days per stage
annualCycleDurations?: Partial<Record<GrowthStage, number>>;  // days per annual cycle stage (fruit trees)
floweringStartMonth?: number;  // 1-12, month when annual cycle begins (e.g. 12 for mango)

// Extend Plant interface
growth_stage_pinned?: GrowthStage | false;  // manual override, false = use computed
growth_stage_history?: Array<{
  stage: GrowthStage;
  entered_at: string;   // ISO date
  source: 'computed' | 'manual';
  notes?: string;
}>;
```

**Stage Sequences by PlantType**:

| PlantType      | Linear Stages                                        | Annual Cycle (after maturity)           |
| -------------- | ---------------------------------------------------- | --------------------------------------- |
| `vegetable`    | Seedling → Vegetative → Flowering → Fruiting → Harvest | None (replant)                          |
| `herb`         | Seedling → Vegetative → Harvest                        | None (continuous harvest perennials)    |
| `flower`       | Seedling → Vegetative → Flowering → Harvest            | None (replant annuals)                  |
| `fruit_tree`   | Seedling → Vegetative → Mature                         | Flowering → Fruiting → Harvest → Dormancy |
| `timber_tree`  | Seedling → Vegetative → Mature                         | None (stays Mature)                     |
| `shrub`        | Seedling → Vegetative → Flowering → Fruiting           | Optional annual if deciduous            |
| `coconut_tree` | _Exempt — uses `getCoconutAgeInfo()`_                 | N/A                                     |

**Annual Cycling Data** (Kanyakumari fruit trees):

| Variety      | floweringStartMonth | Cycle                                    | Notes                          |
| ------------ | ------------------- | ---------------------------------------- | ------------------------------ |
| Mango        | 12 (Dec)            | Flower(60d) → Fruit(90d) → Harvest(30d) → Dormant(185d) | One main season                |
| Jackfruit    | 12 (Dec)            | Flower(45d) → Fruit(120d) → Harvest(45d) → Dormant(155d) | Long fruiting                 |
| Banana       | —                   | One-shot: Flower → Fruit → Harvest → **replant** | No cycling, sucker replant     |
| Papaya       | continuous           | Flower(30d) → Fruit(120d) → Harvest(30d) → repeat | Near-continuous after maturity |
| Guava        | continuous           | Flower(30d) → Fruit(90d) → Harvest(30d) → repeat  | Two flushes per year           |
| Lemon/Lime   | 2 (Feb)             | Flower(30d) → Fruit(150d) → Harvest(60d) → Dormant(125d) | Main + minor flush            |
| Pomegranate  | 2 (Feb)             | Flower(30d) → Fruit(150d) → Harvest(30d) → Dormant(155d) | Monsoon harvest                |

**Computation Engine**:

```typescript
// New file: src/utils/growthStageHelpers.ts

/** Compute the expected linear growth stage from planting_date + durations */
export function computeExpectedGrowthStage(
  plantingDate: string,
  plantType: PlantType,
  durations: Partial<Record<GrowthStage, number>>
): { stage: GrowthStage; daysInStage: number; daysRemaining: number };

/** For fruit trees past yearsToFirstHarvest, compute annual cycle position */
export function computeAnnualCycleStage(
  plantingDate: string,
  yearsToFirstHarvest: number,
  floweringStartMonth: number,
  cycleDurations: Partial<Record<GrowthStage, number>>
): { stage: GrowthStage; daysInStage: number; daysRemaining: number } | null;

/** Top-level: returns pinned stage if set, otherwise computed (linear or annual) */
export function getEffectiveGrowthStage(
  plant: Plant,
  careProfile: PlantCareProfile
): { stage: GrowthStage; source: 'pinned' | 'computed' | 'annual_cycle'; daysInStage: number; daysRemaining: number };
```

**Stage Duration Derivation** (for profiles lacking explicit `growthStageDurations`):
- `seedling` = `germinationDays.max + 7` (or 21 days default)
- Remaining days (`daysToHarvest.max - seedling`) split by plant type:
  - Vegetables: Vegetative 40%, Flowering 25%, Fruiting+Harvest 35%
  - Herbs: Vegetative 60%, Harvest 40%
  - Flowers: Vegetative 40%, Flowering 40%, Harvest 20%
  - Fruit trees: Vegetative until `yearsToFirstHarvest`, then Mature + annual cycle

**Files Modified**:
- `src/types/database.types.ts` — new fields on `PlantCareProfile` and `Plant`
- `src/utils/plantCareDefaults.ts` — add `growthStageDurations` / `annualCycleDurations` / `floweringStartMonth` for 40+ varieties
- `src/utils/growthStageHelpers.ts` — **NEW** (3 exported functions above)
- `src/services/plants.ts` — `pinGrowthStage(plantId, stage)`, `unpinGrowthStage(plantId)`, `appendGrowthStageHistory(plantId, entry)`
- `src/screens/PlantDetailScreen.tsx` — growth timeline visualization, pin/unpin button, annual cycle indicator
- `src/components/PlantCard.tsx` — show computed stage badge
- `src/__tests__/utils/growthStageHelpers.test.ts` — **NEW** unit tests

**Migration**: `004_growthStageHistory.ts`:
- For each plant with `growth_stage` and `created_at`, seed `growth_stage_history` with one entry `{ stage, entered_at: created_at, source: 'computed' }`
- Set `growth_stage_pinned = false` on all plants

**Edge Cases**:
- No `planting_date` → show "Set planting date to track growth" prompt, no computation
- No `growthStageDurations` on profile → derive from `daysToHarvest` using split ratios above
- Dormancy → manual stage only (user marks "I'm overwintering this plant")
- Banana → one-shot lifecycle, no annual cycling, prompt "Replant sucker?" after harvest
- Pre-bearing perennials (fruit tree < yearsToFirstHarvest) → show "X years until first harvest" instead of annual cycle

---

### F7: Zone-Based Planting (Phase B)

**Data Model Changes** (`database.types.ts`):

```typescript
// Add to Plant interface
planting_zone?: 'under_canopy' | 'partial_shade' | 'open_sun' | 'border_fence' | 'raised_bed';
```

**Files Modified**:

- `src/utils/plantHelpers.ts` — extend companion logic with zone-aware rules
- `src/components/forms/EditLocationSection.tsx` — add zone picker
- `src/screens/PlantFormScreen.tsx` — show companion warnings when zone selected
- `src/services/plants.ts` — include zone in queries

**New Files**:

- `src/utils/zoneCompanionRules.ts` — zone-specific companion/antagonist matrix (pepper loves coconut shade, turmeric under banana, etc.)

> **Note**: F7 Zone-Based Planting is subsumed by Phase B2 Bed Management (bed light zones + guild layers). See F12 below.

---

### F12: Bed Management (Phase B2)

**Design**: Generic farm bed layout — works for any organic garden, not locked to coconut intercrop. The `has_coconut_canopy` field is an optional boolean property on any bed, not a bed type. Beds are first-class Firestore entities linked to plants via `bed_id`.

**Cross-Cutting Impact** — 16 existing screens/components need bed awareness:

| Existing File                  | Integration                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `PlantFormScreen` / `usePlantFormState` | Bed picker dropdown replaces free-text `bedName`; `bedId`/`bedLayer` state; auto-fill light zone from bed |
| `EditLocationSection.tsx`      | Bed dropdown (populated from `getBeds()`) when `spaceType === "bed"`                              |
| `WizardStep2.tsx`              | Bed picker in wizard step 2 location section                                                      |
| `PlantCard.tsx`                | Bed tag badge from `bed_id` (replaces static `bed_name` display)                                  |
| `PlantDetailScreen.tsx`        | New "Bed Context" section: bed name, dimensions, layer, bed-mates, companion indicators            |
| `TaskCard.tsx`                 | Bed subtitle below plant name (e.g. "Tomato #3 · Bed A")                                         |
| `PlantFilterSheet.tsx`         | New "Bed" filter section with chips per bed name + plant counts                                    |
| `PlantsScreen.tsx`             | "Group by bed" option in sort/group controls                                                       |
| `CalendarScreen.tsx`           | Add `"bed"` to `GROUP_OPTIONS` for bed-grouped task view                                           |
| `TodayScreen.tsx`              | Bed overview card: bed count, occupancy %, legume coverage %, beds needing rotation                 |
| `JournalFormScreen.tsx`        | Bed picker (bed-level observations: soil prep, mulching, rotation notes)                           |
| `JournalScreen.tsx`            | "Filter by bed" chip; bed badge on entry cards                                                     |
| `plants.ts` (service)          | `getPlantsByBed(bedId)` — new query with composite index `user_id + bed_id`                       |
| `storage.ts`                   | Add `KEYS.BEDS_CACHE`                                                                              |
| `dataCache.ts`                 | Add `CACHE_KEYS.BEDS`, `CACHE_KEYS.BED_DETAIL`                                                    |
| `firestore.rules`              | Add `beds/{bedId}` owner-only read/write rules                                                     |

**Data Model Changes** (`database.types.ts`):

```typescript
// New types
type BedType = 'leafy' | 'fruiting' | 'spice' | 'root_legume' | 'climber' | 'herb' | 'mixed';
type LightZone = 'full_sun' | 'partial_shade' | 'low_light';
type CropFamily = 'leafy' | 'solanaceae' | 'legume' | 'root' | 'spice' | 'cucurbit' | 'allium' | 'rest';
type BedLayer = 'canopy' | 'mid' | 'ground_cover' | 'root';
type BedStatus = 'active' | 'resting' | 'preparing' | 'empty';
interface BedPosition { row: number; col: number; }
interface CropFamilyEntry { family: CropFamily; startDate: string; endDate: string | null; }

// Bed interface (new Firestore collection: beds)
interface Bed {
  id: string;
  user_id: string;
  bed_tag: string;                    // e.g. "L1", "F2", "R1"
  bed_type: BedType;
  name: string;
  width_m: number;                    // max 1.2m enforced
  length_m: number;
  light_zone: LightZone;
  sun_hours?: number;
  has_coconut_canopy?: boolean;       // optional — generic, not a bed type
  distance_from_trunk_m?: number;     // relevant only when has_coconut_canopy
  is_permanent?: boolean;
  current_crop_family?: CropFamily | null;
  crop_family_history: CropFamilyEntry[];
  last_rotation_date?: string | null;
  rotation_due_date?: string | null;
  status: BedStatus;
  rest_crop?: string | null;
  chop_drop_due_date?: string | null;
  location_id?: string | null;        // links to existing location hierarchy
  notes?: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

// Extend Plant interface (all optional — no migration needed)
bed_id?: string | null;               // foreign key to Bed.id
bed_layer?: BedLayer | null;
sow_date?: string | null;
crop_family?: CropFamily | null;
spacing_cm?: number | null;
position_in_bed?: BedPosition | null;
light_requirement?: LightZone | null;
season_suitability?: string[];

// Extend JournalEntry (optional — no migration)
bed_id?: string | null;
```

**Config Data** — new `src/config/beds/` directory:

| File                      | Content                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| `bedRecommendations.ts`   | Land area (cents) → recommended bed count/size/path width lookup table                      |
| `guildDefaults.ts`        | Permaculture 4-layer defaults per bed type (canopy/mid/ground/root plant examples)           |
| `companionRules.ts`       | `BENEFICIAL_PAIRS`, `HARMFUL_PAIRS` arrays; guild validation constants (max 1 canopy/2m, tulsi 60cm, marigold in fruiting beds, fennel isolation) |
| `bedPlantCatalog.ts`      | 25+ Kanyakumari bed plants with `crop_family`, `light_requirement`, `spacing_cm`, `season_suitability`, `tamil_name`, `bed_layer` defaults. Separate from existing `plantCareDefaults.ts`. |
| `rotationRules.ts`        | Rotation sequence (Leafy→Fruiting→Legume→Root→repeat), Solanaceae 730-day rule, 40% legume buffer, L1/L2 stagger logic |
| `index.ts`                | Re-exports                                                                                   |

**Service Functions** (`src/services/beds.ts`) — follows `plants.ts` pattern (cache → `refreshAuthToken()` → `withTimeoutAndRetry()` → update cache → AsyncStorage fallback):

| Function                    | Purpose                                                                    |
| --------------------------- | -------------------------------------------------------------------------- |
| `getBeds()`                 | Paginated, offline-first, cache key `CACHE_KEYS.BEDS`                     |
| `getBedById(bedId)`         | Single fetch with dataCache freshness                                      |
| `createBed(bedData)`        | Write to `beds` collection, invalidate cache                               |
| `updateBed(bedId, updates)` | Partial update, invalidate                                                 |
| `deleteBed(bedId)`          | Soft delete, cascade: set `bed_id = null` on all plants in that bed        |
| `assignPlantToBed(...)`     | Updates plant `bed_id` + `bed_layer` + updates bed `current_crop_family`   |
| `removePlantFromBed(plantId)` | Sets plant `bed_id = null`                                              |
| `getRotationSuggestion(bedId)` | Reads `crop_family_history`, returns next family + top 3 crops          |
| `markBedResting(bedId, restCrop)` | Sets status = resting, creates 45-day task via `createTaskTemplate()` |
| `getLegumeCoveragePercent()` | `(beds in legume/rest) / (total non-permanent beds)`                      |

**Domain Helpers** (`src/utils/bedHelpers.ts`) — pure functions, no Firestore:

| Function                          | Purpose                                                                    |
| --------------------------------- | -------------------------------------------------------------------------- |
| `getNextRotationFamily(current, history)` | Returns next family in rotation sequence                           |
| `isSolanaceaeViolation(history)`  | Checks 730-day window for repeat Solanaceae                                |
| `getCompanionCompatibility(a, b)` | Returns `"beneficial" \| "harmful" \| "neutral"`                           |
| `getSuggestedCropsForBed(bed, season)` | Top 5 crops filtered by light zone + season + rotation                |
| `calculateHarvestGap(L1, L2)`     | Days gap warning for staggered leafy beds                                  |
| `getRecommendedBedCount(cents)`   | `{ beds, bedSize, pathWidth, notes }`                                      |
| `validateBedWidth(widthM)`        | Error string if > 1.2m                                                     |
| `validateCoconutDistance(distM)`  | Error string if < 2.0m with canopy                                         |
| `getLightZoneFromSunHours(hours)` | Derives `LightZone` from numeric sun hours                                 |
| `getGuildValidationWarnings(bed, plants)` | Canopy count, tulsi spacing, marigold missing, etc.                |

**New Files** (22):

- `src/config/beds/` — 6 config files
- `src/services/beds.ts` — CRUD service
- `src/utils/bedHelpers.ts` — pure domain logic
- `src/hooks/useBedData.ts`, `src/hooks/useBedDetail.ts` — data hooks
- `src/screens/BedListScreen.tsx`, `BedDetailScreen.tsx`, `BedFormScreen.tsx`, `BedPlantPickerScreen.tsx`
- `src/components/BedCard.tsx`
- `src/styles/bedListStyles.ts`, `bedDetailStyles.ts`, `bedFormStyles.ts`, `bedPlantPickerStyles.ts`, `bedCardStyles.ts`
- `src/__tests__/utils/bedHelpers.test.ts`, `src/__tests__/services/beds.test.ts`

**Decisions**:

- **Generic, not coconut-intercrop**: `has_coconut_canopy` is optional boolean. Any farm layout works.
- **New top-level Beds tab**: 6th tab via FloatingTabBar, icon `grid-outline`. Verify layout on narrow screens (320dp) during B2.5.
- **Separate bed catalog**: `src/config/beds/bedPlantCatalog.ts` does NOT modify existing `plantCareDefaults.ts`.
- **No migration needed**: All Plant/JournalEntry extensions are optional fields (null default). Beds collection is new.
- **SVG deferred**: B2.11 not implemented until B2.1–B2.10 verified stable. Data integrity before cosmetics.
- **Solanaceae 2-year rule**: Blocking warning with user override, not a hard block.
- **`area_sqm`**: Computed client-side (`width_m × length_m`), not stored in Firestore.
- **Existing phase overlaps subsumed**: G7 (zone planting) → B2 light zones; G12 (crop rotation) → B2.10 rotation engine; B.5 (zone-based planting) → B2 bed light zones + guild layers; H.1 partially → B2.10; H.2 partially → B2 bed entities.

---

### F8: Voice-to-Text (Phase E)

**Files Modified**:

- `src/screens/JournalFormScreen.tsx` — add microphone button next to content input
- `src/styles/journalFormStyles.ts` — mic button styles

**Dependencies**: `@react-native-voice/voice` (requires dev client, not Expo Go)

---

### F9: Planter-Style Plant Form Enrichment (Phase B)

**Goal**: Bring Planter.garden's depth to the plant-edit form — botanical identity, quick-info ranges, beneficials, nutrition, narrative care, safety — adapted for Kanyakumari (no frost; metric; monsoon-aware; pet toxicity).

**Configurability Model (Hybrid)**:

- **Fully read-only** (static config, displayed but never user-edited): botanical identity, nutrition (vitamins/minerals/superfood from ICMR-NIN/USDA), pet toxicity, companion/incompatible plants, narrative care content.
- **User-extendable** (static base + user custom additions per variety via ManagePlantCatalog care modal): pests, diseases, beneficial critters. Three new `custom*` fields on `PlantCareProfile` (see F2). ManagePlantCatalog care modal gets 3 new collapsible sections showing static chips (greyed, read-only) + user chips (removable) + "Add custom" input.
- **Per-plant observations** (existing, unchanged): `Plant.pest_disease_history` via `PestDiseaseModal`.

**Data Categorization**:

_Fully Read-Only_ (static config — no user editing):

| Field                                                       | Source                                     | Displayed On                                                |
| ----------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| `scientificNames`, `taxonomicFamily`, `lifecycle`           | `plantCareDefaults.ts`                     | `EditBotanicalIdentitySection`                              |
| `description`, `tamilName`, `tamilDescription`              | `plantCareDefaults.ts`                     | `EditBotanicalIdentitySection`                              |
| `vitamins`, `minerals`, `macronutrients`, `nutritionSource` | `plantCareDefaults.ts`                     | `EditNutritionSection` (read-only)                          |
| `petToxicity`                                               | `plantCareDefaults.ts`                     | `EditSafetySection` (read-only)                             |
| Companion plants                                            | `COMPANION_PLANTS` in `plantHelpers.ts`    | `EditRelationshipsSection` (read-only chips)                |
| Incompatible plants                                         | `INCOMPATIBLE_PLANTS` in `plantHelpers.ts` | `EditRelationshipsSection` (read-only chips)                |
| Quick info ranges                                           | `plantCareDefaults.ts`                     | `EditQuickInfoSection` (editable via care override pattern) |
| Narrative care                                              | `plantCareDefaults.ts`                     | `EditCareGuidanceSection` (read-only)                       |

_User-Extendable_ (static base + user custom additions per variety, edited in ManagePlantCatalog care modal):

| Field                     | Static Base                        | User Custom Field              | Edited In                     |
| ------------------------- | ---------------------------------- | ------------------------------ | ----------------------------- |
| Pests for this variety    | `getCommonPests(type, variety)`    | `customPests?: string[]`       | ManagePlantCatalog care modal |
| Diseases for this variety | `getCommonDiseases(type, variety)` | `customDiseases?: string[]`    | ManagePlantCatalog care modal |
| Beneficial critters       | `getBeneficialsForPlant(ids)`      | `customBeneficials?: string[]` | ManagePlantCatalog care modal |

_Per-Plant Observations_ (existing, unchanged):

| Field                                       | Storage          | Edited In          |
| ------------------------------------------- | ---------------- | ------------------ |
| `pest_disease_history: PestDiseaseRecord[]` | `Plant` document | `PestDiseaseModal` |

**Merge Logic**:

`customPests`/`customDiseases`/`customBeneficials` are separate from the static lists — they don't exist on the base `PlantCareProfile`. The existing shallow spread `{ ...base, ...override }` works unchanged. Display layer merges: `[...getCommonPests(type, variety), ...override.customPests ?? []]`. Custom entries render as removable chips; static entries render as read-only greyed chips. `normalizeOverride()` in `plantCareProfiles.ts` needs only a trim/deduplicate validation pass for the 3 new array fields — no structural change to the merge algorithm.

**ManagePlantCatalog Screen Changes**:

Add 3 new collapsible sections below the existing care frequency fields in the care profile modal:

1. **Known Pests** — static reference pests as read-only greyed chips + user `customPests` as removable chips + "Add custom pest" text input
2. **Known Diseases** — same pattern as pests
3. **Known Beneficial Critters** — config beneficials as read-only chips + user `customBeneficials` as removable chips + "Add custom beneficial" input

`CareFormState` extension: add `customPests: string[]`, `customDiseases: string[]`, `customBeneficials: string[]`.

**UX Flows**:

_Adding a custom pest to a variety (e.g. "Scale Insects" for Mango)_:

1. More → Manage Plant Catalog → Fruit → Mango → care profile modal
2. Scroll to "Known Pests" — static pests shown as read-only greyed chips
3. Type "Scale Insects" → tap Add → removable chip appears
4. Save → stored in `user_settings/{uid}.plantCareProfiles.Fruit.Mango.customPests`

_Viewing pest data on a plant_:

1. PlantEditForm → `EditRelationshipsSection` shows reference pests + custom pests (merged, read-only chips)
2. Tap any pest chip → navigates to PestDetailScreen (F11 / F10)
3. "Customize in Manage Plant Catalog" link to add custom entries

_Browsing reference screens (F11 / F10)_:

1. More → Pests / Diseases / Beneficials (separate menu items)
2. Pest list → searchable list grouped by category (Sap-Sucking, Borers, etc.)
3. Tap "Aphids" → PestDetailScreen with Identification, Organic Prevention, Organic Treatment cards, Seasonal Risk, Plants Affected

_Recording an actual pest incident (per-plant history)_:

1. "Add Pest/Disease Record" on PlantEditForm → existing `PestDiseaseModal`
2. Records date, pest name, treatment, outcome → saved to `Plant.pest_disease_history`
3. This is per-plant observation history, not catalog-level reference data

**Schema additions**: All new fields live on `PlantCareProfile` (catalog-level, shared across all instances of a variety). Per-plant overrides continue to use existing `Plant` fields. No duplication. See F2 for the full extended type definition.

**New Form Components** (inserted into `PlantEditForm.tsx` between `EditCareScheduleSection` and `Plant Health`, each with colocated `*Styles.ts`):

| Component                          | Role                                                                                                                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EditBotanicalIdentitySection.tsx` | Read-only: scientific names, taxonomic family, lifecycle, Tamil name, description                                                                                                                                                   |
| `EditQuickInfoSection.tsx`         | Editable (auto-filled from variety): spacing, depth, water, sun range, growing season, 3-axis tolerance, germination, height, days-to-harvest, soil pH                                                                              |
| `EditRelationshipsSection.tsx`     | Companion plants, antagonist plants, common pests, common diseases — chip rows; pest/disease/beneficial chips are **tappable deep-links** to detail pages (F10); "Customize in Manage Plant Catalog" link for adding custom entries |
| `EditBeneficialsSection.tsx`       | Horizontal `FlatList` of beneficial-critter image chips; tap → **BeneficialDetailScreen** (F10); shows merged static + custom beneficials                                                                                           |
| `EditNutritionSection.tsx`         | Read-only: vitamin/mineral/macro chip rows (ICMR-NIN/USDA source, no user editing)                                                                                                                                                  |
| `EditCareGuidanceSection.tsx`      | Expandable text blocks: Growing-from-Seed, Feeding, Harvesting, Storage (fresh/frozen/dried), Pruning                                                                                                                               |
| `EditSafetySection.tsx`            | Conditional (only if `petToxicity` present) — dog/cat badges with notes                                                                                                                                                             |

**New Reference Data**:

- `src/config/beneficials/index.ts` — registry + `getBeneficialById(id)` / `getBeneficialsForPlant(ids)`
- `src/config/beneficials/kanyakumari.ts` — ~20 regionally-meaningful species with bundled image assets (honeybees, ladybird, trichogramma, parakeets, bulbuls, dragonflies, earthworms, praying mantis, spiders, etc.)

**Supporting Component**:

- `src/components/PlantNowBanner.tsx` — zone-aware "Plant now ✅ / Wait until X" badge (see F3)

**Reuse**:

- `CollapsibleSection` — every new section
- `FloatingLabelInput`, `ThemedDropdown` — numeric inputs + unit selectors
- `getCurrentSeason()` / `getSeasonLabel()` from `seasonHelpers.ts`
- `getPlantCareProfile()` for auto-fill from selected variety
- `expo-image` with `cachePolicy="memory-disk"` for beneficial critter thumbnails
- Existing companion/antagonist helpers in `plantHelpers.ts` (770+ pairs, 30+ incompatibilities)

**Wizard changes**: None. Step 3 ("How") already covers sunlight/water/fertiliser. New fields auto-populate from variety profile on save. Add-wizard stays 3 steps.

**Tests**:

- `src/__tests__/config/beneficials.test.ts` — registry shape + lookup tests
- `src/__tests__/utils/plantCareDefaults.test.ts` — every variety has mandatory Quick Info fields populated; range `min ≤ max`
- `src/__tests__/migrations/002_seedCatalog.test.ts` — idempotent; preserves user customisations

**Risks**:

- Asset bundle growth from beneficial-critter images — mitigate with compressed WebP, ~40 KB each, ~1 MB total for 20 species
- Migration 002 must merge not overwrite — existing normalisation pattern in `plantCatalog.ts` already handles this

---

### F10: Beneficials + Custom Entry CRUD (Phase A3) — ⏭ DEFERRED

**Goal**: Browseable reference pages for beneficial critters as a separate More menu item, plus custom entry CRUD for pests/diseases/beneficials — adapted for organic gardening in Kanyakumari. Consolidates the existing scattered data (~52 `ORGANIC_TREATMENTS`, ~140 `TREATMENT_DETAILS`, ~37 `PEST_CATEGORY_MAP`/`DISEASE_CATEGORY_MAP`, 14 crops in `TAMIL_NADU_CROP_SPECIFIC_ISSUES`) into structured reference types with detail screens.

**Prerequisite**: F11 (Phase A) implements the standalone Pest & Disease reference screens first — static config files, two list screens, two detail screens, no Firestore reads. F10 builds on top: adding the Beneficials reference, custom entry CRUD, and deep-links from plant forms. Implement F11 before F10.

**Planter Section Mapping (Organic KK Adaptation)**:

| Planter Section   | Our Equivalent                  | Notes                                                          |
| ----------------- | ------------------------------- | -------------------------------------------------------------- |
| Identification    | **Identification** + Tamil name | Local language first                                           |
| Damage Prevention | **Organic Prevention**          | Renamed to emphasize proactive organic methods                 |
| Physical Control  | **Organic Treatment**           | Merged with existing 140+ `TREATMENT_DETAILS`                  |
| Chemical Control  | **OMITTED**                     | Organic-only app — no synthetic chemicals                      |
| Plants Affected   | **Plants Affected**             | Tappable chips navigating to plant detail                      |
| _(new)_           | **Seasonal Risk**               | Which KK seasons (summer, SW/NE monsoon, cool dry) issue peaks |

For Beneficials:

| Planter Section | Our Equivalent |
| --- | --- |
| Common Species | **Common Species** |
| Why Helpful | **Why Helpful** |
| How To Attract | **How To Attract** |
| Identification | **Identification** + Tamil name |
| _(new)_ | **Plants To Grow** (attract this beneficial) |
| _(new)_ | **Pests Controlled** |
| _(new)_ | **Seasonal Presence** (which KK seasons active) |

**Data Type Definitions** (`database.types.ts`):

```typescript
interface PestReference {
  id: string;
  name: string;
  tamilName?: string;
  category: 'sucking' | 'chewing' | 'boring' | 'soil' | 'storage';
  emoji?: string;
  identification: string; // 2–3 sentence description
  damageDescription: string;
  organicPrevention: string[]; // ["Neem seed kernel extract spray", "Yellow sticky traps"]
  organicTreatments: OrganicTreatment[];
  seasonalRisk?: Partial<Record<KKSeason, 'low' | 'moderate' | 'high'>>;
  plantsAffected: string[]; // variety names, tappable
  imageAsset?: string; // bundled asset reference
  isCustom?: boolean; // true for user-created entries
}

interface DiseaseReference {
  id: string;
  name: string;
  tamilName?: string;
  category: 'fungal' | 'bacterial' | 'viral' | 'physiological' | 'nematode';
  emoji?: string;
  identification: string;
  damageDescription: string;
  organicPrevention: string[];
  organicTreatments: OrganicTreatment[];
  seasonalRisk?: Partial<Record<KKSeason, 'low' | 'moderate' | 'high'>>;
  plantsAffected: string[];
  imageAsset?: string;
  isCustom?: boolean;
}

interface OrganicTreatment {
  name: string; // "Neem oil spray"
  recipe?: string; // "2–3 ml/L water + 1 ml soap emulsifier"
  method?: string; // "Foliar spray, evening application"
  frequency?: string; // "Every 7–10 days"
  effort?: 'easy' | 'moderate' | 'involved';
}

interface BeneficialReference {
  id: string;
  name: string;
  tamilName?: string;
  emoji?: string;
  category:
    | 'insect'
    | 'arachnid'
    | 'bird'
    | 'reptile'
    | 'amphibian'
    | 'earthworm'
    | 'microorganism';
  commonSpecies: string[];
  whyHelpful: string;
  identification: string;
  howToAttract: string[];
  plantsToGrow: string[]; // plants that attract this beneficial
  pestsControlled: string[];
  seasonalPresence?: Partial<Record<KKSeason, boolean>>;
  imageAsset?: string;
  isCustom?: boolean;
}
```

**KK Beneficial Critter Registry** (~20 entries):

| Name | Category | Tamil Name | Key Role |
| --- | --- | --- | --- |
| Honeybee (_Apis cerana indica_) | insect | தேனீ | Pollination |
| Ladybird Beetle | insect | பொறிவண்டு | Aphids, mealybugs, scale |
| Trichogramma wasp | insect | முட்டை ஒட்டுண்ணி | Borer eggs |
| Green Lacewing | insect | பச்சை இறகி | Aphids, whiteflies, thrips |
| Praying Mantis | insect | பூச்சிப்புலி | General predator |
| Dragonfly | insect | தட்டான் | Flying pests |
| Ground Beetle | insect | தரை வண்டு | Slugs, cutworms |
| Spider | arachnid | சிலந்தி | General trapping |
| Earthworm | earthworm | மண்புழு | Soil aeration |
| Hover Fly | insect | பறக்கும் ஈ | Aphids (larvae) |
| Braconid Wasp | insect | — | Caterpillars, borers |
| Red-vented Bulbul | bird | கொண்டலாத்தி | Caterpillars, beetles |
| Indian Robin | bird | கருஞ்சிட்டு | Ground insects |
| Common Myna | bird | நாகணவாய் | Grasshoppers, termites |
| Garden Lizard | reptile | ஓணான் | Beetles, caterpillars, ants |
| Common Frog | amphibian | தவளை | Slugs, insects |
| _Trichoderma viride_ | microorganism | — | Soil fungi, root rot |
| _Pseudomonas fluorescens_ | microorganism | — | Bacterial wilt, damping off |
| _Beauveria bassiana_ | microorganism | — | Borers, weevils, whiteflies |
| _Metarhizium anisopliae_ | microorganism | — | Rhinoceros beetle, root grubs |

**New Screens** (under MoreStack):

| Screen                   | Route              | Purpose                                                                                                                                        |
| ------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `GardenReferenceScreen`  | `GardenReference`  | 3-tab layout (Pests / Diseases / Beneficials), searchable `FlatList`, FAB to add custom entry                                                  |
| `PestDetailScreen`       | `PestDetail`       | Full detail with Identification, Organic Prevention, Organic Treatment (with recipe/method cards), Seasonal Risk badges, Plants Affected chips |
| `DiseaseDetailScreen`    | `DiseaseDetail`    | Same layout as PestDetailScreen                                                                                                                |
| `BeneficialDetailScreen` | `BeneficialDetail` | Common Species, Why Helpful, Identification, How To Attract, Plants To Grow, Pests Controlled, Seasonal Presence                               |

**New Config Files**:

- `src/config/pests/index.ts` — registry + `getPestById()` / `getAllPests()` / `getPestsForPlant(variety)`
- `src/config/pests/kanyakumari.ts` — ~40 pest entries consolidated from `plantHelpers.ts` scattered data
- `src/config/diseases/index.ts` — registry + `getDiseaseById()` / `getAllDiseases()`
- `src/config/diseases/kanyakumari.ts` — ~30 disease entries

**New Service**:

- `src/services/gardenReference.ts` — manages custom pest/disease/beneficial entries; reads/writes `user_settings/{uid}.customPestReferences`, `customDiseaseReferences`, `customBeneficialReferences`; merges static + custom for display

**New Style Files**:

- `src/styles/gardenReferenceStyles.ts`
- `src/styles/pestDetailStyles.ts`
- `src/styles/diseaseDetailStyles.ts`
- `src/styles/beneficialDetailStyles.ts`

**Navigation Changes** (`AppNavigator.tsx`):

- Add 4 routes to `MoreStack`: `GardenReference`, `PestDetail`, `DiseaseDetail`, `BeneficialDetail`
- Deep-link navigation from form screens uses `navigation.navigate('MoreTab', { screen: 'PestDetail', params: { id } })`

**Deep-Link Integration Points** (F10 → existing screens):

- `PestDiseaseModal` — pest/disease name chips become tappable, navigate to detail screen
- `EditRelationshipsSection` — pest/disease chip rows deep-link to detail screens
- `EditBeneficialsSection` — beneficial critter chips deep-link to BeneficialDetailScreen
- `PestDiseaseHistorySection` — history entries deep-link to reference pages for that pest/disease

**Custom Entry Storage** (in `user_settings/{uid}`):

```typescript
customPestReferences?: PestReference[];     // isCustom = true
customDiseaseReferences?: DiseaseReference[];
customBeneficialReferences?: BeneficialReference[];
```

**Custom Entry CRUD**:

- Add via GardenReferenceScreen FAB → form with minimal required fields (name, category, identification)
- Add via ManagePlantCatalog care modal → same form, auto-links to current variety's `customPests`/`customDiseases`/`customBeneficials`
- Edit/delete from detail screen header menu
- Custom entries appear alongside static entries in all lists, distinguished by subtle badge

**Scope Boundaries**:

_Included_:

- 4 reference screens: `GardenReferenceScreen` (3-tab container), `PestDetailScreen`, `DiseaseDetailScreen`, `BeneficialDetailScreen`
- ~130 enriched entries in static config (`src/config/pests/`, `src/config/diseases/`, `src/config/beneficials/`)
- Custom entry CRUD stored in `user_settings/{uid}` via `gardenReference.ts` service
- Deep-links from pest/disease/beneficial chips across the app (`PestDiseaseModal`, `EditRelationshipsSection`, `EditBeneficialsSection`, `PestDiseaseHistorySection`)
- FAB "+" to add custom entries from `GardenReferenceScreen`; edit/delete from detail screen header menu
- ~55 bundled reference images (WebP, ~40 KB each)
- `getMergedPests()` / `getMergedDiseases()` helpers in `plantHelpers.ts`

_Excluded (current scope)_:

- User-editable nutrition data or pet toxicity data
- User-editable companion/incompatible plant lists (Phase H candidate)
- Custom organic treatment recipes per pest
- Per-plant custom pest/disease additions (use existing `PestDiseaseModal` for per-plant observation history)

**Tests**:

- `src/__tests__/config/pests.test.ts` — registry shape, lookup, all entries have required fields
- `src/__tests__/config/diseases.test.ts` — same pattern
- `src/__tests__/services/gardenReference.test.ts` — CRUD, merge logic, custom + static deduplication

**Risks**:

- Data consolidation from scattered `plantHelpers.ts` maps into structured `PestReference`/`DiseaseReference` is the main effort — ~2 days of manual mapping
- Cross-stack navigation (from PlantEditForm in PlantsStack to MoreStack) requires `CompositeNavigationProp` — already documented in navigation standards

---

### F11: Pest & Disease Reference Screens (Phase A)

**Goal**: Two standalone browseable reference screens directly accessible from the More tab — one for Pests, one for Diseases. Each has a searchable list view (grouped by category) and a full detail page. All data is static in-app config — no Firestore reads, no migration needed. The existing scattered pest/disease constants in `plantHelpers.ts` are consolidated into structured config files under `src/config/`.

**Scope**: Static reference only. Custom entry CRUD (G30) and deep-links from plant forms (2.15) are separate steps that build on top of this foundation.

---

#### Field Design

| User Field        | Type                   | Source                                                                                                                                                   |
| ----------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name              | `string`               | Keys from `PEST_CATEGORY_MAP` / `DISEASE_CATEGORY_MAP`                                                                                                   |
| Scientific Name   | `string?`              | Authored per entry (e.g. _Bactrocera dorsalis_, _Ralstonia solanacearum_)                                                                                |
| Images            | `imageAsset?: string`  | Reserved for future bundled WebP assets — rendered as placeholder now                                                                                    |
| Identification    | `string[]`             | Authored: 2–4 observable field symptoms per entry                                                                                                        |
| Damage Prevention | `string[]`             | `ORGANIC_TREATMENTS[name]` filtered where `TREATMENT_DETAILS[t].method === 'cultural'`                                                                   |
| Physical Control  | `string[]`             | `ORGANIC_TREATMENTS[name]` filtered where `method === 'trap' \| 'manual'`                                                                                |
| Organic Control   | `OrganicControlItem[]` | `ORGANIC_TREATMENTS[name]` filtered where `method === 'spray' \| 'biocontrol' \| 'soil'`; each item carries `method` + `effort` from `TREATMENT_DETAILS` |
| Related Plants    | `string[]`             | Inverted from `TAMIL_NADU_CROP_SPECIFIC_ISSUES` (pest/disease → crops it affects → map to variety names in `DEFAULT_PLANT_CATALOG`)                      |

**Physical vs Organic Control distinction** (important for Kanyakumari farmers):

- **Physical/Damage Prevention** = free, labour-based or cultural methods (traps, pruning, hygiene, crop rotation)
- **Organic Control** = prepared materials (neem oil sprays, bio-agents, soil drenches) — may require purchase or preparation time

---

#### Data Model Changes (`database.types.ts`)

Add after `JournalEntry`:

```typescript
export type PestCategory =
  | 'Sap-Sucking'
  | 'Mites & Spiders'
  | 'Borers & Larvae'
  | 'Beetles & Weevils'
  | 'Other Pests';

export type DiseaseCategory = 'Fungal' | 'Bacterial' | 'Viral' | 'Other';

export interface OrganicControlItem {
  name: string;
  method: 'spray' | 'trap' | 'biocontrol' | 'soil' | 'manual' | 'cultural';
  effort: 'easy' | 'moderate' | 'advanced';
}

export interface PestEntry {
  id: string; // kebab-slug: 'aphids', 'red-palm-weevil'
  name: string;
  scientificName?: string;
  tamilName?: string;
  category: PestCategory;
  emoji: string;
  imageAsset?: string; // future: bundled require() path
  identification: string[]; // 2–4 observable symptom strings
  damagePrevention: string[]; // cultural / preventive methods
  physicalControl: string[]; // traps, manual removal, barriers
  organicControl: OrganicControlItem[];
  relatedPlants: string[]; // variety names from DEFAULT_PLANT_CATALOG
}

export interface DiseaseEntry {
  id: string;
  name: string;
  scientificName?: string; // causal organism: 'Alternaria solani'
  tamilName?: string;
  category: DiseaseCategory;
  emoji: string;
  imageAsset?: string;
  identification: string[];
  damagePrevention: string[];
  physicalControl: string[];
  organicControl: OrganicControlItem[];
  relatedPlants: string[];
}
```

Union literals (not enums) for categories because the existing `PEST_CATEGORY_MAP` / `DISEASE_CATEGORY_MAP` already use these exact strings — direct compatibility, no mapping layer needed.

---

#### Config File Structure (mirrors `src/config/zones/` exactly)

```text
src/config/pests/
├── types.ts          — re-exports PestEntry, PestCategory, OrganicControlItem from database.types
├── kanyakumari.ts    — KANYAKUMARI_PESTS: PestEntry[]  (36 entries)
└── index.ts          — ALL_PESTS, getPestById(), getAllPests(),
                         getPestsForPlant(varietyName), getPestsByCategory()

src/config/diseases/
├── types.ts          — re-exports DiseaseEntry, DiseaseCategory, OrganicControlItem
├── kanyakumari.ts    — KANYAKUMARI_DISEASES: DiseaseEntry[]  (31 entries)
└── index.ts          — ALL_DISEASES, getDiseaseById(), getAllDiseases(),
                         getDiseasesForPlant(varietyName), getDiseasesByCategory()
```

**Data population for kanyakumari.ts files**:

- `id` ← kebab-slug of `name` (e.g. `'black-headed-caterpillar'`)
- `category` + `emoji` ← `PEST_CATEGORY_MAP[name]` / `DISEASE_CATEGORY_MAP[name]`
- `damagePrevention` ← treatments from `ORGANIC_TREATMENTS[name]` where `TREATMENT_DETAILS[t].method === 'cultural'`
- `physicalControl` ← treatments where `method === 'trap' | 'manual'`
- `organicControl` ← treatments where `method === 'spray' | 'biocontrol' | 'soil'`, enriched with `method` + `effort` from `TREATMENT_DETAILS`
- `relatedPlants` ← invert `TAMIL_NADU_CROP_SPECIFIC_ISSUES`: for each pest/disease find all 13 crop keys whose `.pests[]` / `.diseases[]` includes it; map crop key → variety names from `DEFAULT_PLANT_CATALOG`
- `identification` ← authored (2–4 field-observable symptoms per entry, ~4h domain writing)
- `scientificName` ← authored for ~20 priority pests/diseases

**Example entry (Aphids)**:

```typescript
{
  id: 'aphids',
  name: 'Aphids',
  scientificName: 'Aphis gossypii',
  tamilName: 'பேன்',
  category: 'Sap-Sucking',
  emoji: '🪰',
  identification: [
    'Clusters of tiny soft-bodied insects on new growth and leaf undersides',
    'Sticky honeydew residue on leaves causing secondary black sooty mold',
    'Curled or distorted new leaves and shoot tips',
    'Ants moving up and down stems (farming the aphids for honeydew)',
  ],
  damagePrevention: [
    'Intercrop with marigold or coriander to repel',
    'Maintain garden hygiene — remove weeds that harbour aphids',
  ],
  physicalControl: [
    'Dislodge with strong water jet in the morning',
    'Yellow sticky traps near affected plants',
    'Manual removal by hand-wiping or brushing',
  ],
  organicControl: [
    { name: 'Neem oil spray (2–3 ml/L)', method: 'spray', effort: 'easy' },
    { name: 'Soapnut water spray', method: 'spray', effort: 'easy' },
    { name: 'Garlic-chili spray', method: 'spray', effort: 'easy' },
    { name: 'Lady beetle release', method: 'biocontrol', effort: 'advanced' },
  ],
  relatedPlants: [
    'Country Tomato', 'Hybrid Tomato', 'Cherry Tomato',
    'Bird\'s Eye', 'Gundu Chilli', 'Long Chilli',
    'Brinjal', 'Long Brinjal', 'Drumstick',
    'Banana', 'Mango', 'Papaya', 'Lemon', 'Jasmine',
  ],
}
```

---

#### Navigation Changes

**`src/types/navigation.types.ts`** — extend `MoreStackParamList`:

```typescript
PestList: undefined;
PestDetail: {
  pestId: string;
}
DiseaseList: undefined;
DiseaseDetail: {
  diseaseId: string;
}
```

Add 6 convenience prop types: `PestListScreenNavigationProp`, `PestDetailScreenNavigationProp`, `PestDetailScreenRouteProp`, `DiseaseListScreenNavigationProp`, `DiseaseDetailScreenNavigationProp`, `DiseaseDetailScreenRouteProp`.

**`src/navigation/AppNavigator.tsx`** — add 4 `Stack.Screen` entries to `MoreStack`.

**`src/screens/MoreScreen.tsx`** — fix navigation type (`NavigationProp<ParamListBase>` → typed `NativeStackNavigationProp<MoreStackParamList, 'MoreHome'>`); add 2 menu items (`bug-outline` icon → PestList, `medkit-outline` icon → DiseaseList) before the Settings item.

---

#### Screen Architecture

**Shared style files** (avoids duplicate StyleSheet definitions for structurally identical screens):

- `src/styles/referenceListStyles.ts` — shared by `PestListScreen` and `DiseaseListScreen`
- `src/styles/referenceDetailStyles.ts` — shared by `PestDetailScreen` and `DiseaseDetailScreen`

**PestListScreen / DiseaseListScreen**:

- No async loading — static config, zero Firestore reads
- `searchInput: string` (controlled) + `searchQuery: string` (300ms debounce, `useRef<ReturnType<typeof setTimeout>>` — same pattern as `PlantsScreen.tsx`)
- `sections = useMemo(...)` — `getAllPests()` filtered by query, grouped into `SectionList` sections by `PestCategory`
- `SectionList` with `renderItem`, `renderSectionHeader`, `keyExtractor` all in `useCallback`; `removeClippedSubviews` + `windowSize={10}`
- Header: back button + screen title + `TextInput` search bar above the list
- Empty state: centred "No results" text when filter matches nothing

**PestDetailScreen / DiseaseDetailScreen**:

- `const pest = useMemo(() => getPestById(pestId), [pestId])` — synchronous
- Guard: if `!pest` render "Not found" fallback (no crash)
- `ScrollView` with `useSafeAreaInsets()` top/bottom + `TAB_BAR_HEIGHT` bottom padding
- Custom back-button header matching `PlantDetailScreen` pattern (`insets.top + 12`)
- **Hero**: `pest.emoji` (large) + `pest.name` (bold) + `pest.scientificName` (italic, if present) + `pest.tamilName` (if present)
- **5 content sections** (plain View cards, matching `plantDetailStyles.ts` card pattern):

| Section           | Field                | Visual                                                                            |
| ----------------- | -------------------- | --------------------------------------------------------------------------------- |
| Identification    | `identification[]`   | Bullet list prefixed with "•"                                                     |
| Damage Prevention | `damagePrevention[]` | Bullet list; `shield-checkmark-outline` icon                                      |
| Physical Control  | `physicalControl[]`  | Bullet list; `hand-left-outline` icon                                             |
| Organic Control   | `organicControl[]`   | Row: method emoji + name + `getTreatmentEffortDot(effort)` from `plantHelpers.ts` |
| Related Plants    | `relatedPlants[]`    | Wrapping chip row; tap → `ManagePlantCatalog`                                     |

**Reused from existing code**:

- `getTreatmentEffortDot(effort)` → 🟢/🟡/🔴 (`plantHelpers.ts`)
- `TREATMENT_METHOD_META` pattern → method emoji (spray=💨, trap=🪤, biocontrol=🐞, soil=🌱, manual=✋, cultural=🔄) (`plantHelpers.ts`)
- `TAB_BAR_HEIGHT` (`FloatingTabBar`)
- `useSafeAreaInsets`, `useTheme`, `useNavigation`, `useRoute` — standard screen setup
- Card/section visual patterns from `plantDetailStyles.ts` (copy rules, don't import)
- 300ms debounce pattern from `PlantsScreen.tsx`

---

#### New Files

| File                                  | Purpose                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/types/database.types.ts`         | `PestEntry`, `DiseaseEntry`, `OrganicControlItem`, `PestCategory`, `DiseaseCategory` added |
| `src/config/pests/types.ts`           | Re-exports from `database.types`                                                           |
| `src/config/pests/kanyakumari.ts`     | 36 `PestEntry` objects                                                                     |
| `src/config/pests/index.ts`           | Registry + 4 lookup functions                                                              |
| `src/config/diseases/types.ts`        | Re-exports from `database.types`                                                           |
| `src/config/diseases/kanyakumari.ts`  | 31 `DiseaseEntry` objects                                                                  |
| `src/config/diseases/index.ts`        | Registry + 4 lookup functions                                                              |
| `src/screens/PestListScreen.tsx`      | Searchable pest list                                                                       |
| `src/screens/PestDetailScreen.tsx`    | Pest detail page                                                                           |
| `src/screens/DiseaseListScreen.tsx`   | Searchable disease list                                                                    |
| `src/screens/DiseaseDetailScreen.tsx` | Disease detail page                                                                        |
| `src/styles/referenceListStyles.ts`   | Shared list screen styles                                                                  |
| `src/styles/referenceDetailStyles.ts` | Shared detail screen styles                                                                |

**Modified files**: `database.types.ts`, `navigation.types.ts`, `AppNavigator.tsx`, `MoreScreen.tsx`

---

#### Tests

- `src/__tests__/config/pests.test.ts` — `getAllPests()` = 36 items; every entry has `id`, `name`, `category`, `emoji`; `getPestById('aphids')` returns correct entry; `getPestById('nonexistent')` = `undefined`; `getPestsForPlant('Country Tomato')` includes Aphids; all `organicControl[].method` values are valid union members
- `src/__tests__/config/diseases.test.ts` — same structural tests for 31 diseases
- `src/__tests__/fixtures/pestEntry.fixtures.ts` — `makePestEntry(overrides?)` factory
- `src/__tests__/fixtures/diseaseEntry.fixtures.ts` — `makeDiseaseEntry(overrides?)` factory

---

#### Verification Criteria

1. `npx tsc --noEmit` exits zero
2. `npm run lint` exits zero
3. `getAllPests()` = 36, `getAllDiseases()` = 31 (data completeness check)
4. More tab shows "Pest Reference" and "Disease Reference" menu items
5. PestListScreen renders all 36 pests grouped under 5 category headings
6. Search "weevil" filters within 300ms to matching pests; clear restores full list
7. Tapping a pest row navigates to `PestDetailScreen` — all 5 sections populated
8. Organic Control items show effort dots (🟢/🟡/🔴) and method emoji
9. Tapping a Related Plants chip navigates to `ManagePlantCatalogScreen`
10. Back button from any screen returns correctly without stack issues
11. Light mode and dark mode render correctly (no hardcoded hex values)
12. `DiseaseListScreen` / `DiseaseDetailScreen` behave identically with disease data

---

## 7. Data & Migration Strategy

### Migration System Design

1. **Version tracking**: `user_settings/{uid}.schema_version` (integer, starts at 0)
2. **Migration files**: `src/migrations/NNN_descriptiveName.ts`, each exports `{ version, name, up(uid) }`
3. **Runner**: `src/migrations/index.ts` — `runPendingMigrations(uid)`:
   - Read current `schema_version`
   - Filter migrations where `version > current`
   - Run sequentially
   - Update `schema_version` after each success
   - Log failures to Sentry, don't crash app
4. **Idempotency**: Each migration checks if transformation already applied before modifying
5. **Batch limits**: Process max 500 docs per `writeBatch()` (Firestore limit)

### Migration Timeline (by Phase)

| Migration              | Phase      | Schema Change                                                               |
| ---------------------- | ---------- | --------------------------------------------------------------------------- |
| 001_backfill_district  | Phase 0 ✅ | District + zone backfill (Kanyakumari / high_rainfall)                      |
| 002_seedCatalog        | Phase A    | Enriches catalogs with Tamil names/varieties, botanical identity, nutrition |
| 003_harvestLogs        | Phase B    | Creates `harvest_logs` from journal harvest entries                         |
| 004_growthStageHistory | Phase B    | Initializes `growth_stage_history` from current stage                       |
| 005_plantingZones      | Phase B    | Adds `planting_zone` to plants                                              |

> **Removed from plan**: `003_plantingWindows` — planting windows are config data on care profiles, not user data requiring migration. `007_journalTags` — already shipped in Phase 0.

### Risky Data Changes

- **004_harvestLogs**: Creates new collection from existing journal data. Must NOT delete original journal entries (they remain as the source of truth). Harvest logs are a materialized view.
- **002_seedCatalog**: Must merge with user customizations, not overwrite. Use existing normalization pattern in `plantCatalog.ts`.

---

## 8. Final Recommendations

### DO NOW (Phase A–A2 — Config) ✅ SHIPPED

1. ~~**Build Pest & Disease reference screens (F11)**~~ — ✅ shipped Phase A
2. ~~**Enrich default catalog (F2)**~~ — ✅ shipped Phase A2
3. ~~**Build Beneficials + custom entry CRUD (F10)**~~ — ⏭ deferred to after Phase H (not blocking)

### DO NEXT (Phase B–B2–C — Plants, Beds & Home)

1. **Planter-style form depth (F9)** — 7 new sections, high perceived polish
2. **Harvest tracking (F5)** — concrete value farmers care about
3. **Growth stage auto-progression + annual cycling (F6)** — computed stages, fruit tree cycling, pin/unpin override
4. **Bed Management (F12, Phase B2)** — first-class bed entities, crop rotation engine, guild validation, cross-cuts 16 existing files. Subsumes F7 zone-based planting, G7, G12.
5. **Deep-links from forms to reference screens (2.15)** — connects form chips to detail pages
5. **"What to Plant Now" on TodayScreen (F3)** — farmers' #1 question, leverages enriched profiles
6. **Weather card (F4)** — simple API call, high daily-use value

### DO AFTER (Phase D–F)

1. **Calendar weather refinements (Phase D)** — watering suppression on rainy days
2. **Voice-to-text Tamil (F8, Phase E)** — removes literacy barrier
3. **Full data backup (G18, Phase F)** — data loss is a trust-breaker
4. **Onboarding flow (G17, Phase F)** — district selection + guided first-plant wizard

### DO LATER (Phase G–H)

1. **Tamil i18n** — only after all screens feature-complete (extracting strings from moving targets is waste)
2. **Farm mapping remainder, soil recs, lifecycle economics** — deeper domain intelligence (crop rotation moved to Phase B2)

### DO NOT BUILD (Current Stage)

| Feature                    | Reason                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| Multi-User / RBAC          | Rewrites entire data model. No demand from a personal-use app.                           |
| Financial Ledger           | Accounting is a different product. Start with `sale_price` on harvest_logs.              |
| Data Abstraction Layer     | 5 small service files don't justify the abstraction cost. Build when migrating backends. |
| Labour Tracking            | Niche enterprise need. Track worker costs as notes on task_logs for now.                 |
| Water Management Module    | Covered by weather integration + existing watering tasks.                                |
| State-Level Zone Expansion | Build Kanyakumari bulletproof first. Other zones = same template with different data.    |
| Government Scheme Tracker  | External data dependency with no reliable API. Link to websites instead.                 |
| Full Plot GPS Mapping      | String-based zones + bed names are sufficient for half an acre.                          |

### Architecture Principles for All Phases

1. **Schema changes go through migrations** — no more "hope old data works"
2. **New collections follow the existing service pattern** — cache → auth → Firestore → fallback
3. **Domain data is config, not code** — season boundaries, pest alerts, planting windows should be data objects, not inline logic
4. **Static reference data stays in-app** — organic recipes, farmer's almanac, pest reference images are app assets, not Firestore (keeps free-tier viable)
5. **Test new services** — every new service file (`harvests.ts`, `weather.ts`) gets unit tests from day one

---

## Design Decisions (Open for Discussion)

### Coconut Per-Tree Tracking Model

- **Option A**: `tree_number` field on `HarvestLog` linking to existing `Plant` entry — simpler, "harvested 45 nuts from tree #7"
- **Option B**: Separate `CoconutTree` child collection under a parent `Plant` — supports per-tree care schedules
- **Recommendation**: Option A first. Upgrade to B only if farmers need per-tree watering/fertilising differences.

### Farmer's Almanac Location

- **Option A**: Static content rotating monthly on `TodayScreen`
- **Option B**: Dedicated screen in More tab with full-year view
- **Recommendation**: Both — monthly highlight on TodayScreen with "View full almanac" link.

### Voice-to-Text Library

- `expo-speech` handles TTS only, not STT
- `@react-native-voice/voice` requires dev client (not Expo Go), supports Tamil well
- **Recommendation**: `@react-native-voice/voice` since `expo-dev-client` is already in use.

### Harvest Logs vs. Extended Task Logs

- **Option A**: New `harvest_logs` collection — clean separation, purpose-built fields (sale_price, buyer_market, destination)
- **Option B**: Extend existing `task_logs` with harvest fields — less migration, reuses existing service
- **Recommendation**: Option A. Harvests have fundamentally different data needs (quantity, market, income) that don't fit the task completion model.

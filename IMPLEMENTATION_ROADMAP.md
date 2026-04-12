# Organic Gardening Planner — Architecture & Implementation Roadmap

## 1) Current System Summary

### What is already implemented

- **Core app shell and navigation**: Auth gate + tab-based app flow with screens for Today, Plants, Calendar, Journal, More, plus management/settings screens.
- **Domain models already cover substantial farm data**:
  - `Plant` includes growth stage, coconut-specific fields, care schedule, pest/disease history, expected harvest date, soft-delete metadata.
  - `TaskTemplate` + `TaskLog` support recurring care workflows.
  - `JournalEntry` already supports richer harvest fields (`harvest_quantity`, `harvest_unit`, quality, notes).
  - `LocationConfig`, `PlantCatalog`, `PlantCareProfiles` exist in `user_settings` pattern.
- **Service-layer pattern is consistent and practical**:
  - Most services follow: auth check → optional token refresh → Firestore fetch/update → local cache fallback.
  - AsyncStorage-based local cache and in-memory cache exist.
- **Kanyakumari-aware domain logic already exists**:
  - Four-season helper (`summer`, `sw_monsoon`, `ne_monsoon`, `cool_dry`), seasonal watering multiplier, and seasonal pest alerts.
  - Companion/incompatible logic + expected harvest calculations in `plantHelpers.ts`.
- **Operational robustness features already present**:
  - Firestore timeout/retry wrapper, error logging, Sentry integration, app lifecycle hooks, image migration/storage strategy.

### What is partially implemented

- **Plant catalog**: There is a broad default catalog and variety list, but not a tightly curated “30–40 Kanyakumari practical crops with agronomy metadata.”
- **Harvest tracking**: Exists in journals and UI sections, but no dedicated first-class harvest log model for trend/income analytics.
- **Pest/disease workflow**: History and modal infrastructure exist, but advisory depth (organic recipe ratios, preventive calendar) is limited.
- **Season usage**: Season logic currently drives reminders/watering multiplier and alerts, not a “What to plant now?” planner.

### Architectural patterns (good)

- **Offline-first + graceful degradation**: local cache fallback in every key service.
- **Single source of type contracts** in `database.types.ts`.
- **Composable utility layer** (`seasonHelpers`, `plantHelpers`, `plantCareDefaults`).
- **Incremental feature development style** (pragmatic for solo dev).

### Architectural patterns (problematic / scaling risks)

- **No explicit schema migration framework** (compat handling currently ad-hoc in services).
- **Firestore coupling in service code** (query/build logic duplicated per service).
- **Single-tenant data scope (`user_id`)** blocks future farm/team roles.
- **Kanyakumari logic is hardcoded in utils, not config-driven** for zone expansion.

---

## 2) Key Problems / Risks

1. **Schema evolution risk (Critical)**

   - Legacy compatibility branches already visible (e.g., journal photo fields). As models evolve, this grows non-linearly and raises defect risk.

2. **Service-to-Firestore tight coupling (High)**

   - Makes provider swap/testing expensive (e.g., Supabase/API migration would touch many files).

3. **Domain model gap for intercropping and spatial planning (High farmer value)**

   - `location` is string-based; no zone/bed hierarchy; companion rules are not zone-validated.

4. **Harvest outcome not treated as first-class operational metric (High farmer value)**

   - No canonical harvest ledger powering yield and income trends.

5. **Hardcoded agro-climate model (Strategic risk for state-level expansion)**

   - Current season helper assumes one climatic model globally.

6. **No i18n foundation yet (Strategic product risk)**
   - Tamil-first UX is mandatory for broader TN usability.

---

## 3) Gap Analysis Table

| Area                   | Current State                                        | Gap                                                                                                | Category                                   | Why it matters now                                  |
| ---------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------- |
| Plant catalog          | Default catalog exists with many crops and varieties | Need curated Kanyakumari “starter catalog” with Tamil names, spacing, season, expected yield/plant | High-value                                 | Reduces onboarding friction for small farmers       |
| Intercropping          | Companion/incompatible helpers exist                 | No zone model (`under canopy/open sun/border`) + no rule engine tied to spatial context            | Critical (domain)                          | Half-acre productivity depends on layering          |
| Season planner         | Season helper used for watering/reminders            | No “What to plant now” by crop/season window                                                       | High-value                                 | Core farmer decision support                        |
| Pest & disease advisor | History + modal exists                               | Organic treatment protocols and preventive calendars are shallow                                   | High-value                                 | Organic farmers need actionable treatment guidance  |
| Harvest & income       | Task logs + journal harvest fields                   | No dedicated harvest ledger + sales/income linkage                                                 | High-value                                 | Farmers measure value by yield/income               |
| Weather integration    | None                                                 | Forecast + rain-aware watering suppression missing                                                 | High-value (low effort)                    | Immediate quality-of-life improvement               |
| Migration framework    | Implicit compatibility in app code                   | No versioned migration runner                                                                      | Critical                                   | Prevents long-term data corruption/tech debt        |
| Data abstraction       | Services call Firestore directly                     | No provider interface abstraction                                                                  | Critical (scaling)                         | Limits portability/testing speed                    |
| Multi-user/RBAC        | `user_id`-scoped                                     | No `farm_id`, roles, or member model                                                               | Nice-to-have now / Critical for enterprise | Needed only when moving beyond solo/single farm use |
| i18n                   | Hardcoded English strings                            | No translation extraction/runtime language layer                                                   | High-value (strategic)                     | Tamil usability + future growth                     |

---

## 4) Recommended Architecture Adjustments

Keep this lightweight and incremental.

1. **Add a minimal migration system (must-do now)**

   - `src/migrations/index.ts` + numbered migrations (`001_*`, `002_*`).
   - Store `schema_version` in `user_settings` and local cache meta.
   - Run on startup after auth and before first data-heavy screen render.

2. **Introduce thin data provider abstraction (must-do now, small scope)**

   - `src/lib/db/types.ts` → `DataProvider` interface.
   - `src/lib/db/firebaseProvider.ts` implementing current behavior.
   - Refactor only 2–3 services first (`plants`, `tasks`, `journal`) to prove pattern.

3. **Parameterize domain config (start now, expand later)**

   - Add `src/config/zones/highRainfall.ts` for current Kanyakumari logic.
   - Change season/care helper consumers to read from selected zone config.
   - Keep only one zone initially to avoid overreach.

4. **Add explicit farm spatial primitives (only what is needed first)**

   - Start with `planting_zone` enum on `Plant` (`canopy`, `open_sun`, `border`, `partial_shade`).
   - Defer full `farm_zones`/`beds` collections until rotation/intercrop UI is ready.

5. **Define canonical “outcome logs” early**
   - Create `harvest_logs` as first-class collection.
   - Optionally later unify with `financial_transactions` via foreign keys.

---

## 5) Phased Roadmap (Phase 0 → Phase 3)

## Phase 0: Stabilization (Fix Fundamentals)

### Features

- Migration framework (`schema_version`, migration runner, 2 initial migrations).
- Thin DB provider abstraction (pilot in core services).
- Introduce zone config interface with **one** implemented zone (`highRainfall/Kanyakumari`).
- Add developer guardrails: migration checklist in CONTRIBUTING, schema-change template.

### Why prioritized

- Prevents future breakage before adding more data models.

### Dependencies

- None.

### Effort

- **M**

### Risk

- **Medium** (touches foundational services; manageable if incremental).

---

## Phase 1: High-impact, Low-effort Farmer Features

### Features

1. **Curated Kanyakumari Plant Catalog seed**
   - Default seeded catalog (30–40 practical crops) on first login if catalog empty.
2. **Season-aware “What to Plant Now” panel**
   - Add `planting_windows` to care profiles/catalog entries and surface on Today screen.
3. **Weather integration (Open-Meteo)**
   - 7-day forecast + rain-aware watering reminder suppression.
4. **Journal tagging**
   - Add `tags: string[]` to journal entries for filterable history.

### Why prioritized

- Immediate farmer-facing value with minimal architectural strain.

### Dependencies

- Phase 0 migrations.

### Effort

- **S–M**

### Risk

- **Low**

---

## Phase 2: Core Domain Features (Kanyakumari depth)

### Features

1. **Intercropping planner data model v1**
   - `planting_zone` on plant + zone-aware companion/antagonist warnings.
2. **Organic pest & disease advisor enhancement**
   - Structured treatment recipes (ratios, cadence), preventive calendars.
3. **Harvest & income tracker v1**
   - New `harvest_logs`, harvest history charts, optional sale price + destination.
4. **Growth stage progression**
   - `growth_stage_history[]` + timeline + stage-change actions.
5. **Coconut individual tree identity improvements**
   - Tree numbering / aliasing and per-tree harvest quick log UX.

### Why prioritized

- These directly improve decision quality for half-acre mixed systems.

### Dependencies

- Phase 1 catalog + weather foundations.

### Effort

- **M–L**

### Risk

- **Medium** (new collections, new UX flows).

---

## Phase 3: Advanced / Enterprise Expansion

### Features

1. **Farm multi-user model (RBAC)**
   - Move from `user_id` to `farm_id` scoping + `farm_members` roles.
2. **Financial ledger + labor tracking**
   - `financial_transactions`, labor logs, seasonal P&L.
3. **Zone/bed hierarchy + crop rotation planner**
   - `farm_zones`, `farm_beds`, crop-history-driven rotation suggestions.
4. **Tamil i18n full rollout**
   - extract strings + bilingual domain content.
5. **State-wide agro-zone scaling**
   - add 6 additional zone configs and zone-specific catalogs.

### Why prioritized

- Necessary for scaling beyond personal/single-farm scenario.

### Dependencies

- Stable migration framework and data abstraction from Phase 0.

### Effort

- **L**

### Risk

- **High**

---

## 6) Feature-Level Breakdown

## A. Curated Kanyakumari Plant Catalog

- **Data model changes**
  - Extend catalog entry schema to include:
    - `name_ta`, `spacing`, `expected_yield_per_plant`, `recommended_seasons`, `viable_zones`.
- **API/service changes**
  - `plantCatalog.ts`: add `DEFAULT_KK_CURATED_CATALOG` + seed migration function.
- **Frontend changes**
  - Manage Catalog screen: show seed source and allow reset-to-default.
- **Migration impact**
  - Migration `00x_seed_catalog_if_empty`.
- **Reusability**
  - Reuses existing `user_settings.plantCatalog` pattern.

## B. Multi-layer / Intercropping Planner (v1)

- **Data model changes**
  - `Plant.planting_zone` enum.
  - Optional `Plant.support_host_plant_id` for pepper-on-coconut relationships.
- **API/service changes**
  - `plants` create/update validation for zone compatibility warnings.
  - New helper module for zone-aware compatibility.
- **Frontend changes**
  - Plant form: zone selector.
  - Plant detail/today warnings when incompatible combinations are detected.
- **Migration impact**
  - Backfill default zone (e.g., `open_sun`) for existing plants.
- **Reusability**
  - Builds directly on existing companion logic in `plantHelpers.ts`.

## C. Season-aware Planting Calendar

- **Data model changes**
  - Add `planting_windows` to care profile/catalog entries.
- **API/service changes**
  - Extend care profile normalization to include planting windows.
- **Frontend changes**
  - New “What to Plant Now” card on Today screen, filter by current season.
- **Migration impact**
  - Safe additive migration with defaults.
- **Reusability**
  - Reuses `getCurrentSeason()` and Today screen data loading pattern.

## D. Organic Pest & Disease Advisor

- **Data model changes**
  - `OrganicTreatment` static config structure + `risk_calendar` by month/season.
- **API/service changes**
  - No new backend mandatory initially; use static dataset versioned in app.
- **Frontend changes**
  - PestDisease modal: treatment recipe cards + “next application” reminders.
- **Migration impact**
  - None for static dataset; optional new fields in `pest_disease_history` later.
- **Reusability**
  - Reuses existing modal/history section.

## E. Harvest & Income Tracker

- **Data model changes**
  - New `HarvestLog` collection (`plant_id`, `harvested_at`, `quantity`, `unit`, `destination`, `sale_price`, etc.).
- **API/service changes**
  - New `src/services/harvests.ts` with same cache/auth/firestore pattern.
- **Frontend changes**
  - “Log harvest” action in Plant detail + seasonal trend block.
- **Migration impact**
  - None for existing data; optional import from journal harvest entries (scripted).
- **Reusability**
  - Reuses HarvestHistory UI component and existing chart dependency.

## F. Weather Integration (Open-Meteo)

- **Data model changes**
  - `user_settings.weather_location` (lat/lng or district).
- **API/service changes**
  - New `src/utils/weatherService.ts` with 3-hour cache.
- **Frontend changes**
  - Today screen forecast strip + “rain tomorrow, skip watering” badge.
- **Migration impact**
  - Default to Kanyakumari coordinate fallback.
- **Reusability**
  - Hooks into existing Today task reminder logic.

## G. Migration Framework

- **Data model changes**
  - `user_settings.schema_version`.
- **API/service changes**
  - `runMigrations(userId)` triggered post-auth.
- **Frontend changes**
  - Optional loading blocker while migration runs.
- **Migration impact**
  - Foundational.
- **Reusability**
  - Reduces compatibility branches across all services.

## H. DB Provider Abstraction

- **Data model changes**
  - None.
- **API/service changes**
  - Introduce provider interface and refactor services incrementally.
- **Frontend changes**
  - None.
- **Migration impact**
  - None.
- **Reusability**
  - Enables testing and backend portability.

---

## 7) Data & Migration Strategy

### Strategy

1. **Versioning**
   - Keep `schema_version` per user/farm in `user_settings`.
2. **Migration runner**
   - Ordered immutable migrations: each migration has `id`, `description`, `up()`.
3. **Execution timing**
   - Run once after auth and before screen data bootstrap.
4. **Idempotency**
   - Every migration must be safe to rerun.
5. **Observability**
   - Log migration execution success/failure to error tracker.

### Migration types

- **Additive safe**: new optional fields (`planting_zone`, `tags`).
- **Transformative**: move/normalize legacy fields (journal photo fields).
- **Backfill**: seed defaults when empty (catalog, settings).

### Risky changes to treat carefully

- Switching scope from `user_id` to `farm_id`.
- Converting location strings into normalized zone/bed references.
- Deduplicating harvest data if imported from journal and task logs.

### Backward compatibility policy

- Maintain read compatibility for one major app cycle.
- Write only new schema post-migration.
- Remove legacy read branches after migration adoption threshold.

---

## 8) Final Recommendations (Do / Avoid)

## DO (now)

- Build migration framework before adding new collections.
- Seed practical Kanyakumari catalog with Tamil + agronomy fields.
- Add “What to plant now” and weather-aware watering suppression.
- Add lightweight harvest log and zone-aware planting warnings.
- Start zone config abstraction with **one zone only** (Kanyakumari).

## DO (later)

- Add farm-level RBAC and financial ledger once solo flow is stable.
- Expand to Tamil Nadu multi-zone only after high-rainfall zone is validated.
- Roll out full i18n once strings are centralized and translation workflow is in place.

## AVOID NOW (overengineering / low immediate value)

- Full visual GIS plot mapping.
- Real-time pest API feed (no reliable district feed source).
- Full per-application input cost accounting.
- Complex optimization engines for intercropping.
- Multi-zone statewide rollout before validating one-zone data quality.

---

## Suggested 8-Week Execution Slice (solo-dev practical)

- **Week 1–2**: Phase 0 (migrations + provider abstraction pilot).
- **Week 3–4**: Curated catalog seed + What-to-plant-now.
- **Week 5**: Weather integration + rain-aware watering suppressor.
- **Week 6–7**: Harvest logs v1 + trend cards.
- **Week 8**: Planting zone field + companion conflict warnings.

This sequence delivers visible farmer value every 1–2 weeks while reducing foundational risk early.

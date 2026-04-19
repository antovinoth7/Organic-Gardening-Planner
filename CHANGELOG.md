# Changelog

All notable changes to the Organic Gardening Planner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Conventional Commits](https://www.conventionalcommits.org/).
Commit types map to sections: `feat` → **Added**, `fix` → **Fixed**,
`refactor`/`perf` → **Changed**.

**Maintenance**: every PR must add an entry under `[Unreleased]` in the
appropriate category. On release, rename `[Unreleased]` to the new
version heading with the release date.

## [Unreleased]

### Planned (Phase 1)

- Planting windows + "What to Plant Now" on Today screen
- Weather integration via Open-Meteo
- Organic treatment recipes with dilution ratios
- Preventive care calendar
- Companion planting warnings in plant form
- Farmer's Almanac screen
- Pest reference images

## [1.2.0] — 2026-04-16 — Phase 0: Foundations

Establishes the foundations needed for safe schema evolution and
future multi-zone expansion.

### Added

- **Schema migration runner** (`src/migrations/`) — numbered, idempotent
  migrations run from `App.tsx` after authentication. Version tracked
  via `schema_version` on `user_settings/{uid}`.
- **Migration 001_backfill_district** — sets `district: "Kanyakumari"`
  and `zone_id: "high_rainfall"` on existing users.
- **Agro-climatic zone system** (`src/config/zones/`) — `AgroClimaticZone`
  type with seasons, watering multipliers, and seasonal pest alerts.
  `HIGH_RAINFALL_ZONE` (Kanyakumari) is the default zone.
- **Zone registry** — `getZoneById`, `getZoneByDistrict`, `DEFAULT_ZONE`.
- **Journal tags** — `tags?: string[]` on `JournalEntry`, predefined
  chips (`pest`, `weather_damage`, `harvest`, `soil_prep`,
  `growth_update`, `experiment`) plus custom tags, with tag filter
  in the journal list view.
- **Tests** — `src/__tests__/utils/seasonHelpers.test.ts` covering
  season detection, watering multipliers, pest alerts, and custom
  zones with wrap-around months (23 tests).

### Changed

- `src/utils/seasonHelpers.ts` — all functions now accept an optional
  `zone?: AgroClimaticZone` parameter; default to `HIGH_RAINFALL_ZONE`
  for backward compatibility. All previously hardcoded Kanyakumari
  season data moved to `src/config/zones/highRainfall.ts`.
- `src/services/tasks.ts` — season-dependent call sites can now pass
  the user's zone.

### Fixed

- `jest.config.js` — removed broken `setupFilesAfterEnv` import of
  `@testing-library/jest-native/extend-expect` that prevented all
  tests from running in the node test environment.
- `jest.config.js` — added `moduleNameMapper` for the `@/` path alias
  so tests can use the same imports as app code.

### Documentation

- Added "Schema Migration Standards" and "Agro-Climatic Zone System"
  sections to `CLAUDE.md`.
- Added `migrations/` and `config/zones/` to `README.md` project
  structure; added Testing section.
- Updated `.github/copilot-instructions.md` with schema migration
  workflow and zone-aware domain logic guidance.
- Updated `docs/IMPLEMENTATION_ROADMAP.md` with Phase 0 completion
  status and delivery summary.

## [1.1.0] — earlier enterprise-standards sprint

### Added

- `SECURITY.md` — vulnerability disclosure policy and security practices
- `.env.example` — environment variable template for new developers
- `firestore.rules` — version-controlled Firestore security rules
- `CONTRIBUTING.md` — contributor setup, branch strategy, and code standards
- `LICENSE` — 0BSD license file
- `DATA_HANDLING.md` — privacy and data handling documentation
- `DEPLOYMENT.md` — production deployment guide
- Jest test infrastructure with sample utility test
- Client-side auth rate limiting (5 attempts per 15-minute window)
- ZIP import protections: decompression size/count limits, path traversal rejection, filename whitelist

### Changed

- Auth error messages now use a generic response to prevent email enumeration
- Password policy for new accounts: minimum 8 characters with uppercase letter and number
- Error logging now auto-redacts sensitive context keys (password, token, email, credential)
- PII (email) removed from console logs and Sentry user context
- Backup import/export errors now show generic user-facing messages
- Location list input capped at 100 items and 200 characters per name

### Fixed

- `updateJournalEntry()` now verifies document ownership before writing (matching `deleteJournalEntry()` pattern)

## [1.0.0] — 2024-01-01

### Initial Release

- Initial release
- Plant management with care scheduling
- Task templates and completion tracking
- Journal with multi-image support
- Calendar views (week and month)
- Images-only backup export/import
- Offline-first architecture with AsyncStorage caching
- Firebase Auth + Firestore integration
- Dark/light theme support
- Kanyakumari/South Tamil Nadu season-aware care defaults

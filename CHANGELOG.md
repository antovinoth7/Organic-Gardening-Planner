# Changelog

All notable changes to the Organic Gardening Planner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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

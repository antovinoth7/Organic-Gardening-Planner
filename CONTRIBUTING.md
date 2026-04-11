# Contributing to Organic Gardening Planner

## Getting Started

1. Fork the repository and clone your fork
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your Firebase + Sentry credentials
4. Apply Firestore security rules from `firestore.rules` to your Firebase project
5. Start the dev server: `npm start`

## Development Commands

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in browser
npm run lint       # Run ESLint
```

## Branch Strategy

- `main` — stable, production-ready code
- Feature branches — branch from `main`, name as `feature/<short-description>`
- Bug fixes — branch from `main`, name as `fix/<short-description>`

## Pull Request Process

1. Ensure `npm run lint` passes with zero errors
2. Update relevant documentation if your change affects architecture or conventions
3. Keep PRs focused — one concern per PR
4. Write a clear description of what changed and why

## Code Standards

Refer to these files for detailed conventions:

- **AI contributors**: `.github/copilot-instructions.md`
- **Code standards**: `CLAUDE.md`
- **Architecture**: `README.md`

### Key Rules

- TypeScript `strict: true` — no `any`, no `@ts-ignore` without explanation
- Functional components only (except `ErrorBoundary`)
- Styles in `src/styles/<name>Styles.ts` via `createStyles(theme)` — no inline styles
- Services follow: cache check → auth refresh → Firestore → AsyncStorage fallback
- Use `logError()` / `logAuthError()` — no raw `console.log`
- Keep functions ≤ 50 lines
- Use named constants for magic numbers

### Naming Conventions

| Artifact | Convention | Example |
| ---------- | ------------ | --------- |
| Components | PascalCase `.tsx` | `PlantCard.tsx` |
| Screens | PascalCase + `Screen` | `PlantDetailScreen.tsx` |
| Hooks | `use` prefix | `useCalendarData.ts` |
| Services | camelCase `.ts` | `plants.ts` |
| Styles | `*Styles.ts` | `plantCardStyles.ts` |

## Security

- Never commit `.env` or credentials
- See `SECURITY.md` for vulnerability reporting
- Review the security practices before modifying auth or data handling code

## Branch Protection

The `main` branch should be configured with the following protection rules in GitHub:

- **Require pull request reviews** — at least 1 approval before merging
- **Require status checks to pass** — `Lint, Typecheck & Test` CI job must succeed
- **Require branches to be up to date** — merge only when the branch is current with `main`
- **Do not allow force pushes** — history must be preserved
- **Do not allow deletions** — `main` cannot be deleted

To configure: Repository → Settings → Branches → Add branch protection rule for `main`.

# Testing Standards

## Structure

- Test files live in `src/__tests__/` with `*.test.ts` or `*.test.tsx` extensions.
- Every new service function must have a corresponding unit test.
- Every new utility function must have a unit test.
- Component tests use `@testing-library/react-native`.
- Do NOT mock Firestore — use the Firebase emulator for integration tests.
- Test fixtures live in `src/__tests__/fixtures/` as exported factory functions.
- Coverage targets: 30% on first merge, growing to 70% over sprints.
- Run `npm test` before pushing.

---

## Fixture Factory Pattern

```typescript
// src/__tests__/fixtures/plant.fixtures.ts
import { Plant } from '../../types/database.types';

export function makePlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: 'test-plant-id',
    name: 'Test Tomato',
    type: 'Vegetable',
    user_id: 'test-user-id',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
```

# Schema Migrations

The app uses a client-side migration runner (`src/migrations/`) to evolve Firestore data safely.

## How It Works

- **Version tracking**: `schema_version: number` in `user_settings/{uid}`. Default `0` for legacy users.
- **Runner**: `runPendingMigrations(userId)` is called from `App.tsx` after auth, before first screen render.
- **Migration files**: `src/migrations/NNN_descriptive_name.ts`, each exports `{ version, name, run(userId) }`.
- **Registry**: Add new migrations to the `migrations` array in `src/migrations/index.ts` and bump `LATEST_SCHEMA_VERSION`.
- **Idempotent**: Every migration must check before mutating — safe to re-run.
- **Error handling**: Failures are logged to Sentry (`logError("storage", ...)`). The runner stops at the first failure; already-completed migrations are not re-run.

---

## Schema Change Checklist

1. Update `src/types/database.types.ts` with new/changed fields.
2. If the field is **required** or reshapes existing data → write a migration in `src/migrations/`.
3. If the field is **optional** → no migration needed; handle `undefined` via `?? fallback`.
4. If adding a **new collection** → no migration; created on first write.
5. Bump `LATEST_SCHEMA_VERSION` in `src/migrations/index.ts`.
6. Add a test for the migration in `src/__tests__/migrations/`.

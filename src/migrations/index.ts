import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, refreshAuthToken } from "@/lib/firebase";
import {
  withTimeoutAndRetry,
  FIRESTORE_READ_TIMEOUT_MS,
} from "@/utils/firestoreTimeout";
import { logger } from "@/utils/logger";
import { logError } from "@/utils/errorLogging";
import { Migration } from "./types";
import { backfillDistrict } from "./001_backfill_district";
import { seedCatalogEnrichment } from "./002_seed_catalog_enrichment";

const SETTINGS_COLLECTION = "user_settings";

export const LATEST_SCHEMA_VERSION = 2;

const migrations: Migration[] = [
  { version: 1, name: "backfill_district", run: backfillDistrict },
  { version: 2, name: "seed_catalog_enrichment", run: seedCatalogEnrichment },
];

export async function getSchemaVersion(userId: string): Promise<number> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  if (!snapshot.exists()) return 0;

  const data = snapshot.data();
  return typeof data.schema_version === "number" ? data.schema_version : 0;
}

async function setSchemaVersion(
  userId: string,
  version: number,
): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  await withTimeoutAndRetry(
    () => setDoc(docRef, { schema_version: version }, { merge: true }),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS },
  );
}

export async function runPendingMigrations(userId: string): Promise<void> {
  await refreshAuthToken();

  let currentVersion: number;
  try {
    currentVersion = await getSchemaVersion(userId);
  } catch (error) {
    logger.warn(
      "Failed to read schema_version, skipping migrations",
      error as Error,
    );
    return;
  }

  if (currentVersion >= LATEST_SCHEMA_VERSION) return;

  const pending = migrations.filter((m) => m.version > currentVersion);
  if (pending.length === 0) return;

  logger.info(
    `Running ${pending.length} migration(s) from v${currentVersion} to v${LATEST_SCHEMA_VERSION}`,
  );

  for (const migration of pending) {
    try {
      logger.info(`Migration ${migration.version}: ${migration.name}`);
      await migration.run(userId);
      await setSchemaVersion(userId, migration.version);
      logger.info(`Migration ${migration.version} complete`);
    } catch (error) {
      logError(
        "storage",
        `Migration ${migration.version} (${migration.name}) failed`,
        error as Error,
        { userId, version: migration.version },
      );
      break;
    }
  }
}

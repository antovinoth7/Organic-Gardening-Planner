import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  withTimeoutAndRetry,
  FIRESTORE_READ_TIMEOUT_MS,
} from "@/utils/firestoreTimeout";
import { PlantCatalog } from "@/types/database.types";

const SETTINGS_COLLECTION = "user_settings";
const CATALOG_FIELD = "plantCatalog";

/**
 * Migration 002: Re-normalise every user's plant catalog so that the new
 * `tamilNames` and `descriptions` fields (added in Phase A2) are merged
 * from the enriched defaults.
 *
 * The heavy lifting is done lazily by `normalizeCatalog` at read time, so
 * this migration simply triggers a read-then-write cycle to persist the
 * merged result in Firestore.
 */
export async function seedCatalogEnrichment(userId: string): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  if (!snapshot.exists()) return;

  const data = snapshot.data();
  const existing = data[CATALOG_FIELD] as PlantCatalog | undefined;

  // If user has no catalog yet, nothing to migrate — defaults will be used
  if (!existing) return;

  // Import normalizeCatalog lazily to avoid circular dependency at module level
  const { normalizeCatalog } = await import("@/services/plantCatalog");
  const normalized = normalizeCatalog(existing);

  await withTimeoutAndRetry(
    () => setDoc(docRef, { [CATALOG_FIELD]: normalized }, { merge: true }),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS },
  );
}

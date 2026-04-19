import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  withTimeoutAndRetry,
  FIRESTORE_READ_TIMEOUT_MS,
} from "@/utils/firestoreTimeout";
import { DEFAULT_ZONE } from "@/config/zones";

const SETTINGS_COLLECTION = "user_settings";

export async function backfillDistrict(userId: string): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  const data = snapshot.exists() ? snapshot.data() : {};

  if (data.district && data.zone_id) return;

  await withTimeoutAndRetry(
    () =>
      setDoc(
        docRef,
        {
          district: data.district ?? "Kanyakumari",
          zone_id: data.zone_id ?? DEFAULT_ZONE.id,
        },
        { merge: true },
      ),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS },
  );
}

import { getRandomBytesAsync } from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { openDatabaseAsync } from "expo-sqlite";
import { openReportStore } from "./reportStore.ts";

const keyName = "life-tracker.report-database-key.v1";
const keyOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

async function openEncryptedReports(): Promise<Awaited<ReturnType<typeof openReportStore>>> {
  const database = await openDatabaseAsync("life-tracker-reports.db", { useNewConnection: true });
  try {
    const cipher = await database.getFirstAsync<{ cipher_version: string }>("PRAGMA cipher_version");
    if (!cipher?.cipher_version) {
      throw new Error("Encrypted storage requires a Life Tracker build with SQLCipher.");
    }

    let key = await SecureStore.getItemAsync(keyName, keyOptions);
    if (key === null) {
      // Re-keying a database after Keychain loss would make recovery harder.
      const empty = await database.getFirstAsync<{ tableCount: number }>(
        "SELECT count(*) AS tableCount FROM sqlite_schema",
      ).catch(() => null);
      if (empty?.tableCount !== 0) {
        throw new Error("The report database key is missing. Restore from an encrypted backup.");
      }
      await database.closeAsync();
      const bytes = await getRandomBytesAsync(32);
      key = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
      await SecureStore.setItemAsync(keyName, key, keyOptions);
      return openEncryptedReports();
    }

    if (!/^[a-f0-9]{64}$/.test(key)) {
      throw new Error("The report database key is invalid.");
    }
    try {
      await database.execAsync(`PRAGMA key = "x'${key}'"`);
      return await openReportStore(database);
    } catch {
      throw new Error("The encrypted report database could not be opened.");
    }
  } catch (error) {
    await database.closeAsync().catch(() => {});
    throw error;
  }
}

let opening: ReturnType<typeof openEncryptedReports> | undefined;

export function getEncryptedReportStore() {
  opening ??= openEncryptedReports().catch((error: unknown) => {
    opening = undefined;
    throw error;
  });
  return opening;
}

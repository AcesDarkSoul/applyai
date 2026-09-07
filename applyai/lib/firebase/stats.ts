import { doc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './config';
import { recordError } from './crashlytics';

/** Local calendar date as YYYY-MM-DD (stats/{date}). */
export function getStatsDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function bumpDailyStat(field: 'numberOfUsers' | 'userLogin'): Promise<void> {
  const dateKey = getStatsDateKey();
  try {
    await setDoc(
      doc(db, 'stats', dateKey),
      {
        [field]: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn(`Failed to increment stats/${dateKey}.${field}:`, e);
    recordError(e, `stats_increment_${field}`);
  }
}

/** Count a newly registered user for today's stats doc. */
export async function recordNewUser(): Promise<void> {
  await bumpDailyStat('numberOfUsers');
}

/** Count an explicit user login for today's stats doc. */
export async function recordUserLogin(): Promise<void> {
  await bumpDailyStat('userLogin');
}

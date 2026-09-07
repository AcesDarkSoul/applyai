/**
 * One-shot seed: appSettings/amount/plan/{starter|pro|elite}
 * Run from backend: npx tsx scripts/seedPlanAmounts.ts
 */
import '../src/config/env';
import { getFirestore, getFirebaseAdmin } from '../src/infrastructure/firebase/admin';

const AMOUNTS = {
  starter: 599,
  pro: 1499,
  elite: 2999,
} as const;

async function main() {
  if (!getFirebaseAdmin()) {
    console.error('Firebase Admin not initialized — check FIREBASE_* env vars');
    process.exit(1);
  }
  const db = getFirestore();
  if (!db) {
    console.error('Firestore unavailable');
    process.exit(1);
  }

  for (const [planId, amount] of Object.entries(AMOUNTS)) {
    const ref = db.collection('appSettings').doc('amount').collection('plan').doc(planId);
    await ref.set(
      {
        amount,
        currency: 'INR',
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    console.log(`Seeded appSettings/amount/plan/${planId} = ${amount}`);
  }

  console.log('Done');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

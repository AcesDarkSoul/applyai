import { PLANS, type PlanId } from '../domain/plans';
import { getFirestore } from '../infrastructure/firebase/admin';
import { logger } from '../config/logger';

const DEFAULT_AMOUNTS: Record<PlanId, number> = {
  starter: PLANS.starter.priceInr,
  pro: PLANS.pro.priceInr,
  elite: PLANS.elite.priceInr,
};

/** Firestore: appSettings/amount/plan/{starter|pro|elite} → { amount: number } */
function planAmountRef(db: NonNullable<ReturnType<typeof getFirestore>>, planId: PlanId) {
  return db.collection('appSettings').doc('amount').collection('plan').doc(planId);
}

/** Ensure default plan prices exist so Console edits are easy. */
export async function ensureDefaultPlanAmounts(): Promise<void> {
  const db = getFirestore();
  if (!db) return;

  await Promise.all(
    (Object.keys(DEFAULT_AMOUNTS) as PlanId[]).map(async (planId) => {
      const ref = planAmountRef(db, planId);
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set({
          amount: DEFAULT_AMOUNTS[planId],
          currency: 'INR',
          updatedAt: new Date().toISOString(),
        });
        logger.info('Seeded appSettings plan amount', { planId, amount: DEFAULT_AMOUNTS[planId] });
      }
    }),
  );
}

export async function getPlanAmountInr(planId: PlanId): Promise<number> {
  const db = getFirestore();
  if (db) {
    try {
      const snap = await planAmountRef(db, planId).get();
      const amount = snap.data()?.amount;
      if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
        return Math.round(amount);
      }
    } catch (err) {
      logger.warn('Failed to read plan amount from appSettings', {
        planId,
        err: err instanceof Error ? err.message : err,
      });
    }
  }
  return DEFAULT_AMOUNTS[planId];
}

export async function getAllPlanAmountsInr(): Promise<Record<PlanId, number>> {
  await ensureDefaultPlanAmounts();
  const [starter, pro, elite] = await Promise.all([
    getPlanAmountInr('starter'),
    getPlanAmountInr('pro'),
    getPlanAmountInr('elite'),
  ]);
  return { starter, pro, elite };
}

export async function planAmountPaiseFromSettings(planId: PlanId): Promise<number> {
  return (await getPlanAmountInr(planId)) * 100;
}

import { collection, doc, getDocs } from 'firebase/firestore';
import { db } from './config';
import { PLANS, type PlanId } from '@/constants/plans';

export type PlanAmounts = Record<PlanId, number>;

const FALLBACK: PlanAmounts = {
  starter: PLANS.starter.priceInr,
  pro: PLANS.pro.priceInr,
  elite: PLANS.elite.priceInr,
};

/**
 * Read live prices from:
 * appSettings/amount/plan/{starter|pro|elite} → { amount: number }
 */
export async function fetchPlanAmounts(): Promise<PlanAmounts> {
  try {
    const snap = await getDocs(collection(doc(db, 'appSettings', 'amount'), 'plan'));
    const amounts: PlanAmounts = { ...FALLBACK };
    snap.forEach((d) => {
      if (d.id === 'starter' || d.id === 'pro' || d.id === 'elite') {
        const amount = d.data()?.amount;
        if (typeof amount === 'number' && amount > 0) {
          amounts[d.id] = Math.round(amount);
        }
      }
    });
    return amounts;
  } catch (e) {
    console.warn('fetchPlanAmounts failed, using defaults:', e);
    return FALLBACK;
  }
}

export function planIdFromFlags(plans?: {
  starter?: boolean;
  pro?: boolean;
  elite?: boolean;
} | null): PlanId | null {
  if (!plans) return null;
  if (plans.elite) return 'elite';
  if (plans.pro) return 'pro';
  if (plans.starter) return 'starter';
  return null;
}

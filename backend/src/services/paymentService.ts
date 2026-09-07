import type { PlanId } from '../domain/plans';
import { getFirestore } from '../infrastructure/firebase/admin';
import { logger } from '../config/logger';

function paymentDateKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type PaymentTransactionInput = {
  uid: string;
  email?: string;
  planId: PlanId;
  amountInr: number;
  currency?: string;
  provider: 'razorpay' | 'demo' | 'manual';
  status?: 'success';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
};

/**
 * Store a successful payment at:
 * payment/{YYYY-MM-DD}/transactions/{transactionId}
 */
export async function recordSuccessfulPayment(input: PaymentTransactionInput): Promise<string | null> {
  const db = getFirestore();
  if (!db) {
    logger.warn('Skipping payment record — Firestore unavailable');
    return null;
  }

  const dateKey = paymentDateKey();
  const txnId =
    input.razorpayPaymentId ||
    `${input.provider}_${input.uid.slice(0, 8)}_${Date.now().toString(36)}`;

  const dayRef = db.collection('payment').doc(dateKey);
  const txnRef = dayRef.collection('transactions').doc(txnId);

  await dayRef.set(
    {
      date: dateKey,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  await txnRef.set({
    uid: input.uid,
    email: input.email || '',
    planId: input.planId,
    amount: input.amountInr,
    currency: input.currency || 'INR',
    provider: input.provider,
    status: input.status || 'success',
    razorpayOrderId: input.razorpayOrderId || null,
    razorpayPaymentId: input.razorpayPaymentId || null,
    razorpaySignature: input.razorpaySignature || null,
    createdAt: new Date().toISOString(),
  });

  logger.info('Payment transaction stored', { dateKey, txnId, uid: input.uid, planId: input.planId });
  return txnId;
}

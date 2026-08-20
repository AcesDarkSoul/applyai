import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { PlanId } from '@/constants/plans';

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

async function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Razorpay checkout is available on web. Use the hosted pay flow on device.');
  }
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-applyai-razorpay]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Could not load Razorpay')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.applyaiRazorpay = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(input: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  planId: PlanId;
  name?: string;
  email?: string;
  description: string;
  paymentLinkUrl?: string | null;
}): Promise<RazorpaySuccess | { viaLink: true }> {
  if (Platform.OS === 'web') {
    await loadRazorpayScript();
    const Checkout = window.Razorpay;
    if (!Checkout) {
      throw new Error('Razorpay checkout failed to load');
    }
    return new Promise((resolve, reject) => {
      const rzp = new Checkout({
        key: input.keyId,
        amount: input.amount,
        currency: input.currency,
        order_id: input.orderId,
        name: 'ApplyAI',
        description: input.description,
        prefill: {
          name: input.name || '',
          email: input.email || '',
        },
        theme: { color: '#5b5ce2' },
        handler: (response: RazorpaySuccess) => resolve(response),
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
        },
      });
      rzp.open();
    });
  }

  const url = input.paymentLinkUrl;
  if (!url) {
    throw new Error('Razorpay payment link was not created. Try paying on web, or check API keys.');
  }
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
  });
  return { viaLink: true };
}

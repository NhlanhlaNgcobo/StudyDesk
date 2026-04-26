import crypto from 'crypto';

// ============================================================
// PAYFAST
// ============================================================
interface PayFastBaseParams {
  merchant_id: string;
  merchant_key: string;
  return_url?: string;
  cancel_url?: string;
  notify_url?: string;
  name_first?: string;
  name_last?: string;
  email_address?: string;
  m_payment_id?: string;
  amount: string;
  item_name: string;
  item_description?: string;
  custom_int1?: string;
  custom_str1?: string;
}

export interface PayFastParams extends PayFastBaseParams {
  signature?: string;
}

/** Encodes to RFC 1738 as required by PayFast */
function pfUrlEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase())
    .replace(/%20/g, '+')
    .replace(/\(/g, '%28').replace(/\)/g, '%29')
    .replace(/!/g, '%21').replace(/'/g, '%27')
    .replace(/\*/g, '%2A').replace(/~/g, '%7E');
}

export function generatePayFastSignature(params: Record<string, string>, passphrase?: string): string {
  const order = [
    'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
    'name_first', 'name_last', 'email_address', 'cell_number',
    'm_payment_id', 'amount', 'item_name', 'item_description',
    'custom_int1', 'custom_int2', 'custom_int3', 'custom_int4', 'custom_int5',
    'custom_str1', 'custom_str2', 'custom_str3', 'custom_str4', 'custom_str5',
    'email_confirmation', 'confirmation_address', 'payment_method',
    'subscription_type', 'billing_date', 'recurring_amount', 'frequency', 'cycles',
  ];

  const pfOutput = order
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map((k) => `${k}=${pfUrlEncode(params[k].toString().trim())}`)
    .join('&');

  const getString = passphrase ? `${pfOutput}&passphrase=${pfUrlEncode(passphrase.trim())}` : pfOutput;
  return crypto.createHash('md5').update(getString).digest('hex');
}

export function buildPayFastUrl(params: PayFastParams, passphrase?: string): string {
  const isSandbox = process.env.PAYFAST_ENV === 'sandbox';
  const baseUrl = isSandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  const order = [
    'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
    'name_first', 'name_last', 'email_address', 'cell_number',
    'm_payment_id', 'amount', 'item_name', 'item_description', 'custom_str1',
  ];
  const data: Record<string, string> = {};
  order.forEach((k) => {
    const v = (params as any)[k];
    if (v !== undefined && v !== null && v !== '') data[k] = v.toString();
  });

  const signature = generatePayFastSignature(data, passphrase);
  const qs = Object.entries({ ...data, signature })
    .map(([k, v]) => `${k}=${pfUrlEncode(v)}`)
    .join('&');
  return `${baseUrl}?${qs}`;
}


// ============================================================
// PAYSTACK
// ============================================================
export interface PaystackInitializeParams {
  email: string;
  amount: number; // in CENTS (ZAR x 100)
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}

export interface PaystackResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

/**
 * Initialize a Paystack payment and return the authorization URL.
 * Calls Paystack's REST API directly from the server.
 */
export async function initializePaystackPayment(
  params: PaystackInitializeParams,
  secretKey: string
): Promise<PaystackResponse> {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  return response.json();
}


// ============================================================
// YOCO
// ============================================================
export interface YocoCheckoutPayload {
  amount: number;       // in CENTS
  currency: string;     // 'ZAR'
  cancelUrl: string;
  successUrl: string;
  failureUrl: string;
  metadata?: Record<string, string>;
}

export interface YocoCheckoutResponse {
  id: string;
  redirectUrl: string;
  status: string;
}

/**
 * Create a Yoco online payment checkout session.
 */
export async function createYocoCheckout(
  payload: YocoCheckoutPayload,
  secretKey: string
): Promise<YocoCheckoutResponse> {
  const response = await fetch('https://payments.yoco.com/api/checkouts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Yoco API error: ${err}`);
  }
  return response.json();
}


// ============================================================
// PAYSHAP (SARB Instant Payment)
// ============================================================
/**
 * PayShap is an inter-bank instant payment rail in South Africa (SARB backed).
 * Most consumer-facing PayShap flows are initiated via participating bank apps.
 * Here we build a PayShap deep-link (proxy URL) that directs users to their
 * banking app, or use a Payment Service Provider's (PSP) PayShap endpoint.
 * Implementation below uses a PSP-relay approach (e.g. Peach Payments).
 */
export interface PayShapPayload {
  amount: number;           // in cents ZAR
  reference: string;        // merchant reference
  recipientProxy: string;   // e.g. cellphone, email or SA ID registered with bank
  recipientProxyType: 'MSISDN' | 'EMAIL' | 'SA_ID'; // proxy types per SARB spec
  recipientName: string;
  callbackUrl?: string;
}

export interface PayShapLinkResult {
  paymentUrl: string;        // Deep-link or PSP hosted URL
  reference: string;
  expires: string;
}

/**
 * Generate a PayShap QR / proxy-based payment URL.
 * Note: Direct API support differs per PSP. This function builds the
 * Peach Payments OAuth2 REST flow for PayShap. Replace with your PSP's endpoint.
 */
export async function createPayShapPayment(
  payload: PayShapPayload,
  pspKey: string
): Promise<PayShapLinkResult> {
  // Peach Payments PayShap endpoint (adjust to your licensed PSP)
  const endpoint = 'https://testsecure.peachpayments.com/api/v1/payshap/outward';
  const body = {
    amount: (payload.amount / 100).toFixed(2),
    currency: 'ZAR',
    merchantTransactionId: payload.reference,
    recipientProxy: payload.recipientProxy,
    recipientProxyType: payload.recipientProxyType,
    recipientName: payload.recipientName,
    notificationUrl: payload.callbackUrl,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pspKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PayShap API error: ${err}`);
  }

  const data = await response.json();
  return {
    paymentUrl: data.redirectUrl || data.paymentUrl,
    reference: payload.reference,
    expires: data.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}


// ============================================================
// SHARED HELPERS
// ============================================================
export type PaymentProvider = 'payfast' | 'paystack' | 'yoco' | 'payshap';

export const PRICING_PLANS = {
  free: { name: 'Free', priceZAR: 0 },
  student_monthly: { name: 'Student (Monthly)', priceZAR: 69 },
  student_annually: { name: 'Student (Annually)', priceZAR: 690 },
  student_pro_monthly: { name: 'Student Pro (Monthly)', priceZAR: 129 },
  student_pro_annually: { name: 'Student Pro (Annually)', priceZAR: 1290 },
  tutor_monthly: { name: 'Tutor (Monthly)', priceZAR: 199 },
  tutor_annually: { name: 'Tutor (Annually)', priceZAR: 1990 },
} as const;

export type PlanKey = keyof typeof PRICING_PLANS;

/** Resolve a planId + billingCycle to a PRICING_PLANS key */
export function resolvePlanKey(planId: string, billingCycle: string): PlanKey | null {
  if (planId === 'free') return 'free';
  const key = `${planId}_${billingCycle}` as PlanKey;
  return PRICING_PLANS[key] ? key : null;
}

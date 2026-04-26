import crypto from 'crypto';

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

/**
 * Encodes a string to match PHP's urlencode (RFC 1738)
 * PayFast expects this specific encoding for signature generation.
 */
function pfUrlEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%[0-9a-f]{2}/g, (match) => match.toUpperCase())
    .replace(/%20/g, "+")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E");
}

export function generatePayFastSignature(params: Record<string, string>, passphrase?: string): string {
  // 1. Hardcoded Order (PayFast is extremely strict about this)
  const order = [
    "merchant_id", "merchant_key", "return_url", "cancel_url", "notify_url",
    "name_first", "name_last", "email_address", "cell_number",
    "m_payment_id", "amount", "item_name", "item_description",
    "custom_int1", "custom_int2", "custom_int3", "custom_int4", "custom_int5",
    "custom_str1", "custom_str2", "custom_str3", "custom_str4", "custom_str5",
    "email_confirmation", "confirmation_address", "payment_method",
    "subscription_type", "billing_date", "recurring_amount", "frequency", "cycles"
  ];

  const pfOutput = order
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map(key => `${key}=${pfUrlEncode(params[key].toString().trim())}`)
    .join("&");

  let getString = pfOutput;
  if (passphrase) {
    getString += `&passphrase=${pfUrlEncode(passphrase.trim())}`;
  }

  return crypto.createHash('md5').update(getString).digest('hex');
}

/**
 * Builds the full PayFast Pay URL
 */
export function buildPayFastUrl(params: PayFastParams, passphrase?: string): string {
  const isSandbox = process.env.PAYFAST_ENV === 'sandbox';
  const baseUrl = isSandbox 
    ? 'https://sandbox.payfast.co.za/eng/process' 
    : 'https://www.payfast.co.za/eng/process';

  // Prep data and ensure it's in the correct order for the final URL too
  const data: Record<string, string> = {};
  const order = [
    "merchant_id", "merchant_key", "return_url", "cancel_url", "notify_url",
    "name_first", "name_last", "email_address", "cell_number",
    "m_payment_id", "amount", "item_name", "item_description",
    "custom_str1"
  ];

  order.forEach(key => {
    const val = (params as any)[key];
    if (val !== undefined && val !== null && val !== "") {
      data[key] = val.toString();
    }
  });

  const signature = generatePayFastSignature(data, passphrase);
  
  // Build query string
  const queryString = Object.entries({ ...data, signature })
    .map(([key, val]) => `${key}=${pfUrlEncode(val)}`)
    .join('&');

  return `${baseUrl}?${queryString}`;
}

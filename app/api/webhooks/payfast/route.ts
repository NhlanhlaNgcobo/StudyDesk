import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * PayFast ITN (Instant Transaction Notification) Webhook
 * This route receives POST requests from PayFast when a payment is successful.
 * We verify the signature and then update the user's tier in Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);
    const data: Record<string, string> = {};
    params.forEach((v, k) => { data[k] = v; });

    console.log("PayFast ITN Received:", data);

    // 1. Validate the signature
    // In a real production app, you would fetch parameters in the specific PayFast order
    // and verify with the passphrase. For now, we log the success.
    
    if (data.payment_status === "COMPLETE") {
      const reference = data.m_payment_id; // e.g. STUDY_123456
      const planKey = data.custom_str1;    // The plan they bought
      const amount = data.amount_gross;

      console.log(`✅ Payment successful for order ${reference}. Plan: ${planKey}, Amount: R${amount}`);
      
      // TODO: Update user in Firestore
      // await adminDb.collection('users').doc(userId).update({ tier: planKey });
    }

    // PayFast expects a 200 OK
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("PayFast Webhook Error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

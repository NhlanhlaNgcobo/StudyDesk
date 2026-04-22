import { NextRequest, NextResponse } from "next/server";
import {
  buildPayFastUrl,
  initializePaystackPayment,
  createYocoCheckout,
  createPayShapPayment,
  PRICING_PLANS,
  resolvePlanKey,
  type PaymentProvider,
} from "@/lib/payments";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { planId, billingCycle, provider = "payfast", userEmail, userName } = await req.json();

    // 1. Resolve plan
    const planKey = resolvePlanKey(planId, billingCycle);
    if (!planKey) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }
    const plan = PRICING_PLANS[planKey];

    // 2. Free plan shortcut
    if (plan.priceZAR === 0) {
      return NextResponse.json({ url: `${APP_URL}/student/dashboard?checkout=success` });
    }

    const reference = `STUDY_${Date.now()}`;
    const returnUrl = `${APP_URL}/payment/success?ref=${reference}`;
    const cancelUrl = `${APP_URL}/payment/cancel`;
    const notifyUrl = `${APP_URL}/api/webhooks/payfast`;

    // ─────────────────────────── PAYFAST ───────────────────────────
    if (provider === "payfast") {
      const merchantId = process.env.PAYFAST_MERCHANT_ID;
      const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
      const passphrase = process.env.PAYFAST_PASSPHRASE;
      if (!merchantId || !merchantKey) {
        return NextResponse.json({ error: "PayFast is not configured." }, { status: 500 });
      }
      const url = buildPayFastUrl(
        {
          merchant_id: merchantId,
          merchant_key: merchantKey,
          return_url: returnUrl,
          cancel_url: cancelUrl,
          notify_url: notifyUrl,
          name_first: userName?.split(" ")[0] || "Student",
          name_last: userName?.split(" ").slice(1).join(" ") || "",
          email_address: userEmail || "",
          m_payment_id: reference,
          amount: plan.priceZAR.toFixed(2),
          item_name: `StudyDesk ${plan.name} Subscription`,
          custom_str1: planKey,
        },
        passphrase && passphrase !== "your_payfast_passphrase_here" ? passphrase : ""
      );
      return NextResponse.json({ url });
    }

    // ─────────────────────────── PAYSTACK ───────────────────────────
    if (provider === "paystack") {
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      if (!secretKey) {
        return NextResponse.json({ error: "Paystack is not configured." }, { status: 500 });
      }
      const result = await initializePaystackPayment(
        {
          email: userEmail || "student@studydesk.co.za",
          amount: plan.priceZAR * 100, // Paystack uses kobo/cents
          reference,
          callback_url: returnUrl,
          metadata: { planKey, planName: plan.name },
          channels: ["card", "bank", "ussd", "mobile_money", "eft"],
        },
        secretKey
      );
      if (!result.status || !result.data?.authorization_url) {
        return NextResponse.json({ error: result.message || "Paystack error" }, { status: 500 });
      }
      return NextResponse.json({ url: result.data.authorization_url });
    }

    // ─────────────────────────── YOCO ───────────────────────────
    if (provider === "yoco") {
      const secretKey = process.env.YOCO_SECRET_KEY;
      if (!secretKey) {
        return NextResponse.json({ error: "Yoco is not configured." }, { status: 500 });
      }
      const result = await createYocoCheckout(
        {
          amount: plan.priceZAR * 100,
          currency: "ZAR",
          successUrl: returnUrl,
          cancelUrl,
          failureUrl: `${APP_URL}/payment/cancel?reason=failed`,
          metadata: { planKey, reference },
        },
        secretKey
      );
      return NextResponse.json({ url: result.redirectUrl });
    }

    // ─────────────────────────── PAYSHAP ───────────────────────────
    if (provider === "payshap") {
      const pspKey = process.env.PAYSHAP_PSP_KEY;
      const recipientProxy = process.env.PAYSHAP_PROXY || "";
      const recipientName = process.env.PAYSHAP_PROXY_NAME || "StudyDesk";
      if (!pspKey || !recipientProxy) {
        return NextResponse.json({ error: "PayShap is not configured." }, { status: 500 });
      }
      const result = await createPayShapPayment(
        {
          amount: plan.priceZAR * 100,
          reference,
          recipientProxy,
          recipientProxyType: "MSISDN",
          recipientName,
          callbackUrl: notifyUrl,
        },
        pspKey
      );
      return NextResponse.json({ url: result.paymentUrl });
    }

    return NextResponse.json({ error: "Unknown payment provider" }, { status: 400 });

  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: "Failed to initiate checkout" }, { status: 500 });
  }
}

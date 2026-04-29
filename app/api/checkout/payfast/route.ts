import { NextRequest, NextResponse } from "next/server";
import {
  buildPayFastUrl,
  initializePaystackPayment,
  createYocoCheckout,
  createPayShapPayment,
  PRICING_PLANS,
  resolvePlanKey,
} from "@/lib/payments";
import { appConfig } from "@/lib/app-config";

const APP_URL = appConfig.appUrl;

function sandboxSuccessUrl(reference: string, provider: string, planName: string) {
  const params = new URLSearchParams({
    ref: reference,
    sandbox: "1",
    provider,
    plan: planName,
  });

  return `${APP_URL}/payment/success?${params.toString()}`;
}

export async function POST(req: NextRequest) {
  try {
    const { planId, billingCycle, provider = "payfast", userEmail, userName } = await req.json();

    const planKey = resolvePlanKey(planId, billingCycle);
    if (!planKey) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const plan = PRICING_PLANS[planKey];

    if (plan.priceZAR === 0) {
      return NextResponse.json({ url: `${APP_URL}/student/dashboard?checkout=success&plan=free` });
    }

    const reference = `STUDY_${Date.now()}`;
    const returnUrl = `${APP_URL}/payment/success?ref=${reference}`;
    const cancelUrl = `${APP_URL}/payment/cancel`;
    const notifyUrl = `${APP_URL}/api/webhooks/payfast`;

    if (provider === "payfast") {
      const merchantId = process.env.PAYFAST_MERCHANT_ID;
      const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
      const passphrase = process.env.PAYFAST_PASSPHRASE;

      if (!merchantId || !merchantKey) {
        return NextResponse.json({
          url: sandboxSuccessUrl(reference, provider, plan.name),
          sandbox: true,
          message: "PayFast credentials are not configured. Using a local billing demo flow.",
        });
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

    if (provider === "paystack") {
      const secretKey = process.env.PAYSTACK_SECRET_KEY;

      if (!secretKey) {
        return NextResponse.json({
          url: sandboxSuccessUrl(reference, provider, plan.name),
          sandbox: true,
          message: "Paystack credentials are not configured. Using a local billing demo flow.",
        });
      }

      const result = await initializePaystackPayment(
        {
          email: userEmail || "student@studydesk.co.za",
          amount: plan.priceZAR * 100,
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

    if (provider === "yoco") {
      const secretKey = process.env.YOCO_SECRET_KEY;

      if (!secretKey) {
        return NextResponse.json({
          url: sandboxSuccessUrl(reference, provider, plan.name),
          sandbox: true,
          message: "Yoco credentials are not configured. Using a local billing demo flow.",
        });
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

    if (provider === "payshap") {
      const pspKey = process.env.PAYSHAP_PSP_KEY;
      const recipientProxy = process.env.PAYSHAP_PROXY || "";
      const recipientName = process.env.PAYSHAP_PROXY_NAME || "StudyDesk";

      if (!pspKey || !recipientProxy) {
        return NextResponse.json({
          url: sandboxSuccessUrl(reference, provider, plan.name),
          sandbox: true,
          message: "PayShap credentials are not configured. Using a local billing demo flow.",
        });
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
  } catch (error) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: "Failed to initiate checkout" }, { status: 500 });
  }
}

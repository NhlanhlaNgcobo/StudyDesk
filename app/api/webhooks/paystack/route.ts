import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const secret = process.env.PAYSTACK_SECRET_KEY || "";
        const signature = req.headers.get("x-paystack-signature");

        // Verify Paystack Signature
        const hash = crypto
            .createHmac("sha512", secret)
            .update(body)
            .digest("hex");

        if (hash !== signature) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const event = JSON.parse(body);

        // Handle the event
        if (event.event === "charge.success") {
            const data = event.data;
            const userEmail = data.customer.email;
            const metadata = data.metadata;
            const planId = metadata?.planId;
            const billingCycle = metadata?.billingCycle;
            const userId = metadata?.userId;

            console.log(`Paystack Payment Success for ${userEmail}:`, {
                planId,
                billingCycle,
                userId,
                reference: data.reference,
            });

            if (userId && planId) {
                const userRef = doc(db, "users", userId);
                await updateDoc(userRef, { 
                    tier: planId, 
                    billing: billingCycle || 'monthly', 
                    paymentProvider: 'paystack',
                    updatedAt: serverTimestamp() 
                });
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Paystack Webhook Error:", error);
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
}


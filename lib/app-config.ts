export const appConfig = {
  appName: "StudyDesk",
  supportEmail: "support@studydesk.co.za",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  hasAnthropic: Boolean(process.env.ANTHROPIC_API_KEY),
  hasFirebase:
    Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) &&
    Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
    Boolean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  hasPayments:
    Boolean(process.env.PAYFAST_MERCHANT_ID) ||
    Boolean(process.env.PAYSTACK_SECRET_KEY) ||
    Boolean(process.env.YOCO_SECRET_KEY) ||
    Boolean(process.env.PAYSHAP_PSP_KEY),
} as const;

export type AppRole = "student" | "tutor";

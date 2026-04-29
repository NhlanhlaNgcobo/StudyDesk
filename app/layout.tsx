import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { PricingProvider } from "@/contexts/pricing-context";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "StudyDesk | Your Ultimate Study Companion",
  description: "Next-gen study platform with groups, modules, notes, and analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased text-slate-900 dark:text-slate-100">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <PricingProvider>{children}</PricingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

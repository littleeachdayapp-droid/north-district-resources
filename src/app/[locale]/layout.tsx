import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";
import "@/app/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return {
    title: {
      default: "MinistryShare Austin",
      template: "%s | MinistryShare Austin",
    },
    description:
      locale === "es"
        ? "Plataforma para compartir recursos entre iglesias del área de Austin"
        : "Church resource sharing platform for the Austin area",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen flex flex-col">
        <NuqsAdapter>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </AuthProvider>
          </NextIntlClientProvider>
        </NuqsAdapter>
        <Toaster richColors position="bottom-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

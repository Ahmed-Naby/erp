import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/i18n/provider";
import { getTranslations } from "@/lib/i18n/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERP",
  description: "Inventory, Sales, Purchasing & Accounting",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, dir, messages } = await getTranslations();

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale} messages={messages}>
          <SessionProvider>{children}</SessionProvider>
        </I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}

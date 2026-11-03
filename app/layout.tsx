import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { MotionBridge } from "@/components/motion/motion-bridge";
import "./globals.css";

const geist = Geist({
  fallback: ["system-ui", "Arial"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-mono",
});

const fraunces = Fraunces({
  axes: ["SOFT", "WONK", "opsz"],
  fallback: ["Georgia", "serif"],
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Promosyon Eticaret | Kurumsal Promosyon Ürünleri",
    template: "%s | Promosyon Eticaret",
  },
  description:
    "Kurumsal promosyon ürünleri: kalem, çanta, teknoloji, termos ve daha fazlası. Şirket logonuzla özelleştirilebilen yüzlerce ürün.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      className={`${geist.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      lang="tr"
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <MotionBridge>{children}</MotionBridge>
      </body>
    </html>
  );
}

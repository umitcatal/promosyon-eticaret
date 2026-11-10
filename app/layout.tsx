import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { MotionBridge } from "@/components/motion/motion-bridge";
import { SITE_BASE, openGraphBase } from "@/lib/seo";
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
  metadataBase: new URL(SITE_BASE),
  title: {
    default: "Kurumsal Promo | Kurumsal Promosyon Ürünleri",
    template: "%s | Kurumsal Promo",
  },
  description:
    "Kurumsal promosyon ürünleri: kalem, çanta, teknoloji, termos ve daha fazlası. Şirket logonuzla özelleştirilebilen yüzlerce ürün.",
  robots: { index: true, follow: true },
  openGraph: { ...openGraphBase },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/favicon/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: {
      url: "/favicon/apple-touch-icon.png",
      type: "image/png",
      sizes: "180x180",
    },
  },
  manifest: "/favicon/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf8f3",
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

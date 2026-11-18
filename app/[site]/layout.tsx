import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { site as siteParam } from "next/root-params";
import { MotionBridge } from "@/components/motion/motion-bridge";
import { getSiteIds, getSiteBaseUrl, parseSiteId } from "@/lib/sites";
import { getSiteIdentity } from "@/lib/site-settings";
import { readSiteTheme } from "@/lib/site-theme";
import { themeColor, themeCssVariables } from "@/lib/theme";
import "../globals.css";

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

export async function generateStaticParams() {
  return getSiteIds().map((id) => ({ site: String(id) }));
}

async function resolveSiteId(): Promise<number> {
  const siteId = parseSiteId(await siteParam());
  if (siteId === null) notFound();
  return siteId;
}

export async function generateMetadata(): Promise<Metadata> {
  const siteId = await resolveSiteId();
  const identity = getSiteIdentity(siteId);
  const baseUrl = getSiteBaseUrl(siteId);

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: identity.seoTitle,
      template: `%s | ${identity.siteName}`,
    },
    description: identity.seoDescription,
    robots: { index: true, follow: true },
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: identity.siteName,
      locale: "tr_TR",
      url: baseUrl,
      images: [
        {
          url: identity.ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${identity.siteName} - Kurumsal Promosyon Ürünleri`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [identity.ogImageUrl],
    },
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
    manifest: "/manifest.webmanifest",
  };
}

export async function generateViewport(): Promise<Viewport> {
  const siteId = await resolveSiteId();
  return {
    width: "device-width",
    initialScale: 1,
    themeColor: themeColor(readSiteTheme(siteId)),
  };
}

export default async function RootLayout({
  children,
}: LayoutProps<"/[site]">) {
  const siteId = await resolveSiteId();
  const theme = readSiteTheme(siteId);

  return (
    <html
      className={`${geist.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      lang="tr"
      data-site={siteId}
      data-theme={theme.preset}
      style={themeCssVariables(theme)}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <MotionBridge>{children}</MotionBridge>
      </body>
    </html>
  );
}

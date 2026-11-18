import { GoogleTag } from "@/components/analytics/google-tag";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { WhatsAppWidget } from "@/components/layout/whatsapp-widget";
import {
  getGoogleTagId,
  getSiteLogoUrl,
  getWhatsAppSupport,
} from "@/lib/queries";
import { getCurrentSiteId } from "@/lib/site-context";
import { getTurnstileSiteKey } from "@/lib/turnstile";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const [googleTag, whatsapp, logoUrl, siteId] = await Promise.all([
    getGoogleTagId(),
    getWhatsAppSupport(),
    getSiteLogoUrl(),
    getCurrentSiteId(),
  ]);

  return (
    <FavoritesProvider
      googleEnabled={googleEnabled}
      turnstileSiteKey={getTurnstileSiteKey(siteId)}
    >
      <GoogleTag tag={googleTag} />
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      {whatsapp.enabled && whatsapp.number ? (
        <WhatsAppWidget
          logoUrl={logoUrl}
          number={whatsapp.number}
          title={whatsapp.title}
          welcomeMessage={whatsapp.welcomeMessage}
        />
      ) : null}
    </FavoritesProvider>
  );
}

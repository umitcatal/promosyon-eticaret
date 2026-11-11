import { GoogleTag } from "@/components/analytics/google-tag";
import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getGoogleTagId } from "@/lib/queries";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const googleTag = await getGoogleTagId();

  return (
    <FavoritesProvider
      googleEnabled={googleEnabled}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
    >
      <GoogleTag tag={googleTag} />
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </FavoritesProvider>
  );
}

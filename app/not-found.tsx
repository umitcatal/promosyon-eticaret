import { FavoritesProvider } from "@/components/favorites/favorites-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { NotFoundContent } from "@/components/layout/not-found-content";

export default function NotFound() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return (
    <FavoritesProvider
      googleEnabled={googleEnabled}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
    >
      <Header />
      <main className="flex flex-1 flex-col">
        <NotFoundContent />
      </main>
      <Footer />
    </FavoritesProvider>
  );
}
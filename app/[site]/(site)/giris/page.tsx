import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { cardClass } from "@/components/ui/styles";
import { getCurrentSiteId } from "@/lib/site-context";
import { getSiteIdentity } from "@/lib/site-settings";
import { safeNextPath } from "@/lib/url";

export const instant = false;

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Hesabınıza giriş yapın.",
  robots: { index: false, follow: true },
};

const errorMessages: Record<string, string> = {
  google: "Google ile giriş şu anda yapılandırılmamış.",
  durum: "Giriş oturumu doğrulanamadı. Lütfen tekrar deneyin.",
  token: "Google ile giriş tamamlanamadı. Lütfen tekrar deneyin.",
  profil: "Google hesap bilgileri alınamadı. Lütfen tekrar deneyin.",
  kayit: "Hesap oluşturulamadı. Lütfen tekrar deneyin.",
};

export default async function LoginPage({ searchParams }: PageProps<"/[site]/giris">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const error =
    typeof params.error === "string" ? errorMessages[params.error] : undefined;
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const siteName = getSiteIdentity(await getCurrentSiteId()).siteName;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link className="text-2xl font-bold text-zinc-900" href="/">
            {siteName}
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-zinc-900">
            Hesabınıza giriş yapın
          </h1>
        </div>
        <div className={cardClass}>
          {error ? (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}
          <LoginForm googleEnabled={googleEnabled} next={next} />
        </div>
      </div>
    </div>
  );
}

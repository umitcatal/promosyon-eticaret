import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { cardClass } from "@/components/ui/styles";
import { safeNextPath } from "@/lib/url";

export const instant = false;

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Hesabınıza giriş yapın.",
};

const errorMessages: Record<string, string> = {
  google: "Google ile giriş şu anda yapılandırılmamış.",
  durum: "Giriş oturumu doğrulanamadı. Lütfen tekrar deneyin.",
  token: "Google ile giriş tamamlanamadı. Lütfen tekrar deneyin.",
  profil: "Google hesap bilgileri alınamadı. Lütfen tekrar deneyin.",
  kayit: "Hesap oluşturulamadı. Lütfen tekrar deneyin.",
};

export default async function LoginPage({ searchParams }: PageProps<"/giris">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const error =
    typeof params.error === "string" ? errorMessages[params.error] : undefined;
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link className="text-2xl font-bold text-zinc-900" href="/">
            Promosyon<span className="text-orange-600">Eticaret</span>
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

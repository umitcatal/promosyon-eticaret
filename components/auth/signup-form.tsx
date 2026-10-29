"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction, type AuthFormState } from "@/app/actions/auth";
import {
  errorTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/styles";

const initialState: AuthFormState = {};

export function SignupForm({
  next,
  googleEnabled,
}: {
  next: string;
  googleEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    signupAction,
    initialState
  );
  const nextParam = encodeURIComponent(next);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="firstName">
              Ad
            </label>
            <input
              className={inputClass}
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="lastName">
              Soyad
            </label>
            <input
              className={inputClass}
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              required
            />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="email">
            E-posta
          </label>
          <input
            className={inputClass}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">
            Telefon
          </label>
          <input
            className={inputClass}
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="05xx xxx xx xx"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="password">
            Şifre
          </label>
          <input
            className={inputClass}
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="mt-1 text-xs text-zinc-500">En az 8 karakter.</p>
        </div>
        {state.error ? <p className={errorTextClass}>{state.error}</p> : null}
        <button className={primaryButtonClass} disabled={pending} type="submit">
          {pending ? "Hesap oluşturuluyor..." : "Üye Ol"}
        </button>
      </form>

      {googleEnabled ? (
        <a
          className={secondaryButtonClass}
          href={`/api/auth/google?next=${nextParam}`}
        >
          Google ile Hızlı Üye Ol
        </a>
      ) : null}

      <p className="text-center text-sm text-zinc-600">
        Zaten hesabınız var mı?{" "}
        <Link
          className="font-semibold text-orange-600 hover:text-orange-700"
          href={`/giris?next=${nextParam}`}
        >
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}

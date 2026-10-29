"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/app/actions/auth";
import {
  errorTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/styles";

const initialState: AuthFormState = {};

export function LoginForm({
  next,
  googleEnabled,
}: {
  next: string;
  googleEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const nextParam = encodeURIComponent(next);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
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
          <label className={labelClass} htmlFor="password">
            Şifre
          </label>
          <input
            className={inputClass}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {state.error ? <p className={errorTextClass}>{state.error}</p> : null}
        <button className={primaryButtonClass} disabled={pending} type="submit">
          {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>

      {googleEnabled ? (
        <a
          className={secondaryButtonClass}
          href={`/api/auth/google?next=${nextParam}`}
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
              fill="#EA4335"
            />
          </svg>
          Google ile Giriş Yap
        </a>
      ) : null}

      <p className="text-center text-sm text-zinc-600">
        Hesabınız yok mu?{" "}
        <Link
          className="font-semibold text-orange-600 hover:text-orange-700"
          href={`/kayit?next=${nextParam}`}
        >
          Hemen üye olun
        </Link>
      </p>
    </div>
  );
}

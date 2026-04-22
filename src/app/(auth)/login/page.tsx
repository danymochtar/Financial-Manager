"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n";

function LoginForm() {
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError(t("auth.invalid"));
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="card p-5">
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="label">{t("auth.email")}</label>
          <input
            type="email"
            autoComplete="email"
            required
            className="input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">{t("auth.password")}</label>
          <input
            type="password"
            autoComplete="current-password"
            required
            className="input mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? t("auth.loggingIn") : t("auth.loginTitle")}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-semibold text-emerald-700">
          {t("auth.register")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card p-5 text-sm text-slate-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

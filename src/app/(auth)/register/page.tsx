"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";

export default function RegisterPage() {
  const { t } = useT();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    primaryCurrency: "IDR" as "IDR" | "MYR" | "USD" | "SGD",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.formErrors?.[0] ?? data?.error ?? "Register failed");
        return;
      }
      const signed = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signed?.error) {
        setError("Account created but login failed — try manually.");
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="label">{t("auth.name")}</label>
          <input
            required
            className="input mt-1"
            placeholder={t("auth.namePlaceholder")}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">{t("auth.email")}</label>
          <input
            type="email"
            required
            className="input mt-1"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">{t("auth.password")}</label>
          <input
            type="password"
            required
            minLength={6}
            className="input mt-1"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <p className="mt-1 text-[11px] text-slate-500">{t("auth.passwordMin")}</p>
        </div>
        <div>
          <label className="label">{t("auth.currencyDefault")}</label>
          <select
            className="input mt-1"
            value={form.primaryCurrency}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                primaryCurrency: e.target.value as typeof f.primaryCurrency,
              }))
            }
          >
            <option value="IDR">IDR (Rupiah)</option>
            <option value="MYR">MYR (Ringgit)</option>
            <option value="USD">USD</option>
            <option value="SGD">SGD</option>
          </select>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "..." : t("auth.registerTitle")}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        {t("auth.hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-emerald-700">
          {t("auth.login")}
        </Link>
      </p>
    </div>
  );
}

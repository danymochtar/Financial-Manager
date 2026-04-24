"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { useT, type Locale } from "@/lib/i18n";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { LogOut, Tags, Wallet, Receipt, PiggyBank } from "lucide-react";

type Currency = "IDR" | "MYR" | "USD" | "SGD";

const DEFAULT_ENABLED: Currency[] = [...SUPPORTED_CURRENCIES] as Currency[];

export default function SettingPage() {
  const { t, locale, setLocale } = useT();
  const { data: session, update } = useSession();
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    primaryCurrency: "IDR" as Currency,
  });
  const [enabledCurrencies, setEnabledCurrencies] = useState<Currency[]>(DEFAULT_ENABLED);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setForm({
            name: d.user.name ?? "",
            primaryCurrency: (d.user.primaryCurrency as Currency) ?? "IDR",
          });
          if (Array.isArray(d.user.enabledCurrencies)) {
            setEnabledCurrencies(d.user.enabledCurrencies as Currency[]);
          }
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        enabledCurrencies,
      }),
    });
    if (!res.ok) {
      toast({ kind: "error", message: "Error" });
      return;
    }
    await update({ user: { primaryCurrency: form.primaryCurrency } });
    toast({ kind: "success", message: t("setting.saved") });
  }

  function toggleCurrency(c: Currency) {
    setEnabledCurrencies((prev) => {
      const has = prev.includes(c);
      if (has) {
        if (prev.length <= 1) return prev; // always keep at least one
        if (c === form.primaryCurrency) {
          toast({ kind: "error", message: t("setting.currencyPrimary") });
          return prev;
        }
        return prev.filter((x) => x !== c);
      }
      return [...prev, c];
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{t("setting.title")}</h1>

      <div className="card p-4">
        <label className="label">{t("setting.language")}</label>
        <div className="mt-2 inline-flex rounded-full bg-white p-0.5 border border-emerald-100 text-sm">
          {(["id", "en"] as Locale[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={`px-4 py-1.5 rounded-full font-semibold uppercase ${
                locale === l ? "bg-emerald-600 text-white" : "text-slate-500"
              }`}
            >
              {l === "id" ? "🇮🇩 Bahasa" : "🇺🇸 English"}
            </button>
          ))}
        </div>
      </div>

      <form className="card space-y-3 p-4" onSubmit={save}>
        <div>
          <label className="label">{t("setting.name")}</label>
          <input
            className="input mt-1"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">{t("setting.currencyDefault")}</label>
          <select
            className="input mt-1"
            value={form.primaryCurrency}
            onChange={(e) =>
              setForm((f) => ({ ...f, primaryCurrency: e.target.value as Currency }))
            }
          >
            {enabledCurrencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t("setting.currencyUsed")}</label>
          <p className="mt-1 mb-2 text-[11px] text-slate-500">
            {t("setting.currencyUsedHint")}
          </p>
          <div className="flex flex-wrap gap-2">
            {(SUPPORTED_CURRENCIES as readonly Currency[]).map((c) => {
              const active = enabledCurrencies.includes(c);
              const isPrimary = c === form.primaryCurrency;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCurrency(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase transition ${
                    active
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-500 border border-slate-200"
                  } ${isPrimary ? "ring-2 ring-emerald-300" : ""}`}
                >
                  {c}
                  {isPrimary && " ⭐"}
                </button>
              );
            })}
          </div>
        </div>
        <button type="submit" className="btn-primary w-full">
          {t("save")}
        </button>
      </form>

      <div className="card divide-y divide-emerald-50">
        <QuickLink href="/budget" icon={PiggyBank} label={t("budget.title")} desc={t("budget.desc")} />
        <QuickLink href="/wajib" icon={Receipt} label={t("wajib.title")} desc={t("wajib.desc")} />
        <QuickLink href="/akun" icon={Wallet} label={t("akun.title")} desc={t("akun.newBtn")} />
        <QuickLink href="/review" icon={Tags} label="Draft" desc="Receipt" />
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="btn-outline w-full text-rose-600"
      >
        <LogOut className="h-4 w-4" /> {t("logout")}
      </button>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 active:bg-emerald-50/40">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-slate-500">{desc}</div>
      </div>
    </Link>
  );
}

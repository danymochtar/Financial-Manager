"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Sparkles, Target, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { BorosMeter } from "@/components/BorosMeter";
import { formatMoney, formatShort } from "@/lib/currency";
import { useT } from "@/lib/i18n";

type View = Record<"IDR" | "MYR" | "USD" | "SGD", number>;

type Summary = {
  boros: { today: View; week: View; month: View };
  budgets: Array<{ scope: string; period: "daily" | "weekly" | "monthly"; amount: string; currency: string; category?: { name: string } | null }>;
  wealth: {
    asset: View;
    debt: View;
    investment: View;
    physical: View;
    netWorth: View;
    fixedIncome: View;
    fixedLoad: View;
  };
  fx: { date: string; rates: Record<string, Record<string, number>> };
  streak: { currentStreak: number; bestStreak: number };
  meta: { transactionCount: number };
};

type Currency = "IDR" | "MYR" | "USD" | "SGD";

export default function DashboardPage() {
  const { t, locale } = useT();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [curr, setCurr] = useState<Currency>("IDR");
  const [recent, setRecent] = useState<
    Array<{
      id: string;
      merchant: string | null;
      amount: string;
      currency: string;
      type: string;
      isBoros: boolean;
      date: string;
      category: { name: string; emoji: string; color: string };
      account: { name: string; emoji: string };
    }>
  >([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports/summary").then((r) => r.json()),
      fetch("/api/transactions?take=5").then((r) => r.json()),
    ]).then(([s, t]) => {
      setSummary(s);
      setRecent(t.transactions ?? []);
    });
  }, []);

  // Convert a budget amount (stored in its own currency) to the view currency
  // using today's FX so any currency toggle works for every budget row.
  const toView = (amount: number, from: string): number => {
    if (!summary?.fx) return amount;
    if (from === curr) return amount;
    const rate = summary.fx.rates?.[from]?.[curr];
    return rate != null ? amount * rate : amount;
  };

  const findBudget = (period: "daily" | "weekly" | "monthly") => {
    // Prefer exact-currency match, else take first in any currency and convert.
    const exact = summary?.budgets.find(
      (b) => b.scope === "overall" && b.period === period && b.currency === curr
    );
    if (exact) return Number(exact.amount);
    const other = summary?.budgets.find((b) => b.scope === "overall" && b.period === period);
    if (other) return toView(Number(other.amount), other.currency);
    return 0;
  };

  const todaySpent = summary?.boros.today[curr] ?? 0;
  const weekSpent = summary?.boros.week[curr] ?? 0;
  const monthSpent = summary?.boros.month[curr] ?? 0;

  const dailyLimit = findBudget("daily");
  const weeklyLimit = findBudget("weekly");
  const monthlyLimit = findBudget("monthly");

  const assetSum =
    (summary?.wealth.asset[curr] ?? 0) +
    (summary?.wealth.investment[curr] ?? 0) +
    (summary?.wealth.physical[curr] ?? 0);
  const debtSum = summary?.wealth.debt[curr] ?? 0;
  const netWorth = summary?.wealth.netWorth[curr] ?? assetSum - debtSum;

  return (
    <div className="space-y-5">
      {/* Currency toggle */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">
          {t("dash.today")}:{" "}
          {new Date().toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
        <div className="inline-flex rounded-full bg-white p-0.5 border border-emerald-100 text-[11px]">
          {(["IDR", "MYR", "USD", "SGD"] as Currency[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurr(c)}
              className={`px-2.5 py-1 rounded-full font-semibold ${
                curr === c ? "bg-emerald-600 text-white" : "text-slate-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Boros Meter hero */}
      <BorosMeter spent={todaySpent} limit={dailyLimit} currency={curr} label={t("dash.boros.today")} />

      {/* Week / Month progress bars */}
      <div className="grid grid-cols-2 gap-3">
        <MiniBar label={t("dash.boros.week")} spent={weekSpent} limit={weeklyLimit} currency={curr} />
        <MiniBar label={t("dash.boros.month")} spent={monthSpent} limit={monthlyLimit} currency={curr} />
      </div>

      {/* Dukun CTA — solid emerald for high contrast, gold accent ring */}
      <Link
        href="/dukun"
        className="card relative block overflow-hidden bg-emerald-700 p-4 text-white ring-1 ring-amber-300/30 active:scale-[0.99]"
      >
        <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-300/15" />
        <span className="absolute -bottom-10 -left-4 h-24 w-24 rounded-full bg-emerald-500/30" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-300 text-emerald-900 shadow-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
              {t("dash.dukunCta.title")}
            </div>
            <div className="mt-0.5 truncate text-base font-bold leading-tight text-white">
              {t("dash.dukunCta.question")}
            </div>
            <div className="text-xs text-emerald-100/90">{t("dash.dukunCta.sub")}</div>
          </div>
          <Target className="h-5 w-5 text-amber-200" />
        </div>
      </Link>

      {/* Streak */}
      {summary && summary.streak.currentStreak > 0 && (
        <div className="card bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400 p-4 text-white">
          <div className="flex items-center gap-3">
            <Flame className="h-8 w-8 text-amber-100" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-100">{t("dash.streak")}</div>
              <div className="text-2xl font-bold">{summary.streak.currentStreak} {t("dash.streakDays")} 🔥</div>
              <div className="text-xs text-emerald-50/90">
                {t("dash.best")}: {summary.streak.bestStreak} {t("dash.streakDays")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Net worth */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("dash.netWorth")}</div>
          <Link href="/akun" className="text-xs text-emerald-600">{t("dash.viewAccounts")}</Link>
        </div>
        <div className={`mt-1 text-2xl font-bold ${netWorth >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
          {formatMoney(netWorth, curr)}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
          <div className="stat-tile">
            <div className="flex items-center gap-1 text-slate-500">
              <TrendingUp className="h-3 w-3 text-emerald-500" /> {t("dash.asset")}
            </div>
            <div className="mt-1 font-semibold">{formatShort(assetSum, curr)}</div>
          </div>
          <div className="stat-tile">
            <div className="flex items-center gap-1 text-slate-500">
              <TrendingDown className="h-3 w-3 text-rose-500" /> {t("dash.debt")}
            </div>
            <div className="mt-1 font-semibold">{formatShort(debtSum, curr)}</div>
          </div>
        </div>
      </div>

      {/* Fixed monthly load */}
      {summary && (summary.wealth.fixedLoad[curr] + summary.wealth.fixedIncome[curr] > 0) && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("dash.fixedLoad")}</div>
            <Link href="/wajib" className="text-xs text-emerald-600">{t("dash.adjust")}</Link>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-slate-500 text-xs">{t("dash.fixedIncome")}</div>
              <div className="font-semibold text-emerald-600">
                +{formatShort(summary.wealth.fixedIncome[curr], curr)}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">{t("dash.fixedExpense")}</div>
              <div className="font-semibold text-rose-600">
                -{formatShort(summary.wealth.fixedLoad[curr], curr)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("dash.recentTx")}</div>
          <Link href="/tx" className="text-xs text-emerald-600">{t("dash.seeAll")}</Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">
            <Wallet className="mx-auto mb-2 h-6 w-6 opacity-50" />
            {t("dash.emptyTx")}
          </div>
        ) : (
          <ul className="divide-y divide-emerald-50">
            {recent.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3 py-2.5">
                <span className="text-xl">{tx.category.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {tx.merchant ?? tx.category.name}
                    {tx.isBoros && <span className="ml-1 text-xs text-rose-500">🫠</span>}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tx.account.emoji} {tx.account.name} ·{" "}
                    {new Date(tx.date).toLocaleDateString(locale === "en" ? "en-US" : "id-ID")}
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold ${
                    tx.type === "income" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"} {formatShort(Number(tx.amount), tx.currency)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MiniBar({
  label,
  spent,
  limit,
  currency,
}: {
  label: string;
  spent: number;
  limit: number;
  currency: Currency;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const color = pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-orange-500" : "bg-emerald-500";
  return (
    <div className="stat-tile">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold">
        {formatShort(spent, currency)}
        {limit > 0 && (
          <span className="text-xs font-normal text-slate-400"> / {formatShort(limit, currency)}</span>
        )}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-50">
        {limit > 0 && <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />}
      </div>
    </div>
  );
}

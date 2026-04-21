"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { BorosMeter } from "@/components/BorosMeter";
import { formatMoney, formatShort } from "@/lib/currency";

type Summary = {
  boros: { today: { IDR: number; MYR: number }; week: { IDR: number; MYR: number }; month: { IDR: number; MYR: number } };
  budgets: Array<{ scope: string; period: "daily" | "weekly" | "monthly"; amount: string; currency: string; category?: { name: string } | null }>;
  netWorth: { assetIDR: number; assetMYR: number; debtIDR: number; debtMYR: number };
  fixedLoad: { incomeIDR: number; incomeMYR: number; expenseIDR: number; expenseMYR: number };
  streak: { currentStreak: number; bestStreak: number };
  meta: { transactionCount: number };
};

type Currency = "IDR" | "MYR";

export default function DashboardPage() {
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

  const dailyBudget = summary?.budgets.find((b) => b.scope === "overall" && b.period === "daily" && b.currency === curr);
  const weeklyBudget = summary?.budgets.find((b) => b.scope === "overall" && b.period === "weekly" && b.currency === curr);
  const monthlyBudget = summary?.budgets.find((b) => b.scope === "overall" && b.period === "monthly" && b.currency === curr);

  const todaySpent = summary?.boros.today[curr] ?? 0;
  const weekSpent = summary?.boros.week[curr] ?? 0;
  const monthSpent = summary?.boros.month[curr] ?? 0;

  const dailyLimit = Number(dailyBudget?.amount ?? 0);
  const weeklyLimit = Number(weeklyBudget?.amount ?? 0);
  const monthlyLimit = Number(monthlyBudget?.amount ?? 0);

  const assetSum = curr === "IDR" ? summary?.netWorth.assetIDR ?? 0 : summary?.netWorth.assetMYR ?? 0;
  const debtSum = curr === "IDR" ? summary?.netWorth.debtIDR ?? 0 : summary?.netWorth.debtMYR ?? 0;
  const netWorth = assetSum - debtSum;

  return (
    <div className="space-y-5">
      {/* Currency toggle */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">Hari ini: {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</div>
        <div className="inline-flex rounded-full bg-white p-0.5 border border-pink-100 text-xs">
          {(["IDR", "MYR"] as Currency[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurr(c)}
              className={`px-3 py-1 rounded-full font-medium ${
                curr === c ? "bg-pink-600 text-white" : "text-slate-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Boros Meter hero */}
      <BorosMeter spent={todaySpent} limit={dailyLimit} currency={curr} label="Hari Ini" />

      {/* Week / Month progress bars */}
      <div className="grid grid-cols-2 gap-3">
        <MiniBar label="Minggu ini" spent={weekSpent} limit={weeklyLimit} currency={curr} />
        <MiniBar label="Bulan ini" spent={monthSpent} limit={monthlyLimit} currency={curr} />
      </div>

      {/* Streak */}
      {summary && summary.streak.currentStreak > 0 && (
        <div className="card bg-gradient-to-r from-orange-500 to-pink-500 p-4 text-white">
          <div className="flex items-center gap-3">
            <Flame className="h-8 w-8" />
            <div>
              <div className="text-xs uppercase tracking-wider opacity-90">Hemat Streak</div>
              <div className="text-2xl font-bold">{summary.streak.currentStreak} hari 🔥</div>
              <div className="text-xs opacity-90">
                Best: {summary.streak.bestStreak} hari
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Net worth */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Worth</div>
          <Link href="/akun" className="text-xs text-pink-600">Lihat akun →</Link>
        </div>
        <div className={`mt-1 text-2xl font-bold ${netWorth >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
          {formatMoney(netWorth, curr)}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
          <div className="stat-tile">
            <div className="flex items-center gap-1 text-slate-500">
              <TrendingUp className="h-3 w-3 text-emerald-500" /> Aset
            </div>
            <div className="mt-1 font-semibold">{formatShort(assetSum, curr)}</div>
          </div>
          <div className="stat-tile">
            <div className="flex items-center gap-1 text-slate-500">
              <TrendingDown className="h-3 w-3 text-rose-500" /> Hutang
            </div>
            <div className="mt-1 font-semibold">{formatShort(debtSum, curr)}</div>
          </div>
        </div>
      </div>

      {/* Fixed monthly load */}
      {summary && (summary.fixedLoad.expenseIDR + summary.fixedLoad.expenseMYR > 0) && (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Beban Fix Bulanan</div>
            <Link href="/wajib" className="text-xs text-pink-600">Atur →</Link>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-slate-500 text-xs">Income fix</div>
              <div className="font-semibold text-emerald-600">
                +{formatShort(curr === "IDR" ? summary.fixedLoad.incomeIDR : summary.fixedLoad.incomeMYR, curr)}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Expense fix</div>
              <div className="font-semibold text-rose-600">
                -{formatShort(curr === "IDR" ? summary.fixedLoad.expenseIDR : summary.fixedLoad.expenseMYR, curr)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Transaksi Terakhir</div>
          <Link href="/tx" className="text-xs text-pink-600">Liat semua →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">
            <Wallet className="mx-auto mb-2 h-6 w-6 opacity-50" />
            Belum ada transaksi. Tap tombol kamera di bawah 👇
          </div>
        ) : (
          <ul className="divide-y divide-pink-50">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                <span className="text-xl">{t.category.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {t.merchant ?? t.category.name}
                    {t.isBoros && <span className="ml-1 text-xs text-rose-500">🫠</span>}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {t.account.emoji} {t.account.name} · {new Date(t.date).toLocaleDateString("id-ID")}
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold ${
                    t.type === "income" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"} {formatShort(Number(t.amount), t.currency)}
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
  currency: "IDR" | "MYR";
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
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-pink-50">
        {limit > 0 && <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Flame, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatShort } from "@/lib/currency";
import { useT } from "@/lib/i18n";

type Summary = {
  totals: { incomeIDR: number; expenseIDR: number; incomeMYR: number; expenseMYR: number };
  byCategory: Array<{ name: string; emoji: string; color: string; nature: string; IDR: number; MYR: number }>;
  series: Array<{ month: string; incomeIDR: number; expenseIDR: number; incomeMYR: number; expenseMYR: number }>;
  streak: { currentStreak: number; bestStreak: number };
};

type Currency = "IDR" | "MYR";

export default function AnalyticsPage() {
  const { t } = useT();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [curr, setCurr] = useState<Currency>("IDR");

  useEffect(() => {
    fetch("/api/reports/summary")
      .then((r) => r.json())
      .then((d) => setSummary(d));
  }, []);

  const variableCats = summary?.byCategory.filter((c) => c.nature === "variable") ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("analytics.title")}</h1>
          <p className="text-sm text-slate-600">{t("analytics.desc")}</p>
        </div>
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

      {summary && (
        <>
          <div className="card bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 p-5 text-white">
            <Flame className="h-8 w-8" />
            <div className="mt-2 text-xs uppercase tracking-wider opacity-90">{t("dash.streak")}</div>
            <div className="text-4xl font-bold">{summary.streak.currentStreak} 🔥</div>
            <div className="text-xs opacity-90">
              {t("analytics.streakBest")}: {summary.streak.bestStreak} {t("dash.streakDays")}
            </div>
            {summary.streak.currentStreak === 0 && (
              <div className="mt-2 text-xs opacity-90">{t("analytics.streakStart")}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="stat-tile">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <TrendingUp className="h-3 w-3 text-emerald-500" /> {t("analytics.incomeMonth")}
              </div>
              <div className="mt-1 text-lg font-bold text-emerald-600">
                {formatShort(curr === "IDR" ? summary.totals.incomeIDR : summary.totals.incomeMYR, curr)}
              </div>
            </div>
            <div className="stat-tile">
              <div className="flex items-center gap-1 text-xs text-slate-500">{t("analytics.expenseMonth")}</div>
              <div className="mt-1 text-lg font-bold text-rose-600">
                {formatShort(curr === "IDR" ? summary.totals.expenseIDR : summary.totals.expenseMYR, curr)}
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="mb-2 text-sm font-semibold">{t("analytics.last6m")}</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => formatShort(v, curr)} />
                <Tooltip formatter={(v: number) => formatShort(v, curr)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey={curr === "IDR" ? "incomeIDR" : "incomeMYR"} name="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey={curr === "IDR" ? "expenseIDR" : "expenseMYR"} name="Expense" fill="#ec4899" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {variableCats.length > 0 && (
            <div className="card p-4">
              <div className="mb-2 text-sm font-semibold">{t("analytics.borosBreakdown")}</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={variableCats.filter((c) => (curr === "IDR" ? c.IDR : c.MYR) > 0)}
                    dataKey={curr === "IDR" ? "IDR" : "MYR"}
                    nameKey="name"
                    outerRadius={80}
                    innerRadius={48}
                  >
                    {variableCats.map((c, i) => (
                      <Cell key={i} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatShort(v, curr)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card p-4">
            <div className="mb-2 text-sm font-semibold">{t("analytics.exportData")}</div>
            <div className="flex gap-2">
              <Link href="/api/export?format=csv" className="btn-outline flex-1 text-xs">
                <Download className="h-3 w-3" /> CSV
              </Link>
              <Link href="/api/export?format=xlsx" className="btn-outline flex-1 text-xs">
                <Download className="h-3 w-3" /> XLSX
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

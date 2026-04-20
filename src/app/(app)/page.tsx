"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { MonthlyBarChart, CategoryPieChart, SourceBarChart } from "@/components/Charts";
import { formatMoney } from "@/lib/currency";
import { Plus, Receipt as ReceiptIcon } from "lucide-react";

type Summary = {
  range: { from: string; to: string };
  totals: { incomeIDR: number; expenseIDR: number; incomeMYR: number; expenseMYR: number };
  byCategory: Array<{ name: string; color: string; IDR: number; MYR: number }>;
  bySource: Array<{
    name: string;
    color: string;
    incomeIDR: number;
    expenseIDR: number;
    incomeMYR: number;
    expenseMYR: number;
  }>;
  series: Array<{
    month: string;
    incomeIDR: number;
    expenseIDR: number;
    incomeMYR: number;
    expenseMYR: number;
  }>;
  meta: { transactionCount: number };
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [view, setView] = useState<"IDR" | "MYR" | "BOTH">("BOTH");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch("/api/reports/summary");
      const data = await res.json();
      if (alive) {
        setSummary(data);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const netIDR = useMemo(() => (summary ? summary.totals.incomeIDR - summary.totals.expenseIDR : 0), [summary]);
  const netMYR = useMemo(() => (summary ? summary.totals.incomeMYR - summary.totals.expenseMYR : 0), [summary]);

  const chartCurrency: "IDR" | "MYR" = view === "MYR" ? "MYR" : "IDR";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Bulan ini — {summary ? new Date(summary.range.from).toLocaleDateString("id-ID") : "…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CurrencyToggle value={view} onChange={setView} />
          <Link href="/transactions/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Transaksi baru
          </Link>
          <Link href="/receipts" className="btn-outline">
            <ReceiptIcon className="h-4 w-4" /> Upload receipt
          </Link>
        </div>
      </div>

      {loading && <div className="card p-6 text-sm text-slate-500">Loading ringkasan…</div>}

      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard
              title="Income"
              view={view}
              idr={summary.totals.incomeIDR}
              myr={summary.totals.incomeMYR}
              tone="emerald"
            />
            <SummaryCard
              title="Expense"
              view={view}
              idr={summary.totals.expenseIDR}
              myr={summary.totals.expenseMYR}
              tone="rose"
            />
            <SummaryCard title="Net" view={view} idr={netIDR} myr={netMYR} tone="brand" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Income vs Expense (6 bulan)</h2>
                <span className="text-xs text-slate-500">view: {chartCurrency}</span>
              </div>
              <MonthlyBarChart data={summary.series} currency={chartCurrency} />
            </div>
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Breakdown per Kategori</h2>
                <span className="text-xs text-slate-500">view: {chartCurrency}</span>
              </div>
              <CategoryPieChart data={summary.byCategory} currency={chartCurrency} />
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Per Source (Kerjaan vs Project)</h2>
              <span className="text-xs text-slate-500">view: {chartCurrency}</span>
            </div>
            <SourceBarChart data={summary.bySource} currency={chartCurrency} />
          </div>

          <div className="text-xs text-slate-500">
            {summary.meta.transactionCount} transaksi di periode ini.
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  view,
  idr,
  myr,
  tone,
}: {
  title: string;
  view: "IDR" | "MYR" | "BOTH";
  idr: number;
  myr: number;
  tone: "emerald" | "rose" | "brand";
}) {
  const tint =
    tone === "emerald"
      ? "from-emerald-50 to-white border-emerald-100"
      : tone === "rose"
      ? "from-rose-50 to-white border-rose-100"
      : "from-brand-50 to-white border-brand-100";
  return (
    <div className={`card bg-gradient-to-br ${tint} p-5`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      {view !== "MYR" && <div className="mt-1 text-2xl font-semibold">{formatMoney(idr, "IDR")}</div>}
      {view !== "IDR" && (
        <div className={`mt-1 ${view === "BOTH" ? "text-sm text-slate-600" : "text-2xl font-semibold"}`}>
          {formatMoney(myr, "MYR")}
        </div>
      )}
    </div>
  );
}

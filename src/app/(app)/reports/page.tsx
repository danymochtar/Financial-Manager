"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { MonthlyBarChart, CategoryPieChart, SourceBarChart } from "@/components/Charts";
import { formatMoney } from "@/lib/currency";
import { Download } from "lucide-react";

type Summary = {
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
  series: Array<{ month: string; incomeIDR: number; expenseIDR: number; incomeMYR: number; expenseMYR: number }>;
};

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const today = new Date();
  const [from, setFrom] = useState<string>(ymd(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [to, setTo] = useState<string>(ymd(today));
  const [view, setView] = useState<"IDR" | "MYR" | "BOTH">("BOTH");
  const [summary, setSummary] = useState<Summary | null>(null);

  async function load() {
    const qs = new URLSearchParams({ from, to }).toString();
    const res = await fetch(`/api/reports/summary?${qs}`);
    setSummary(await res.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const chartCurrency: "IDR" | "MYR" = view === "MYR" ? "MYR" : "IDR";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <div className="flex items-center gap-2">
          <CurrencyToggle value={view} onChange={setView} />
          <Link href={`/api/export?format=csv&from=${from}&to=${to}`} className="btn-outline">
            <Download className="h-4 w-4" /> CSV
          </Link>
          <Link href={`/api/export?format=xlsx&from=${from}&to=${to}`} className="btn-outline">
            <Download className="h-4 w-4" /> XLSX
          </Link>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">Dari</label>
          <input type="date" className="input mt-1" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">Sampai</label>
          <input type="date" className="input mt-1" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Kpi title="Income" view={view} idr={summary.totals.incomeIDR} myr={summary.totals.incomeMYR} />
            <Kpi title="Expense" view={view} idr={summary.totals.expenseIDR} myr={summary.totals.expenseMYR} />
            <Kpi
              title="Net"
              view={view}
              idr={summary.totals.incomeIDR - summary.totals.expenseIDR}
              myr={summary.totals.incomeMYR - summary.totals.expenseMYR}
            />
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-semibold">Monthly ({chartCurrency})</h2>
            <MonthlyBarChart data={summary.series} currency={chartCurrency} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="mb-3 font-semibold">Per Kategori</h2>
              <CategoryPieChart data={summary.byCategory} currency={chartCurrency} />
            </div>
            <div className="card p-5">
              <h2 className="mb-3 font-semibold">Per Source</h2>
              <SourceBarChart data={summary.bySource} currency={chartCurrency} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({
  title,
  view,
  idr,
  myr,
}: {
  title: string;
  view: "IDR" | "MYR" | "BOTH";
  idr: number;
  myr: number;
}) {
  return (
    <div className="card p-5">
      <div className="label">{title}</div>
      {view !== "MYR" && <div className="mt-1 text-xl font-semibold">{formatMoney(idr, "IDR")}</div>}
      {view !== "IDR" && (
        <div className={`${view === "BOTH" ? "text-sm text-slate-600 mt-1" : "text-xl font-semibold mt-1"}`}>
          {formatMoney(myr, "MYR")}
        </div>
      )}
    </div>
  );
}

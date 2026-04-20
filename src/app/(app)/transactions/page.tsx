"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatMoney } from "@/lib/currency";

type Tx = {
  id: string;
  type: string;
  amount: string;
  currency: string;
  amountIDR: string;
  amountMYR: string;
  date: string;
  merchant: string | null;
  note: string | null;
  source: { name: string; color: string };
  category: { name: string; color: string };
  receiptId: string | null;
};

export default function TransactionsPage() {
  const [items, setItems] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const qs = new URLSearchParams();
      if (typeFilter !== "all") qs.set("type", typeFilter);
      const res = await fetch(`/api/transactions?${qs}`);
      const data = await res.json();
      setItems(data.transactions ?? []);
      setLoading(false);
    })();
  }, [typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Transaksi</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
            {(["all", "expense", "income"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-md ${
                  typeFilter === t ? "bg-brand-600 text-white" : "text-slate-600"
                }`}
              >
                {t === "all" ? "Semua" : t === "income" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>
          <Link href="/transactions/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Baru
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">Belum ada transaksi. Coba tambah dulu.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="pl-4">Tanggal</th>
                  <th>Source</th>
                  <th>Kategori</th>
                  <th>Merchant</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right pr-4">Base</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="pl-4">
                      <Link href={`/transactions/${t.id}`} className="text-slate-700">
                        {new Date(t.date).toLocaleDateString("id-ID")}
                      </Link>
                    </td>
                    <td>
                      <span className="chip" style={{ color: t.source.color }}>
                        {t.source.name}
                      </span>
                    </td>
                    <td>
                      <span className="chip" style={{ color: t.category.color }}>
                        {t.category.name}
                      </span>
                    </td>
                    <td>{t.merchant ?? "-"}</td>
                    <td className={`text-right font-medium ${t.type === "income" ? "text-emerald-700" : "text-rose-700"}`}>
                      {t.type === "income" ? "+" : "-"} {formatMoney(t.amount, t.currency)}
                    </td>
                    <td className="pr-4 text-right text-xs text-slate-500">
                      {formatMoney(t.amountIDR, "IDR")}
                      <br />
                      {formatMoney(t.amountMYR, "MYR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReceiptUploader } from "@/components/ReceiptUploader";
import { formatMoney } from "@/lib/currency";

type Receipt = {
  id: string;
  merchant: string | null;
  totalAmount: string | null;
  currency: string | null;
  date: string | null;
  status: string;
  createdAt: string;
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "confirmed">("draft");

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filter !== "all") qs.set("status", filter);
    const res = await fetch(`/api/receipts?${qs}`);
    const data = await res.json();
    setReceipts(data.receipts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Receipts (OCR)</h1>
        <p className="text-sm text-slate-500">Upload receipt → Claude Vision auto-extract → confirm jadi transaksi.</p>
      </div>

      <ReceiptUploader onUploaded={() => load()} />

      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="font-semibold">Riwayat Receipt</h2>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
            {(["draft", "confirmed", "all"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-md ${filter === s ? "bg-brand-600 text-white" : "text-slate-600"}`}
              >
                {s === "all" ? "Semua" : s === "draft" ? "Draft" : "Confirmed"}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="p-4 text-sm text-slate-500">Loading…</div>
        ) : receipts.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">Belum ada receipt.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {receipts.map((r) => (
              <li key={r.id} className="flex items-center justify-between p-4">
                <Link href={`/receipts/${r.id}`} className="flex flex-1 items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/receipts/${r.id}/image`}
                    alt=""
                    className="h-12 w-12 rounded object-cover border border-slate-200"
                  />
                  <div>
                    <div className="font-medium">{r.merchant ?? "(Belum terdeteksi)"}</div>
                    <div className="text-xs text-slate-500">
                      {r.date ? new Date(r.date).toLocaleDateString("id-ID") : new Date(r.createdAt).toLocaleDateString("id-ID")}
                      {" · "}
                      {r.totalAmount && r.currency ? formatMoney(r.totalAmount, r.currency) : "-"}
                    </div>
                  </div>
                </Link>
                <span
                  className={`text-xs font-medium ${
                    r.status === "draft" ? "text-amber-600" : r.status === "confirmed" ? "text-emerald-600" : "text-slate-500"
                  }`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { formatMoney } from "@/lib/currency";

type ReceiptItem = {
  id: string;
  name: string;
  quantity: string | null;
  unitPrice: string | null;
  total: string | null;
  categorySuggestion: string | null;
};

type Receipt = {
  id: string;
  merchant: string | null;
  totalAmount: string | null;
  currency: string | null;
  date: string | null;
  status: string;
  imagePath: string;
  items: ReceiptItem[];
  transaction: { id: string } | null;
};

type Option = { id: string; name: string; kind?: string };

export default function ReceiptReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [sources, setSources] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null);

  const [values, setValues] = useState({
    sourceId: "",
    categoryId: "",
    amount: 0,
    currency: "IDR" as "IDR" | "MYR" | "USD" | "SGD",
    date: new Date().toISOString().slice(0, 10),
    merchant: "",
    note: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [rRes, sRes, cRes] = await Promise.all([
        fetch(`/api/receipts/${id}`),
        fetch("/api/sources"),
        fetch("/api/categories"),
      ]);
      const rData = await rRes.json();
      const sData = await sRes.json();
      const cData = await cRes.json();
      const r = rData.receipt as Receipt;
      setReceipt(r);
      setSources(sData.sources ?? []);
      setCategories(cData.categories ?? []);

      // naive second pass at suggestion based on item hints
      let suggested: string | null = null;
      if (r?.merchant || r?.items?.length) {
        const hit = (cData.categories as Option[])?.find((c) =>
          c.kind === "expense" && r.items?.some((it) => it.categorySuggestion && c.name.toLowerCase().includes(it.categorySuggestion.toLowerCase()))
        );
        if (hit) suggested = hit.id;
      }
      setSuggestedCategoryId(suggested);

      setValues((v) => ({
        ...v,
        amount: r.totalAmount ? Number(r.totalAmount) : 0,
        currency: (r.currency as typeof v.currency) || "IDR",
        date: r.date ? new Date(r.date).toISOString().slice(0, 10) : v.date,
        merchant: r.merchant ?? "",
        sourceId: sData.sources?.[0]?.id ?? "",
        categoryId: suggested || (cData.categories as Option[])?.find((c) => c.kind === "expense")?.id || "",
      }));
    })();
  }, [id]);

  const expenseCategories = useMemo(() => categories.filter((c) => c.kind === "expense"), [categories]);

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!values.sourceId || !values.categoryId || !values.amount) {
      toast({ kind: "error", message: "Lengkapi source, kategori, dan amount" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/receipts/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          date: new Date(values.date).toISOString(),
          merchant: values.merchant || null,
          note: values.note || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ kind: "error", message: data?.error ?? "Gagal confirm" });
        return;
      }
      toast({ kind: "success", message: "Transaksi ter-create dari receipt" });
      router.push(`/transactions/${data.transaction.id}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onDiscard() {
    if (!confirm("Hapus receipt ini?")) return;
    const res = await fetch(`/api/receipts/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/receipts");
    }
  }

  if (!receipt) return <div className="card p-5 text-sm text-slate-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Review Receipt</h1>
          <p className="text-sm text-slate-500">
            Status: <span className={receipt.status === "confirmed" ? "text-emerald-600" : "text-amber-600"}>{receipt.status}</span>
          </p>
        </div>
        {receipt.status !== "confirmed" && (
          <button type="button" className="btn-outline" onClick={onDiscard}>
            Hapus receipt
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card p-4">
          <div className="mb-3 text-sm font-medium">Gambar</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/receipts/${id}/image`}
            alt="receipt"
            className="w-full rounded-lg border border-slate-200"
          />
          {receipt.items.length > 0 && (
            <>
              <div className="mt-4 text-sm font-medium">Items (dari OCR)</div>
              <table className="table-base mt-2">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.name}</td>
                      <td className="text-right">{it.quantity ?? "-"}</td>
                      <td className="text-right">
                        {it.total ? formatMoney(it.total, receipt.currency ?? "IDR") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="card p-5">
          {receipt.status === "confirmed" ? (
            <div className="space-y-3 text-sm">
              <p className="text-emerald-700">Sudah ter-confirm jadi transaksi.</p>
              {receipt.transaction && (
                <a href={`/transactions/${receipt.transaction.id}`} className="btn-outline">
                  Lihat transaksi
                </a>
              )}
            </div>
          ) : (
            <form className="space-y-3" onSubmit={onConfirm}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input mt-1"
                    value={values.amount || ""}
                    onChange={(e) => setValues((v) => ({ ...v, amount: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select
                    className="input mt-1"
                    value={values.currency}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, currency: e.target.value as typeof v.currency }))
                    }
                  >
                    <option value="IDR">IDR</option>
                    <option value="MYR">MYR</option>
                    <option value="USD">USD</option>
                    <option value="SGD">SGD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Tanggal</label>
                <input
                  type="date"
                  required
                  className="input mt-1"
                  value={values.date}
                  onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Source</label>
                  <select
                    required
                    className="input mt-1"
                    value={values.sourceId}
                    onChange={(e) => setValues((v) => ({ ...v, sourceId: e.target.value }))}
                  >
                    <option value="">— pilih —</option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">
                    Kategori{" "}
                    {suggestedCategoryId &&
                      values.categoryId === suggestedCategoryId && (
                        <span className="ml-1 rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-normal text-emerald-700">
                          saran OCR
                        </span>
                      )}
                  </label>
                  <select
                    required
                    className="input mt-1"
                    value={values.categoryId}
                    onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value }))}
                  >
                    <option value="">— pilih —</option>
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Merchant</label>
                <input
                  className="input mt-1"
                  value={values.merchant}
                  onChange={(e) => setValues((v) => ({ ...v, merchant: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Note</label>
                <textarea
                  className="input mt-1 min-h-[80px]"
                  value={values.note}
                  onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? "Menyimpan..." : "Confirm → Jadikan Transaksi"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

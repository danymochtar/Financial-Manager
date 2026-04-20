"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { TransactionForm, type TransactionFormValues } from "@/components/TransactionForm";
import { formatMoney } from "@/lib/currency";
import { Trash2 } from "lucide-react";

export default function TxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [tx, setTx] = useState<
    | ({
        amount: string;
        amountIDR: string;
        amountMYR: string;
        receipt?: { id: string; imagePath: string } | null;
      } & Partial<TransactionFormValues> & { id: string; currency: string; date: string; type: "income" | "expense" })
    | null
  >(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/transactions/${id}`)
      .then((r) => r.json())
      .then((d) => setTx(d.transaction));
  }, [id]);

  async function onDelete() {
    if (!confirm("Yakin hapus transaksi ini?")) return;
    setBusy(true);
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      toast({ kind: "error", message: "Gagal hapus" });
      return;
    }
    toast({ kind: "success", message: "Terhapus" });
    router.push("/transactions");
    router.refresh();
  }

  if (!tx) return <div className="card p-5 text-sm text-slate-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Detail Transaksi</h1>
        <button className="btn-danger" onClick={onDelete} disabled={busy}>
          <Trash2 className="h-4 w-4" /> Hapus
        </button>
      </div>

      <div className="card p-5 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Amount asli</span>
          <span className="font-medium">{formatMoney(tx.amount, tx.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Equivalent IDR</span>
          <span>{formatMoney(tx.amountIDR, "IDR")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Equivalent MYR</span>
          <span>{formatMoney(tx.amountMYR, "MYR")}</span>
        </div>
        {tx.receipt && (
          <div className="pt-2">
            <div className="label mb-1">Receipt</div>
            <a href={`/api/receipts/${tx.receipt.id}/image`} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/receipts/${tx.receipt.id}/image`}
                alt="Receipt"
                className="max-h-64 rounded-lg border border-slate-200"
              />
            </a>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-semibold">Edit</h2>
        <TransactionForm
          txId={id}
          submitLabel="Update"
          initial={{
            type: tx.type,
            sourceId: (tx as unknown as { sourceId: string }).sourceId,
            categoryId: (tx as unknown as { categoryId: string }).categoryId,
            amount: Number(tx.amount),
            currency: tx.currency as TransactionFormValues["currency"],
            date: new Date(tx.date).toISOString().slice(0, 10),
            merchant: (tx as unknown as { merchant: string | null }).merchant,
            note: (tx as unknown as { note: string | null }).note,
          }}
        />
      </div>
    </div>
  );
}

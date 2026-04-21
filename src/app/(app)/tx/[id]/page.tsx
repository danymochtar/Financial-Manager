"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { TransactionForm, type TransactionFormValues } from "@/components/TransactionForm";
import { formatMoney } from "@/lib/currency";
import { Trash2 } from "lucide-react";

export default function TxDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [tx, setTx] = useState<
    | ({
        amount: string;
        amountIDR: string;
        amountMYR: string;
        receipt?: { id: string } | null;
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
    if (!confirm("Hapus transaksi?")) return;
    setBusy(true);
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      toast({ kind: "error", message: "Gagal hapus" });
      return;
    }
    toast({ kind: "success", message: "Kehapus" });
    router.push("/tx");
    router.refresh();
  }

  if (!tx) return <div className="card p-5 text-sm text-slate-500">Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Detail</h1>
        <button className="btn-ghost text-xs text-rose-600" onClick={onDelete} disabled={busy}>
          <Trash2 className="h-3 w-3" /> Hapus
        </button>
      </div>

      <div className="card p-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Amount</span>
          <span className="font-semibold">{formatMoney(tx.amount, tx.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Equiv IDR</span>
          <span>{formatMoney(tx.amountIDR, "IDR")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Equiv MYR</span>
          <span>{formatMoney(tx.amountMYR, "MYR")}</span>
        </div>
      </div>

      {tx.receipt && (
        <div className="card overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/receipts/${tx.receipt.id}/image`} alt="" className="w-full" />
        </div>
      )}

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold">Edit</h2>
        <TransactionForm
          txId={id}
          submitLabel="Update"
          initial={{
            type: tx.type,
            accountId: (tx as unknown as { accountId: string }).accountId,
            categoryId: (tx as unknown as { categoryId: string }).categoryId,
            amount: Number(tx.amount),
            currency: tx.currency as TransactionFormValues["currency"],
            date: new Date(tx.date).toISOString().slice(0, 10),
            merchant: (tx as unknown as { merchant: string | null }).merchant,
            note: (tx as unknown as { note: string | null }).note,
            isBoros: (tx as unknown as { isBoros: boolean }).isBoros ?? false,
          }}
        />
      </div>
    </div>
  );
}
